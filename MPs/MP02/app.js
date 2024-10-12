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
 * Compile the vertex shader and fragment shader, then link them to the program.
 * @param {string} vs_source - The vertex shader source
 * @param {string} fs_source - The fragment shader source
 * @returns {WebGLProgram} - The compiled and linked WebGL program
 */
function compileShader(vs_source, fs_source) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vs_source);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fs_source);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }

    console.log("Shaders compiled and program linked.");

    // Extract uniform locations and store them in the program
    const uniforms = {};
    for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
        const info = gl.getActiveUniform(program, i);
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    program.uniforms = uniforms;

    return program;
}

/**
 * Setup the geometry based on the JSON file.
 * @param {Object} geom - The geometry data
 * @returns {Object} - The VAO and drawing information
 */
function setupGeometry(geom) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Setup position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array(geom.position.flat());
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Enable position attribute at location 0
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    // Setup color buffer
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    const color = geom.attributes.color[0]; 
    const colorArray = [];
    for (let i = 0; i < geom.position.length; i++) {
        colorArray.push(...color);  
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArray), gl.STATIC_DRAW);

    // Enable color attribute at location 1
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    // Set up the index buffer for triangles
    const logoIndices = new Uint16Array(geom.triangles.flat());
    const logoIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, logoIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, logoIndices, gl.STATIC_DRAW);

    const outlineVao = gl.createVertexArray();
    gl.bindVertexArray(outlineVao);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    
    // Setup color buffer for outline
    const outlineColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, outlineColorBuffer);
    const outlineColor = geom.attributes.outlineColor[0];
    const outlineColorArray = [];
    for (let i = 0; i < geom.position.length; i++) {
        outlineColorArray.push(...outlineColor);
        // console.log(outlineColor);  // Debugging
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(outlineColorArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    // Set up index buffer for outline - how values are connected into shapes.
    const outlineIndices = new Uint16Array(geom.edges.flat());
    const outlineIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, outlineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, outlineIndices, gl.STATIC_DRAW);

    console.log("Geometries setup done");
    return {
        mode: gl.TRIANGLES,
        count: logoIndices.length,
        vao: vao,
        outlineMode: gl.LINES,
        outlineCount: outlineIndices.length,
        outlineVao: outlineVao
    };
}


/**
 * Compute the transformation matrix
 * @param {number} time - time in milliseconds.
 * @param {HTMLCanvasElement} canvas - The canvas
 * @returns {Float32Array} Computed transformation matrix.
 */
function computeMatrix(time, canvas) {
    time *= 0.001;  // Convert time to seconds

    // Translation
    const translationX = Math.sin(time) * 0.45;
    const translationY = Math.sin(time) * 0.3;
    const translationMatrix = m4trans(translationX, translationY, 0);

    // Rotation
    const angle = time/2;  // Rotate based on time
    const rotationMatrix = m4rotZ(angle);

    // aspect ratio correction - to be applied before any other transformation
    const aspectRatio = canvas.width / canvas.height;
    const aspectMatrix = m4scale(1 / aspectRatio, 1, 1);
    // Uniform scaling
    const scale = Math.sin(time) * 0.3 + 0.7;  // Scale between 0.5 and 1.0
    const scaleMatrix = m4scale(scale, scale, scale);

    // Translation * Rotation * Scaling
    return m4mul(aspectMatrix, translationMatrix, rotationMatrix, scaleMatrix);
}

/*
 * Draw the geometry with the given transformation.
 * @param {number} milliseconds - Time in milliseconds to compute transformations.
 */
function draw(milliseconds) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    // Update the transformation matrix uniform
    const matrix = computeMatrix(milliseconds, document.querySelector('canvas'));
    gl.uniformMatrix4fv(program.uniforms.u_matrix, false, matrix);

    gl.bindVertexArray(geom.vao);
    gl.drawElements(geom.mode, geom.count, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(geom.outlineVao);
    gl.drawElements(geom.outlineMode, geom.outlineCount, gl.UNSIGNED_SHORT, 0);

    console.log("Drawing Frame.");    // Debugging
}

/**
 * The animation tick function called every frame.
 * @param {number} milliseconds - Current time in milliseconds.
 */
function tick(milliseconds) {
    draw(milliseconds);
    requestAnimationFrame(tick);    // asks browser to call tick before next frame
}

/**
 * async functions return a Promise instead of their actual result.
 * Because of that, they can `await` for other Promises to be fulfilled,
 * which makes functions that call `fetch` or other async functions cleaner.
 */
window.addEventListener('load', async () => {
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

    if (!program) return;

    // Load and set up geometry
    const geomData = await fetch('Logo-geometry.json').then(res => res.json());
    console.log("Loaded geometry data:", geomData);  

    window.geom = setupGeometry(geomData);
    draw();
    // Start the animation loop immediately
    requestAnimationFrame(tick);    // asks browser to call tick before next frame
});
