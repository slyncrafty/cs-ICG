"use strict";

// Global Variables
const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
let colorProgram, textureProgram;
let textureMode = false;
let texture = null;
let inColor = [1,1,1,1.0];//[1,1,1,0.3];

let eyePos = [3, 3, 1];
let forward = [0, 0, -1];
const globalUp = [0, 1, 0];
const defaultColor = [0.8, 0.8, 0.8];


/**
 * Parse OBJ file into geometry data
 * @param {string} text 
 * @returns {object} parsed obj data
 */
function parseOBJText(text) {
    const objPositions = [];
    const objNormals = [];
    const objTexcoords = [];
    const objColors = []; // Default color
    const vertices = [];
    const normals = [];
    const colors = [];
    const texCoords = [];
    const indices = [];

    // Map to avoid duplicating vertex data and keep track of indices
    const indexMap = new Map();

    // Define parsing functions for each keyword
    const keywords = {
        v(parts) {
            const position = parts.slice(0, 3).map(Number); // Parse x, y, z
            //console.log(position);  // Debugging
            objPositions.push(position);
            // console.log(objPositions);  // Debugging
            const color = parts.length > 3 ? parts.slice(3, 6).map(Number) : defaultColor;
            objColors.push(color);
            //console.log("Color: ", color);        // Debugging
        },
        vn(parts) {
            objNormals.push(parts.map(Number)); // Parse normal vector
        },
        vt(parts) {
            objTexcoords.push(parts.slice(0, 2).map(Number)); // Parse u, v
        },
        f(parts) {
            // Triangulate polygons with more than 3 vertices
            const numTriangles = parts.length - 2;
            for (let t = 0; t < numTriangles; ++t) {
                indices.push(
                    getIndex(parts[0]),
                    getIndex(parts[t + 1]),
                    getIndex(parts[t + 2])
                );
            }
        },
    };

    // Process each line of the OBJ text
    const lines = text.split('\n');
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue; // Skip empty or comment

        const [keyword, ...args] = trimmedLine.split(/\s+/);
        const handler = keywords[keyword];
        if (handler) {
            handler(args); 
        }
    }

    /**
     * Get index for a vertex
     * @param {string} vertex 
     * @returns {number} index of vertex
     */
    function getIndex(vert) {
        if (indexMap.has(vert)) return indexMap.get(vert);

        const ptn = vert.split('/');
        const index = indexMap.size;

        const posIdx = parseInt(ptn[0] || '1') - 1;
        const texIdx = parseInt(ptn[1] || '1') - 1;
        const normIdx = parseInt(ptn[2] || '1') - 1;

        const position = objPositions[posIdx];
        const normal = objNormals[normIdx];
        const color = objColors[posIdx]; 
        const texCoord = objTexcoords[texIdx];

        // Store in arrays as separate entries
        vertices.push(position);
        colors.push(color || defaultColor);
        normals.push(normal || [0, 0, 0]);
        texCoords.push(texCoord || [0, 0]);

        // Store new index in map and return it
        indexMap.set(vert, index);
        return index;
    }

    if (vertices.length === 0) { console.log("Vertices 0"); }
    if (normals.length === 0) { console.log("normals 0"); normals.push(0, 0, 1); }
    if (colors.length === 0) { console.log("colors 0"); colors.push(0.8, 0.8, 0.8);}

    // Return data structure (geomData)
    const geomData = {
        attributes: [vertices, normals, colors],
        texCoords: texCoords,
        triangles: indices,
    };
    // console.log("Geomdata length: ", geomData.attributes.length); // Debugging
    // console.log("Geomdata: ", geomData);  // Debugging
    return geomData;
}

/**
 * Centers and scales vertices to fit within a target scale and position.
 * Ensures consistent scaling across multiple objects for uniform lighting appearance.
 * @param {Array} vertices - Array of vertex positions [[x, y, z], ...].
 * @param {number} targetScale - Desired size of the largest dimension after scaling (default is 3.0).
 * @param {Array} center - Desired center of the object [x, y, z] (default is [0, 0, 0]).
 */
function scaleAndCenter(vertices, targetScale = 3.0, center = [0, 0, 0]) {
    // Step 1: Calculate the bounding box to determine size and center
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];
    let sum = [0, 0, 0];

    vertices.forEach(vertex => {
        const [x, y, z] = vertex;

        // Update min and max
        min[0] = Math.min(min[0], x);
        min[1] = Math.min(min[1], y);
        min[2] = Math.min(min[2], z);

        max[0] = Math.max(max[0], x);
        max[1] = Math.max(max[1], y);
        max[2] = Math.max(max[2], z);

        // Sum positions for centroid calculation
        sum[0] += x;
        sum[1] += y;
        sum[2] += z;
    });

    const numVertices = vertices.length;
    const currentCenter = [sum[0] / numVertices, sum[1] / numVertices, sum[2] / numVertices];

    // Calculate scaling factor
    const extents = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    const maxExtent = Math.max(...extents);
    const scale = targetScale / maxExtent;

    // Center and scale the vertices
    vertices.forEach(vertex => {
        vertex[0] = (vertex[0] - currentCenter[0]) * scale + center[0];
        vertex[1] = (vertex[1] - currentCenter[1]) * scale + center[1];
        vertex[2] = (vertex[2] - currentCenter[2]) * scale + center[2];
    });
}



/**
 * Parses the OBJ file from a URL.
 * @param {string} url - The URL to fetch the OBJ file from.
 * @returns {object|null} - The parsed geometry data or null if an error occurred.
 */
async function parseOBJ(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch OBJ file: ${response.statusText}`);
        }
        const text = await response.text();
        const geomData = parseOBJText(text);
        
        scaleAndCenter(geomData.attributes[0], 2.0); // scale and center the obj
        console.log("normals: ", geomData.attributes[1].length, " " , geomData.attributes[1][0]);

        // Check if normals are all default (0,0,0), indicating missing normals
        const normalsAllDefault = geomData.attributes[1].every(normal => normal[0] === 0 && normal[1] === 0 && normal[2] === 0);
        if (normalsAllDefault) {
            console.log("Generating normals...");
            geomData.attributes[1] = generateNormals(geomData.attributes[0], geomData.triangles);
        }
        console.log("normals: ", geomData.attributes[1].length, " " , geomData.attributes[1][0]);
        console.log("Parsed obj ", geomData.attributes[0][0].length)    // Debugging
        return geomData;
    } catch (error) {
        console.error("Error parsing OBJ:", error);
        return null;
    }
}

/**
 * Generates normals for the geometry if they are missing.
 * @param {array} vertices - The array of vertex positions.
 * @param {array} indices - The array of triangle indices.
 * @returns {array} - The generated normals.
 */
function generateNormals(vertices, indices) {
    const normalsGenerated = Array(vertices.length).fill().map(() => [0, 0, 0]); // Initialize normals as an array of [0, 0, 0]

    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];

        const v0 = vertices[i0];
        const v1 = vertices[i1];
        const v2 = vertices[i2];

        const u = sub(v1, v0);
        const v = sub(v2, v0);
        const normal = normalize(cross(u, v));

        // Accumulate normals for each vertex of the face
        for (let j = 0; j < 3; j++) {
            normalsGenerated[i0][j] += normal[j];
            normalsGenerated[i1][j] += normal[j];
            normalsGenerated[i2][j] += normal[j];
        }
    }

    // Normalize each accumulated normal
    for (let i = 0; i < normalsGenerated.length; i++) {
        normalsGenerated[i] = normalize(normalsGenerated[i]);
    }

    return normalsGenerated;
}


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
    // 0 positions, 1 normals, 2 colors
    if (geomData.attributes[0] && geomData.attributes[0].length) {
        console.log("geomData.attributes[0] length ok");
    } else {
        console.error("Position attribute is missing or empty.");
    }
    for (let i = 0; i < geomData.attributes.length; i++) {
        if(geomData.attributes[i]){
            const data = geomData.attributes[i];
            supplyDataBuffer(data, i);
        }
    }

    // Setup texture coordinate buffer, if available
    if (geomData.texCoords) {
        const data = geomData.texCoords;
        supplyDataBuffer(data, 3);
    }

    // Setup index buffer
    const indices = new Uint16Array(geomData.triangles.flat());
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    console.log("Geometry setup complete.");  // Debugging

    // Return the VAO and index buffer information for rendering
    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: vao,
    };
}


async function main() {
    const canvas = document.querySelector('canvas');
    window.gl = initWebGL2(canvas);
    if (!gl) return;

    // Set globalUp WebGL viewport and clear the screen
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    fillScreen();
    window.addEventListener('resize', fillScreen);
    
    document.querySelector('#submit').addEventListener('click', async (event) => {
        const objFile = document.getElementById('filePath').value.trim();
        console.log("OBJ file provided: ", objFile);
        if (!objFile) {
            console.error("OBJ file is required");
            return;
        }
        const geomData = await parseOBJ(objFile);
        if(!geomData)
        {
            console.log("OBJ parsing failed");
        }
        console.log("OBJ parsing successful.");

        window.geom = setupGeometry(geomData);

        // Fetch and compile shaders
        const vs = await loadShaderSource('color-vertex-shader.glsl');
        const fs = await loadShaderSource('color-fragment-shader.glsl');
        colorProgram = compileShader(vs, fs);
        const vsf = await loadShaderSource('texture-vertex-shader.glsl');
        const fsf = await loadShaderSource('texture-fragment-shader.glsl');
        textureProgram = compileShader(vsf, fsf);
        // if (colorProgram || textureProgram) {
        //     console.error("Failed to compile shader programs.");
        //     return;
        // }
        
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        if (!window.animationStarted) {
            requestAnimationFrame(tick);  // Start the rendering loop once
            window.animationStarted = true; // Set a flag to prevent multiple calls
        }    
    });

    document.getElementById('material').addEventListener('change', (event) => {
        processTexture();
        console.log("Material detected... ", event.target.value);
    });

    
}

function draw(seconds) {
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    window.program = textureMode ? textureProgram : colorProgram;
    gl.useProgram(program);
    if(textureMode && texture)
    {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(program.uniforms.u_texture, 0);
        console.log("texture program...");
    }
    else
    {
        //gl.uniform4fv(program.uniforms.u_color, inColor);
        console.log("Color program...");
    }
    gl.bindVertexArray(geom.vao);

    const angle = seconds * 0.2;
    const lightdir = [5, 50, 50];
    const modelMatrix = m4rotY(angle);
    const viewMatrix = m4view(eyePos, [0, 0, 0], globalUp);
    const mv = m4mul(m4mul(viewMatrix, modelMatrix), m4rotX(Math.PI/2 * 3));
    //const mv = m4mul(viewMatrix, modelMatrix);

    gl.uniformMatrix4fv(program.uniforms.mv, false, mv);
    gl.uniformMatrix4fv(program.uniforms.p, false, window.p);
    gl.uniform3fv(program.uniforms.lightdir, lightdir);
    gl.uniform3fv(program.uniforms.lightcolor, [1, 1, 1]);
    gl.uniform3fv(program.uniforms.specularColor, [1, 1, 1]);

    gl.drawElements(geom.mode, geom.count, geom.type, 0);
    console.log("Drawing...");
}

function tick(milliseconds) {
    draw(milliseconds / 1000);
    requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', main);

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
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip y axis
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
}
