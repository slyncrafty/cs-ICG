/**
 * Set up WebGL context and shaders.
 * @param {HTMLCanvasElement} canvas 
 * @returns {WebGL2RenderingContext} - The WebGL2 context
 */
function initWebGL2(canvas) {
    const gl = canvas.getContext("webgl2",  { preserveDrawingBuffer: true });
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
    // console.log("attributes: ", geom.attributes);
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

let position = [0, 0, 0];
window.keys = {};
window.addEventListener('keydown', event => keys[event.key] = true);
window.addEventListener('keyup', event => keys[event.key] = false);

/** Draw one frame 
 *  key input controls location of the octahedron object
 *  e  q : nearer, deeper 
 *  a, d : left, right (of screen)
 *  w, s : up, down (of the screen)
*/
function draw(seconds) {
    gl.clearColor(...IlliniBlue) // f(...[1,2,3]) means f(1,2,3)
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program)

    const viewMatrix = m4view([15, 15, 30], [0, 0, 0], [0, 1, 0]); 
    gl.uniformMatrix4fv(program.uniforms.p, false, window.p);

    const step = 0.03;
    // Check which keys are being pressed and update the position
    if (keys['q']) position = add(position, [0, 0, -step]);
    if (keys['e']) position = add(position, [0, 0, step]);
    if (keys['a']) position = add(position, [-step, 0, 0]);
    if (keys['d']) position = add(position, [step, 0, 0]);
    if (keys['w']) position = add(position, [0, step, 0]);
    if (keys['s']) position = add(position, [0, -step, 0]);

    const modelMatrix = m4trans(position[0], position[1], position[2]);
    //gl.uniformMatrix4fv(program.uniforms.mv, false, modelMatrix);

    // Bind and draw the Octahedron
    const sunScaleF = 1.0
    gl.bindVertexArray(octahedron.vao);
    let sunScale = m4scale(sunScaleF, sunScaleF, sunScaleF);  
    let sunModelView = m4mul(viewMatrix, sunScale); 
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(modelMatrix, sunModelView));
    gl.drawElements(octahedron.mode, octahedron.count, octahedron.type, 0);
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
