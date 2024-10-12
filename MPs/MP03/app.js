async function loadShaderSource(url) {
    const response = await fetch(url);
    return response.text();
}

/**
 * Set up WebGL context and shaders.
 * @param {HTMLCanvasElement} canvas 
 * @returns {WebGL2RenderingContext} - The WebGL2 context
 */
function initWebGL2(canvas) {
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        console.error("WebGL2 not available.");  // Debugging
        return null;
    }
    console.log("WebGL2 context initialized.");     // Debugging
    return gl;
}

/**
 * Given the source code of a vertex and fragment shader, compiles them,
 * and returns the linked program.
 */
function compileShader(vs_source, fs_source) {
    const vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, vs_source)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, fs_source)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
    
    const uniforms = {}
    for(let i=0; i<gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i+=1) {
        let info = gl.getActiveUniform(program, i)
        uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }
    program.uniforms = uniforms

    return program
}


/**
 * Sends per-vertex data to the GPU and connects it to a VS input
 * 
 * @param data    a 2D array of per-vertex data (e.g. [[x,y,z,w],[x,y,z,w],...])
 * @param loc     the layout location of the vertex shader's `in` attribute
 * @param mode    (optional) gl.STATIC_DRAW, gl.DYNAMIC_DRAW, etc
 * 
 * @returns the ID of the buffer in GPU memory; useful for changing data later
 */
function supplyDataBuffer(data, loc, mode) {
    if (mode === undefined) mode = gl.STATIC_DRAW
    
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    const f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode)
    
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    
    return buf;
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
    console.log("attributes: ", geom.attributes);
    for(let i=0; i<geom.attributes.length; i+=1) {
        let data = geom.attributes[i];
        supplyDataBuffer(data, i);
    }

    var indices = new Uint16Array(geom.triangles.flat());
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: vao
    }
}

function makeGeom() {
    g = {"triangles":
        []
    ,"attributes":
        [ // position
            []
        , // color
            []
        ]
    }
    g.attributes[0].push([0,0,0])
    g.attributes[1].push([1,1,1])
    const n = 24
    const r = 3
    for(let i=0; i<n; i+=1) {
        let ang = i*(2*Math.PI)/n
        let r2 = r - (i%2)
        g.attributes[0].push(
            [Math.cos(ang)*r2,0,Math.sin(ang)*r2],
        )
        g.attributes[1].push([0,(i%2),0])
    }
    for(let i=0; i<n-1; i+=1) {
        g.triangles.push(0, i+1, i+2)
    }
    g.triangles.push(0, n, 1)
    console.log("Geometry made");
    return g
}


const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1]);
const IlliniOrange = new Float32Array([1, 0.373, 0.02, 1]);
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

/** Draw one frame */
function draw(seconds) {
    gl.clearColor(...IlliniBlue) // f(...[1,2,3]) means f(1,2,3)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program)

    const viewMatrix = m4view([2, 2, 20], [0, 0, 0], [0, 1, 0]); // camera view
    gl.uniformMatrix4fv(program.uniforms.p, false, window.p);

    // Bind and draw the Tetrahedrons
    // 1. The Sun: 
    // large octahedron
    // fixed at the origin
    // Spinning a full rotation / 2 sec
    const sunScaleF = 2.0
    gl.bindVertexArray(octahedron.vao);
    let sunScale = m4scale(sunScaleF, sunScaleF, sunScaleF);  
    let sunSpinRotation = m4rotY(seconds * Math.PI);                         // Full rotation / 2 sec
    let sunModelView = m4mul(viewMatrix, m4mul(sunSpinRotation, sunScale));  // Apply rotation at scale
    gl.uniformMatrix4fv(program.uniforms.mv, false, sunModelView);
    gl.drawElements(octahedron.mode, octahedron.count, octahedron.type, 0);

    // 2. The Earth:
    // Small octahedron
    // orbiting the Sun once every few sec
    // Spinning several times a sec
    const earthDist = 8;
    const earthScaleF = sunScaleF/2;
    const earthOrbitSpeed = seconds;
    const earthSpinSpeed = earthOrbitSpeed * 2 * Math.PI;
    gl.bindVertexArray(octahedron.vao);
    let earthScale = m4scale(earthScaleF, earthScaleF, earthScaleF);    // Earth Scale
    let earthSpinRotation = m4rotY(earthSpinSpeed);                     // Earth spins 2 times / sec
    let earthTranslation = m4trans(earthDist, 0, 0);                    // Earth's distance from the Sun
    let earthOrbitRotation = m4rotY(earthOrbitSpeed);                   // Earth orbits Sun at origin
    let earthModelView = m4mul(viewMatrix, m4mul(earthOrbitRotation, m4mul(earthTranslation, earthSpinRotation, earthScale)));
    gl.uniformMatrix4fv(program.uniforms.mv, false, earthModelView);
    gl.drawElements(octahedron.mode, octahedron.count, octahedron.type, 0);

    // 3. Mars
    // octahedron  a little smaller than the Earth
    // 1.6 times as far from the Sun as the Earth
    // Orbitting the Sun 1.9 times slower than the Earth
    // spinning like a top 2.2 times slower than the Earth
    const marsScaleF = earthScaleF * 0.8;                         // Mars smaller than Earth
    const marsSpinSpeed = earthSpinSpeed / 2.2;          
    gl.bindVertexArray(octahedron.vao);
    let marsScale = m4scale(marsScaleF, marsScaleF, marsScaleF); 
    let marsSpinRotation = m4rotY(marsSpinSpeed);                // Mars spins slower than Earth
    let marsTranslation = m4trans(1.6*earthDist, 0, 0);          // Mars 1.6 times farther than Earth
    let marsOrbitRotation = m4rotY(earthOrbitSpeed / 1.9);       // Mars orbits slower than Earth
    let marsModelView = m4mul(viewMatrix, m4mul(marsOrbitRotation, m4mul(marsTranslation, marsSpinRotation, marsScale)));
    gl.uniformMatrix4fv(program.uniforms.mv, false, marsModelView);
    gl.drawElements(octahedron.mode, octahedron.count, octahedron.type, 0);

    // 4. The Moon 
    // tetrahedron 
    // smaller than the Earth
    // orbiting the Earth faster than the Earth orbits the Sun but slower than the Earth spins
    // always presenting the same side of itself to the Earth
    const moonScaleF = earthScaleF * 0.3
    const moonOrbitSpeed = earthOrbitSpeed * 1.5 
    gl.bindVertexArray(tetrahedron.vao);
    let moonScale = m4scale(moonScaleF, moonScaleF, moonScaleF); 
    let moonSpinRotation = m4rotY(moonOrbitSpeed);              // Moon spins same speed as it orbits
    let moonTranslation = m4trans(2, 0, 0);                     // Distance from Earth
    let moonOrbitRotation = m4rotY(moonOrbitSpeed);             // Moon orbits Earth faster
    let moonModelView = m4mul(earthModelView, m4mul(moonOrbitRotation, m4mul(moonTranslation, moonSpinRotation, moonScale)));
    gl.uniformMatrix4fv(program.uniforms.mv, false, moonModelView);  
    gl.drawElements(tetrahedron.mode, tetrahedron.count, tetrahedron.type, 0);

    // 5. Phobos
    // tetrahedron
    // smaller than Mars
    // orbiting Mars several times faster than Mars spins
    // always presenting the same side of itself to Mars
    const phobosOrbitSpeed = marsSpinSpeed * 3;
    const phobosDist = 1.5;
    const phobosScaleF = marsScaleF * 0.6;
    gl.bindVertexArray(tetrahedron.vao);
    let phobosScale = m4scale(phobosScaleF, phobosScaleF, phobosScaleF); 
    let phobosSpinRotation = m4rotY(phobosOrbitSpeed);           // Phobos spins same speed as it orbits                 
    let phobosTranslation = m4trans(phobosDist, 0, 0);           // Distance from Mars
    let phobosOrbitRotation = m4rotY(phobosOrbitSpeed);          // Phobos orbits Mars faster
    let phobosModelView = m4mul(marsModelView, m4mul(phobosOrbitRotation, m4mul(phobosTranslation, phobosSpinRotation, phobosScale)));
    gl.uniformMatrix4fv(program.uniforms.mv, false, phobosModelView);  
    gl.drawElements(tetrahedron.mode, tetrahedron.count, tetrahedron.type, 0);

    // 6. Deimos
    // tetrahedron, half the size of Phobos
    // orbiting Mars only a little faster than Mars spins
    // always presenting the same side of itself to Mars
    const deimosScaleF = phobosScaleF * 0.5;
    const deimosOrbitSpeed = marsSpinSpeed * 1.3;
    gl.bindVertexArray(tetrahedron.vao);
    let deimosScale = m4scale(deimosScaleF, deimosScaleF, deimosScaleF);
    let deimosSpinRotation = m4rotY(deimosOrbitSpeed);           // Deimos spins same speed as it orbits
    let deimosTranslation = m4trans(phobosDist*2, 0, 0);         // Twice as far as Phobos from Mars
    let deimosOrbitRotation = m4rotY(deimosOrbitSpeed);       // Deimos orbits Mars faster
    let deimosModelView = m4mul(marsModelView, m4mul(deimosOrbitRotation, m4mul(deimosTranslation, deimosSpinRotation, deimosScale)));
    gl.uniformMatrix4fv(program.uniforms.mv, false, deimosModelView);  // No self-rotation
    gl.drawElements(tetrahedron.mode, tetrahedron.count, tetrahedron.type, 0);

    console.log("Drawing...");
}

/** Compute any time-varying or animated aspects of the scene */
function tick(milliseconds) {
    let seconds = milliseconds / 1000;

    draw(seconds)
    requestAnimationFrame(tick)
}

/** Resizes the canvas to completely fill the screen */
function fillScreen() {
    let canvas = document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100vw'
    canvas.style.height = '100vh'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
    if (window.gl) {
        gl.viewport(0,0, canvas.width, canvas.height)
        const fieldOfView = Math.PI/3;  
        const near = 0.1;  
        const far = 100.0;    
        window.p = m4perspNegZ(near,far, fieldOfView, canvas.width, canvas.height);
    }
}

/** 

/** 
 * Compile, link, set up geometry
 * async functions return a Promise instead of their actual result.
 * Because of that, they can `await` for other Promises to be fulfilled,
 * which makes functions that call `fetch` or other async functions cleaner.
 */
window.addEventListener('load', async (event) => {
    const canvas = document.querySelector('canvas');
    window.gl = initWebGL2(canvas);

    if (!gl) return;

    // Set up WebGL viewport and clear the screen
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Fetch and compile shaders
    const vs = await fetch('vertex-shader.glsl').then(res => res.text());
    const fs = await fetch('fragment-shader.glsl').then(res => res.text());
    window.program = compileShader(vs, fs);
    gl.enable(gl.DEPTH_TEST);

    if (!program) return;

    // Load and set up geometry
    const geomData = await fetch('geometry.json').then(res => res.json());
    console.log("Loaded geometry data:", geomData);  

    const tetrahedronData = {
        triangles: geomData.triangles[0],
        attributes: [geomData.attributes.positions[0], geomData.attributes.color[0]]
    };
    const octahedronData = {
        triangles: geomData.triangles[1],
        attributes: [geomData.attributes.positions[1], geomData.attributes.color[1]]
    };
    window.tetrahedron = setupGeometry(tetrahedronData); 
    window.octahedron = setupGeometry(octahedronData); 

    const aspectRatio = canvas.width / canvas.height;
    
    window.geom2 = setupGeometry(makeGeom())
    fillScreen()
    window.addEventListener('resize', fillScreen)
    requestAnimationFrame(tick)
})

/**
 * Canvas resizing
 */
window.addEventListener('resize', () => {
        const canvas = document.querySelector('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    
        gl.viewport(0, 0, canvas.width, canvas.height);
});
