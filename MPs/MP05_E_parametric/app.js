const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
/** Resizes the canvas to completely fill the screen */
function fillScreen() {
    let canvas = document.querySelector('canvas');
    document.body.style.margin = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas.style.width = '';
    canvas.style.height = '';
    if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        const fieldOfView = Math.PI / 3;
        const near = 0.1;
        const far = 10.0;
        window.p = m4perspNegZ(near, far, fieldOfView, canvas.width, canvas.height);
    }
}

window.addEventListener('resize', () => {
    const canvas = document.querySelector('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
});


function generateGeometry(num_slices, num_rings, checkbox){
    const vertices = [];
    const normals = [];
    const indices = [];
    const lineIndices = [];
    window.geomData = {
        attributes: [
            vertices,
            normals
        ],
        triangles: indices,
        wireframe: lineIndices
    };
    if(checkbox && num_slices >= 3 && num_rings >= 3){
        torusGeometry(num_slices, num_rings);
    }
    else if(!checkbox && num_slices >=3 && num_rings >= 1)
    {
        sphereGeometry(num_slices, num_rings);
    }
    else
    {
        console.log("Invalid combination of inputs.")
    }
    window.geom = setupGeometry(geomData);
    console.log("Generate geometry...");        // Debugging
    
    if (!window.animationStarted) {
        requestAnimationFrame(tick);  
        window.animationStarted = true; 
    }

    console.log("Vertices: ", geomData.attributes[0].length);     // Debugging
    console.log("Indices: ", geomData.triangles.length);
}

/**
 * Creates sphere geometry and populates geomData
 * https://en.wikipedia.org/wiki/Sphere
 * x = x0 + r sin(theta) cos(phi)
 * y = y0 + r sin(theta) sin(phi)
 * z = z0 + r cos(theta)
 * @param {*} num_slices 
 * @param {*} num_rings 
 */
function sphereGeometry(num_slices, num_rings){
    const ringStep = Math.PI / (num_rings + 1);  // Latitude step (rings)
    const sliceStep = 2.0 * Math.PI / num_slices;  // Longitude step (slices)

    geomData.attributes[0] = [];  
    geomData.attributes[1] = []; 
    geomData.triangles = [];
    geomData.wireframe = [];

    // Add top pole vertex
    geomData.attributes[0].push([0, 1, 0]);  // Top pole at (0, 1, 0)
    geomData.attributes[1].push([0, 1, 0]);  

    // Generate vertices and normals
    for (let i = 1; i <= num_rings; i++) {
        const phi = i * ringStep;  
        const sPhi = Math.sin(phi);
        const cPhi = Math.cos(phi);

        for (let j = 0; j < num_slices; j++) {
            const theta = j * sliceStep;  
            const sTheta = Math.sin(theta);
            const cTheta = Math.cos(theta);

            const x = sPhi * cTheta;
            const y = cPhi;
            const z = sPhi * sTheta;

            // Push vertex position and normal (for a unit sphere, position = normal)
            geomData.attributes[0].push([x, y, z]);  // Position
            geomData.attributes[1].push([x, y, z]);  // Normal
        }
    }
    geomData.attributes[0].push([0, -1, 0]);  // Bottom pole at (0, -1, 0)
    geomData.attributes[1].push([0, -1, 0]);  

    for (let j = 0; j < num_slices; j++) {
        const firstSlice = j + 1;                     // First vertex in the first ring
        const nextSlice = (j + 1) % num_slices + 1;   // Next vertex, wrapping around the slice

        // Triangle: Top pole, first vertex in slice, next vertex in slice
        geomData.triangles.push(0, firstSlice, nextSlice);

        // Wireframe (optional)
        geomData.wireframe.push(0, firstSlice);
        geomData.wireframe.push(firstSlice, nextSlice);
    }

    // Middle rings (quads formed by two triangles)
    for (let i = 0; i < num_rings - 1; i++) {  // Loop through each ring
        for (let j = 0; j < num_slices; j++) {  // Loop through each slice
            const first = i * num_slices + j + 1;          // Current vertex in the ring
            const second = (i + 1) * num_slices + j + 1;   // Vertex in the next ring

            // Wrap around at the end of each slice
            const firstp1 = (j + 1) % num_slices + i * num_slices + 1;
            const secondp1 = (j + 1) % num_slices + (i + 1) * num_slices + 1;

            // Two triangles for each quad
            geomData.triangles.push(first, second, firstp1);
            geomData.triangles.push(second, secondp1, firstp1);

            // Wireframe
            geomData.wireframe.push(first, second);      // Vertical line
            geomData.wireframe.push(first, firstp1);     // Horizontal line
            geomData.wireframe.push(second, secondp1);   // Vertical line in the next ring
        }
    }

    // Bottom cap (triangles connecting to the bottom pole)
    const bottomPoleIndex = geomData.attributes[0].length - 1;  // Last vertex is the bottom pole
    const lastRingStart = bottomPoleIndex - num_slices;         // Start of the last ring

    for (let j = 0; j < num_slices; j++) {
        const firstSlice = lastRingStart + j;                     // First vertex in the last ring
        const nextSlice = lastRingStart + (j + 1) % num_slices;   // Next vertex, wrapping around

        // Triangle: Bottom pole, first vertex in slice, next vertex in slice
        geomData.triangles.push(bottomPoleIndex, firstSlice, nextSlice);

        // Wireframe
        geomData.wireframe.push(bottomPoleIndex, firstSlice);
        geomData.wireframe.push(firstSlice, nextSlice);
    }
}

/**
 * Creates torus geometry and populates geomData
 * https://en.wikipedia.org/wiki/Torus
 * x = (R + r cos(theta)) cos(phi)
 * y = (R + r cos(theta)) sin(phi)
 * z = r sin(theta)
 * @param {*} num_slices 
 * @param {*} num_rings 
 */

function torusGeometry(num_slices, num_rings){
    console.log("Creating torus...");
    const R = 1.0;
    const r = 0.6;

    const ringStep = 2.0 * Math.PI / num_slices;
    const sliceStep = 2.0 * Math.PI / num_rings;

    for (let i = 0; i < num_slices; i++) {
        const theta = i * ringStep;
        const cTheta = Math.cos(theta);
        const sTheta = Math.sin(theta);

        for (let j = 0; j < num_rings; j++) {
            const phi = j * sliceStep;
            const cPhi = Math.cos(phi);
            const sPhi = Math.sin(phi);

            const x = (R + r * cPhi) * cTheta;
            const y = r * sPhi;
            const z = (R + r * cPhi) * sTheta;
            //normals
            const nx = cPhi * cTheta;
            const ny = sPhi;
            const nz = cPhi * sTheta;

            geomData.attributes[0].push([x, y, z]);
            geomData.attributes[1].push([nx, ny, nz]);
        }
    }

    for (let i = 0; i < num_slices; i++) {
        for (let j = 0; j < num_rings; j++) {
            const first = i * (num_rings) + j;
            const second = ((i + 1) % num_slices) * num_rings + j;
            const firstp1 = (first + 1) % num_rings + first - j;
            const secondp1 = (second + 1) % num_rings + second - j;
            geomData.triangles.push(first, second, firstp1);
            geomData.triangles.push(second, secondp1, firstp1);

            geomData.wireframe.push(first, second);
            geomData.wireframe.push(first, firstp1);
            geomData.wireframe.push(second, secondp1);
        }
    }
    
}


/**
 * Creates a Vertex Array Object and puts into it all of the data in the given
 * JSON structure, which should have the following form:
 * 
 * ````
 * {"triangles": a list of of indices of vertices
 * ,"attributes":
 *  [ a list of 1-, 2-, 3-, or 4-vectors, one per vertex to go in location 0
 *  , a list of 1-, 2-, 3-, or 4-vectors, one per vertex to go in location 1
 *  , ...
 *  ]
 * }
 * ````
 * 
 * @returns an object with four keys:
 *  - mode = the 1st argument for gl.drawElements
 *  - count = the 2nd argument for gl.drawElements
 *  - type = the 3rd argument for gl.drawElements
 *  - vao = the vertex array object for use with gl.bindVertexArray
 */
function setupGeometry(geom) {
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    console.log("attributes: ", geom.attributes);   // Debugging
    for(let i=0; i<geom.attributes.length; i+=1) {
        let data = geom.attributes[i];
        supplyDataBuffer(data, i);
    }

    var indices = new Uint16Array(geom.triangles.flat());
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    var wireIndices = new Uint16Array(geom.wireframe.flat());
    const wireIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, wireIndices, gl.STATIC_DRAW);
    
    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: vao,
        indexBuffer: indexBuffer, 
        wireCount: wireIndices.length,
        wireIndexBuffer: wireIndexBuffer,
    }
}



/*
 * Draw the geometry with the given transformation.
 * @param {number} milliseconds - Time in milliseconds to compute transformations.
 */
function draw(seconds) {
    gl.clearColor(...IlliniBlue);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    gl.bindVertexArray(geom.vao);
 
    time = seconds;
    const angle = time * 0.2;
    const eyePos = [3, 3, 1];  
    const viewMatrix = m4mul(m4view(eyePos, [0, 0, 0], [0, 1, 0]), m4rotY(-angle));
    const modelMatrix = IdentityMatrix;
    // Camera position in world coordinates
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(viewMatrix, modelMatrix));
    gl.uniformMatrix4fv(program.uniforms.p, false, window.p);

    // Set up the light source
    const lightdir = normalize([1, 1, 1]);
    gl.uniform3fv(program.uniforms.lightdir, lightdir);
    gl.uniform3fv(program.uniforms.lightcolor, [1, 1, 1]);
    // const h = normalize(add(lightdir , [0,0,1]));
    // gl.uniform3fv(program.uniforms.H, h);

    const lightdir2 = normalize([-2, -2, 1]);
    gl.uniform3fv(program.uniforms.lightdir2, lightdir2);
    gl.uniform3fv(program.uniforms.lightcolor2, [0.5, 0.0, 0.5]);
    // const h2 = normalize(add(lightdir2 , [0,0,1]));
    // gl.uniform3fv(program.uniforms.H2, h2);

    const diffuseColor = [1.0, 1.0, 1.0];
    gl.uniform3fv(program.uniforms.diffuseColor, diffuseColor);
    const specularColor = [1.0, 1.0, 1.0];             
    gl.uniform3fv(program.uniforms.specularColor, specularColor);

    gl.uniform1i(program.uniforms.isLine, false);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indexBuffer);
    gl.drawElements(geom.mode, geom.count, geom.type, 0);

    if(wireCheckbox){
        gl.uniform1i(program.uniforms.isLine, true); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.wireIndexBuffer);
        gl.drawElements(gl.LINES, geom.wireCount, geom.type, 0);
    }
    

    console.log("Drawing...");
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
    const vs = await fetch('shader-vertex.glsl').then(res => res.text());
    const fs = await fetch('shader-fragment.glsl').then(res => res.text());
    window.program = compileShader(vs, fs);
    if (!program) return;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    fillScreen();
    window.addEventListener('resize', fillScreen);

    document.querySelector('#submit').addEventListener('click', event => {
        window.checkbox = document.querySelector('#torus').checked;
        window.wireCheckbox = document.querySelector('#wire').checked;
        window.num_slices = Number(document.querySelector('#num_slices').value);
        window.num_rings = Number(document.querySelector('#num_rings').value);
        //console.log("Number of Slices: " + num_slices + " , Number of Rings: " + num_rings + " , torus: " + checkbox);  // Debugging
        generateGeometry(num_slices, num_rings, checkbox);
        console.log("Number of vertices: " + geomData.attributes[0].length + " :: " + num_slices*num_rings + " || Number of triangles: " + geomData.triangles.length / 3 + " :: " + 2*num_slices*num_rings);  // Debugging

    }); 

})