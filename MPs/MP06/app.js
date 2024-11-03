
// Global Variables
const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
let colorProgram, textureProgram;
let textureMode = false;
let texture = null;
let inColor = [1,1,1,0.3]; 

let eyePos = [3, 3, 1];
let forward = [0, 0, -1];
const globalUp =[0, 1, 0];

// window.keysBeingPressed = {};
// const movingSpeed = 0.01;
// const rotationSpeed = 0.01;
// window.addEventListener('keydown', event => keysBeingPressed[event.key] = true);
// window.addEventListener('keyup', event => keysBeingPressed[event.key] = false);

// let yaw = 0;
// let pitch = 0;
// const pitchLimit = Math.PI / 2 - 0.01;



/**
 * Setup geometry
 * @returns an object with four keys:
 *  - mode = the 1st argument for gl.drawElements
 *  - count = the 2nd argument for gl.drawElements
 *  - type = the 3rd argument for gl.drawElements
 *  - vao = the vertex array object for use with gl.bindVertexArray
 */
function setupGeometry(geomData) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    // Setup attributes buffer
    for (let i = 0; i < geomData.attributes.length; i++) {
        const data = geomData.attributes[i];
        supplyDataBuffer(data, i);
    }

    // Setup TexCoords buffer
    const texCoords = new Float32Array(geomData.texCoords.flat());
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(2); 

    // Setup index buffer
    const indices = new Uint16Array(geomData.triangles.flat());
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    console.log("Geometry setup");
    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: vao,
    };
}


/**
 * Create square Grid of (gridsize *  gridsize)
 * @param {*} gridsize - input gridsize from user
 * @returns {Object} - The generated grid data points & indices
 */
function createGrid(gridsize) {
    const vertices = [];
    const texCoords = [];
    const step = 2 / (gridsize-1); // -1 to 1
    // console.log("Step size:", step);     // Debugging
    for (let i = 0; i < gridsize; i++) {
        for (let j = 0; j < gridsize; j++) {
            const x = -1 + j * step;
            const z = -1 + i * step;
            vertices.push([x, 0, z]);
            texCoords.push([j / (gridsize - 1), i / (gridsize - 1)]); // added for Texture mapping
        }
    }
    // console.log(vertices);   // Debugging
    return {vertices, texCoords};
}

function createTriGrid(gridsize) {
    const indices = [];
    for (let i = 0; i < gridsize - 1; i++) {
        for (let j = 0; j < gridsize - 1; j++) {
            const topLeft = i * gridsize + j;
            const bottomLeft = (i + 1) * gridsize + j;
            indices.push([topLeft, bottomLeft, bottomLeft + 1]);
            indices.push([topLeft, bottomLeft + 1, topLeft + 1]);
        }
    }
    return indices;
}


/**
 * Displace the vertices in the grid with faults
 * displacement determined based on the distance from random fault plane
 */
function applyFaults(vertices, gridsize, faults) {
    for (let i = 0; i < faults; i++) {
        // random p fault plane center
        const p = [Math.random() * 2 - 1, Math.random() * 2 - 1];
        const theta = Math.random() * 2 * Math.PI;
        const n = [Math.cos(theta), Math.sin(theta), 0];

        for (let j = 0; j < vertices.length; j++) {
            // Get the 2d position of the vertex
            const b = [vertices[j][0], vertices[j][2]];
            const bP = sub(b, p);              // Vector from fault center to vertex
            const dotProduct = dot(bP, n);

            // Only displace vertices that are within a certain distance from the fault center
            const R = gridsize / 10;    // adjust 
            const displacement = g(Math.abs(dotProduct), R); 
            // displacement 
            if (dotProduct >= 0) {
                vertices[j][1] += displacement;
            } else {
                vertices[j][1] -= displacement;
            }
            
        }
    }
    normalizeHeights(vertices);
}

/**
 * Smooth displacement function(distance-weighted displacement)
 * @param {*} r : dot product distance
 * @param {*} R : Radius of effect (scale for displacement)
 * @returns Quartic smooth step function
 */
function g(r, R) {
    return r < R ? Math.pow(1 - (r / R) ** 2, 2) * 0.05 : 0;
}

/**
 * Normalize heights rescale the displacement heights
 * height′=c(height− 1/2(max+min)) / (max−min)​, c: constant, highest peak height
 * @param {*} vertices
 */
function normalizeHeights(vertices) {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < vertices.length; i ++) {
        const height = vertices[i][1];
        min = Math.min(min, height);
        max = Math.max(max, height);
    }
    const c = 1.0;
    for (let i = 0; i < vertices.length; i++) {
        vertices[i][1] = c * (vertices[i][1] - 0.5 * (max + min)) / (max - min);
    }
}

/**
 * Compute normals and add to geomdata
 * @param {*} positions
 * @param {*} gridsize 
 */
function addNormals(positions, gridsize) {
    const normals = [];

    for (let i = 0; i < positions.length; i++) {
        const idx_i = Math.floor(i / gridsize);
        const idx_j = i % gridsize;

        // (n - s) x (w - e)
        const idx_n = idx_i > 0 ? (idx_i - 1) * gridsize + idx_j : i;
        const idx_s = idx_i < gridsize - 1 ? (idx_i + 1) * gridsize + idx_j : i;
        const idx_w = idx_j > 0 ? idx_i * gridsize + idx_j - 1 : i;
        const idx_e = idx_j < gridsize - 1 ? idx_i * gridsize + idx_j + 1 : i;
        // Diagonals (NE, SW, NW, SE)
        const idx_ne = (idx_i > 0 && idx_j < gridsize - 1) ? (idx_i - 1) * gridsize + (idx_j + 1) : i;
        const idx_sw = (idx_i < gridsize - 1 && idx_j > 0) ? (idx_i + 1) * gridsize + (idx_j - 1) : i;
        const idx_nw = (idx_i > 0 && idx_j > 0) ? (idx_i - 1) * gridsize + (idx_j - 1) : i;
        const idx_se = (idx_i < gridsize - 1 && idx_j < gridsize - 1) ? (idx_i + 1) * gridsize + (idx_j + 1) : i;
        /*      nw  n   ne

                w   v   e
        
                sw  s   se      */      
        const n = positions[idx_n];
        const s = positions[idx_s];
        const w = positions[idx_w];
        const e = positions[idx_e];
        const ne = positions[idx_ne];
        const sw = positions[idx_sw];
        const nw = positions[idx_nw];
        const se = positions[idx_se];

        // Calculate the normal using the main neighbors
        const v1 = sub(n, s);
        const v2 = sub(w, e);
        let normal = cross(v1, v2);

        // diagonal neighbors with a weighted average
        const v3 = sub(ne, sw);
        const v4 = sub(nw, se);
        const diagonalNormal = cross(v3, v4);

        // 2((n−s)×(w−e))+1((ne−sw)×(nw−se)) / 3
        normal = add(mul(normal, 2), diagonalNormal);
        normal = normalize(normal);  // Normalize

        normals.push(normal);
    }

    return normals;
}


// Function to generate terrain vertices and normals
function generateTerrain(gridsize, faults) {
    console.log("Generating Terrain...");
    const {vertices, texCoords} = createGrid(gridsize);
    const indices = createTriGrid(gridsize);

    if (faults > 0) {
        applyFaults(vertices, gridsize, faults);
    }
    //console.log(Object.keys(geomData.attributes));    // Debugging
    const normals = addNormals(vertices, gridsize);
    const geomData = {
        attributes: [
            vertices,
            normals
        ],
        texCoords: texCoords,
        triangles: indices,
    };
    window.terrain = setupGeometry(geomData);
    if (!window.animationStarted) {
        requestAnimationFrame(tick);  // Start the rendering loop once
        window.animationStarted = true; // Set a flag to prevent multiple calls
    }    
    console.log("Vertices: ", vertices.length, " ", gridsize*gridsize);     // Debugging
    console.log("Indices: ", indices.length, " " , ((gridsize-1)*(gridsize-1)*2))       // Debugging
    console.log("TexCoords: ", texCoords.length);       // Debugging
}


/*
 * Draw the geometry with the given transformation.
 * @param {number} milliseconds - Time in milliseconds to compute transformations.
 */
function draw(seconds) {
    gl.clearColor(...IlliniBlue); //gl.clearColor(1,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    window.program = textureMode ? textureProgram : colorProgram;
    gl.useProgram(program);
    if(textureMode && texture)
    {
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(program.uniforms.u_texture, texture);
        console.log("texture program...");
    }
    else
    {
        gl.uniform4fv(program.uniforms.u_color, inColor);
        console.log("Color program...");
    }
    gl.bindVertexArray(terrain.vao);

    time = seconds;
    const angle = time * 0.2;
    //const eyePos = [3, 3, 1];
    const viewMatrix = m4mul(m4view(eyePos, [0, 0, 0], [0, 1, 0]), m4rotY(angle));  
    //computeCamera();
    //const viewMatrix = m4view(eyePos, add([0,0,0], forward), globalUp);
    //const viewMatrix = m4view(eyePos, add(eyePos, forward), globalUp);
    const modelMatrix = IdentityMatrix;
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(viewMatrix, modelMatrix));
    gl.uniformMatrix4fv(program.uniforms.p, false, window.p);

    // Set globalUp the light source
    const lightdir = normalize([1, 2, 1]);
    gl.uniform3fv(program.uniforms.lightdir, lightdir);
    gl.uniform3fv(program.uniforms.lightcolor, [1, 1, 1]);
    const specularColor = [1.0, 1.0, 1.0];             
    gl.uniform3fv(program.uniforms.specularColor, specularColor);
    

    gl.drawElements(terrain.mode, terrain.count, terrain.type, 0);

    //console.log("Drawing...");
}

/**
 * The animation tick function called every frame.
 * @param {number} milliseconds - Current time in milliseconds.
 */
function tick(milliseconds) {
    let seconds = milliseconds / 1000;
    draw(seconds);
    requestAnimationFrame(tick);    // asks browser to call tick before next frame
}

/** 
 * Compile, link, set globalUp geometry
 * async functions return a Promise instead of their actual result.
 * Because of that, they can `await` for other Promises to be fulfilled,
 * which makes functions that call `fetch` or other async functions cleaner.
 */
window.addEventListener('load', async (event) => {
    const canvas = document.querySelector('canvas');
    window.gl = initWebGL2(canvas);
    if (!gl) return;

    // Set globalUp WebGL viewport and clear the screen
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Fetch and compile shaders
    const vs = await fetch('color-vertex-shader.glsl').then(res => res.text());
    const fs = await fetch('color-fragment-shader.glsl').then(res => res.text());
    colorProgram = compileShader(vs, fs);
    const vsf = await fetch('texture-vertex-shader.glsl').then(res => res.text());
    const fsf = await fetch('texture-fragment-shader.glsl').then(res => res.text());
    textureProgram = compileShader(vsf, fsf);
    if (!colorProgram || !textureProgram) {
        console.error("Failed to compile shader programs.");
        return;
    }

    // window.program = textureMode ? compileShader(vsf, fsf) : compileShader(vs, fs);
    // if (!program) return;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    //generateTerrain(gridsize, faults);
    fillScreen();
    window.addEventListener('resize', fillScreen);
    window.gridsize = 50;
    window.faults = 50;
    generateTerrain(gridsize, faults);

    document.querySelector('#submit').addEventListener('click', (event) => {
        window.gridsize = Number(document.querySelector('#gridsize').value) || 50;
        window.faults = Number(document.querySelector('#faults').value) || 50;
        generateTerrain(gridsize, faults);
        console.log("Generating Terrain...");
    });
    document.getElementById('material').addEventListener('change', (event) => {
        processTexture();
        console.log("Material detected... ", event.target.value);
    });

})

function processTexture(){
    const inValue = document.getElementById('material').value.trim();
    console.log("input color or texture detected: ", inValue);
    if (inValue === '') {
        textureMode = false;
        inColor = [1,1,1,0.3]; 
        console.log("No color input");
    } else if (/^#[0-9a-f]{8}$/i.test(inValue)) {
        // Parse hex color
        inColor = [
            Number('0x' + inValue.substr(1, 2), 16) / 255,    
            Number('0x' + inValue.substr(3, 2), 16) / 255,
            Number('0x' + inValue.substr(5, 2), 16) / 255,
            Number('0x' + inValue.substr(7, 2), 16) / 255,
        ];
        console.log("In color : ", inColor);
        textureMode = false;
    } else if (/[.](jpg|png)$/i.test(inValue)) {
        // Load texture
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = inValue; // urlOfImageAsString
        img.addEventListener('load', () => {
            texture = createTexture(gl, img);
            textureMode = true;
            console.log("Texture loaded successfully");     // Debugging
        });
        img.addEventListener('error', () => {
            inColor = [1.0, 0.0, 1.0, 0.0];
            textureMode = false;
            console.log("Failed to load texture!");     // Debugging
        });
    }
}

/**
 * Create Texture
 * Reference: https://webgl2fundamentals.org/webgl/lessons/webgl-3d-textures.html
 * @param {*} gl 
 * @param {*} image 
 * @returns 
 */
function createTexture(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
}

// function handleCameraLock() {
//     if (cameraLock) {
//         // locks the camera to a fixed position relative to the earth and when released lets it fly free again.
//         const earthOffset = [0, 1, 3] // [0, 3, 5];
//         eyePos = add(earthPosition, earthOffset);
//         forward = normalize(sub(earthPosition, eyePos));  // Look at the Earth
//     }
// }

// function computeCamera(){
//     const yawDir = normalize(cross(forward, globalUp));

//     // // pitch camera
//     // if (keysBeingPressed['ArrowUp']) {
//     //     // Look up
//     //     forward = rotateAroundAxis(forward, yawDir, rotationSpeed);
//     // }
//     // if (keysBeingPressed['ArrowDown']) {
//     //     // Look down
//     //     forward = rotateAroundAxis(forward, yawDir, -rotationSpeed);
//     // }
//     // if (keysBeingPressed['ArrowLeft']) {
//     //     // Look left
//     //     forward = rotateAroundAxis(forward, globalUp, rotationSpeed);
//     // }
//     // if (keysBeingPressed['ArrowRight']) {
//     //     // Look right
//     //     forward = rotateAroundAxis(forward, globalUp, -rotationSpeed);
//     // }

//     // pitch camera
//     if (keysBeingPressed['ArrowUp']) {
//         // Look up
//         pitch = Math.max(-pitchLimit, Math.min(pitch + rotationSpeed, pitchLimit)); 
//     }
//     if (keysBeingPressed['ArrowDown']) {
//         // Look down
//         pitch = Math.max(-pitchLimit, Math.min(pitch - rotationSpeed, pitchLimit)); 
//     }
//     if (keysBeingPressed['ArrowLeft']) {
//         // Look left
//         yaw -= rotationSpeed;  
//     }
//     if (keysBeingPressed['ArrowRight']) {
//         // Look right
//         yaw += rotationSpeed;  
//     }

//     // Forward vector based on yaw and pitch rad 
//     forward[0] = Math.cos(pitch) * Math.sin(yaw);
//     forward[1] = Math.sin(pitch);
//     forward[2] = -Math.cos(pitch) * Math.cos(yaw);
//     forward = normalize(forward);


//     // Camera w: forward; s: backward
//     if (keysBeingPressed['w']) {
//         eyePos = add(eyePos, mul(forward, movingSpeed));
//     }
//     if (keysBeingPressed['s']) {
//         eyePos = sub(eyePos, mul(forward, movingSpeed));
//     }
//     // Camera Yaw; a: left, d: right
//     if (keysBeingPressed['a']) {
//         eyePos = sub(eyePos, mul(yawDir, movingSpeed));
//     }
//     if (keysBeingPressed['d']) {
//         eyePos = add(eyePos, mul(yawDir, movingSpeed));
//     }
//     // // Camera q: up; e: down
//     // if (keysBeingPressed['q']) {
//     //     eyePos = sub(eyePos, mul(globalUp, movingSpeed));
//     // }
//     // if (keysBeingPressed['e']) {
//     //     eyePos = add(eyePos, mul(globalUp, movingSpeed));
//     // }
// }



// // Rotate a vector around an arbitrary axis by an angle (in radians)
// // function rotateAroundAxis(vec, axis, theta) {
// //     const c = Math.cos(theta);
// //     const s = Math.sin(theta);
// //     const axis = normalize(axis);
// //     const dotProduct = dot(vec, axis);
// //     const crossProduct = cross(axis, vec);

// //     return add(mul(vec, c), add(mul(crossProduct, s), mul(axis, dotProduct * (1 - c))));
// // }

// function rotateAroundAxis(vec, axis, angle) {
//     const c = Math.cos(angle); // cos(θ)
//     const s = Math.sin(angle); // sin(θ)

//     // Normalize the axis
//     const r = normalize(axis);
//     const [rx, ry, rz] = r;

//     // Compute rotation matrix
//     const m11 = rx * rx * (1 - c) + c;
//     const m12 = rx * ry * (1 - c) - rz * s;
//     const m13 = rx * rz * (1 - c) + ry * s;

//     const m21 = ry * rx * (1 - c) + rz * s;
//     const m22 = ry * ry * (1 - c) + c;
//     const m23 = ry * rz * (1 - c) - rx * s;

//     const m31 = rz * rx * (1 - c) - ry * s;
//     const m32 = rz * ry * (1 - c) + rx * s;
//     const m33 = rz * rz * (1 - c) + c;

//     const res = [
//         [m11, m12, m13],
//         [m21, m22, m23],
//         [m31, m32, m33]
//     ];
//     return res.map(row => dot(row, vec));
// }

