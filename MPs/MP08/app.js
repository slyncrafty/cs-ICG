// // Global Variables

const cube = 1.0;
const numSpheres = 50;
const maxSpeed = 3.0;
const gravity = 0.9;
const elasticity = 0.9;
const radius = 0.075;    // 0.15 * cube width / 2
const timeInterval = 15000;     // 15 sec
const EPS = 1e-4;

let lastTime = 0;
let timeSinceLastReset = 0;
let spheres = [];

let eyePos = [2, 2, 2];
const globalUp = [0, 1, 0];


// return random from range (min,max)
const getRandomRange = (min, max) => Math.random() * (max - min) + min;

class Sphere {
    constructor(position, velocity, color){
        this.position = position;
        this.velocity = velocity;
        this.color = color;
    }
}

const fVal = 0.2 //starting velocity range
function generateSpheres(){
    spheres = [];
    let bound = cube / 2 - radius;
    for (let i = 0; i < numSpheres; i++)
    {
        const position = [
            // getRandomRange(-bound + radius, bound - radius),
            // getRandomRange(-bound + radius, bound - radius),
            // getRandomRange(-bound + radius, bound - radius),
            getRandomRange(-bound, bound),
            getRandomRange(-bound, bound),
            getRandomRange(-bound, bound),
        ];
        const velocity = [
            getRandomRange(-fVal, fVal), 
            getRandomRange(-fVal, fVal), 
            getRandomRange(-fVal, fVal), 
        ];
        
        const color = [Math.random(), Math.random(), Math.random()];
        spheres.push(new Sphere(position, velocity, color));
        //console.log("sphere generated... ", i, " ", color);       // Debugging
        //console.log(spheres.length);      // Debugging
    }
}

const f = 0.9; 
/**
 * Updates momentum val over time -- changing velocity of each sphere
 * Handles wall-sphere collision and sphere-sphere collisions.
 * @param {*} deltaT 
 */
function updatePhysics(deltaT) {
    spheres.forEach((sphere, i) => {
        if (isNaN(deltaT) || deltaT <= 0) {
            console.error("deltaT invalid: ", deltaT);
            return;
        }

        // Gravity
        const G = -gravity * deltaT;
        sphere.velocity = add(sphere.velocity, [0, G, 0]);

        //speed limit cap
        const speed = Math.hypot(...sphere.velocity);
        if (speed > maxSpeed) {
            sphere.velocity = mul(normalize(sphere.velocity), maxSpeed);
        }

        // Euler's Method to update positions
        sphere.position = add(sphere.position, mul(sphere.velocity, deltaT));
        //sphere.velocity = add(sphere.velocity, mul(G, deltaT));

        const bound = cube/2;
        // wall collisions
        for (let j = 0; j < 3; j++) {
            if (sphere.position[j] - radius < -bound) {
                sphere.position[j] = -bound + radius;
                sphere.velocity[j] = -elasticity * sphere.velocity[j];
            } 
            else if (sphere.position[j] + radius > bound) 
            {
                sphere.position[j] = bound - radius;
                sphere.velocity[j] = -elasticity * sphere.velocity[j];
            } 
        }

        // // sphere collisions
        // for (let i = 0; i < spheres.length; i++) {
        //     for (let j = i + 1; j < spheres.length; j++) { 
        //         // Ensure momentum is resolved once
        //         const sphereOne = spheres[i];
        //         const sphereTwo = spheres[j];
        //         const relativePos = sub(sphereTwo.position, sphereOne.position);
        //         const dist2 = dot(relativePos, relativePos);
        //         const minDist = 2 * radius; 
    
        //         if (dist2 < minDist * minDist) {
        //             const dist = Math.sqrt(dist2);
        //             if (dist === 0) continue;

        //             const d = div(relativePos, dist);

        //             const overlap = minDist - dist;
        //             const correction = mul(d, overlap / 2);
        //             sphereOne.position = sub(sphereOne.position, correction);
        //             sphereTwo.position = add(sphereTwo.position, correction); 
                    
        //             // velocity parallel to the dir of collision
        //             const s_1 = dot(sphereOne.velocity, d);
        //             const s_2 = dot(sphereTwo.velocity, d);
        //             const S = s_1 - s_2;
                    
        //             // detecting overlap
        //             if (S > 0) continue;
    
        //             const impulse = -(1 + elasticity) * S / 2;  // same w
        //             const impulseVec = mul(d, impulse);
    
        //             // Update velocities
        //             sphereOne.velocity = add(sphereOne.velocity, impulseVec);
        //             sphereTwo.velocity = sub(sphereTwo.velocity, impulseVec);
        //         }
        //     }
        // }

        // Sphere collisions
        for (let k = i + 1; k < spheres.length; k++) 
        {
            const other = spheres[k];
            const relativePos = sub(sphere.position, other.position);
            const dist2 = dot(relativePos, relativePos);
            const minDist = 2 * radius;
        
            if (dist2 < minDist * minDist) {
                const dist = Math.sqrt(dist2);
                if (dist === 0) continue; 
        
                // Collision Normal Direction
                const d = div(relativePos, dist);
        
                // Relative speed
                const s_i = dot(sphere.velocity, d);
                const s_j = dot(other.velocity, d);
                const s = s_i - s_j; // Net collision speed
        
                // Resolving if Moving Towards each Other
                if (s >= 0) continue;
        
                // Compute Velocity Changes
                const delta_v_i = mul(d, -0.5 * (1 + elasticity) * s);
                const delta_v_j = mul(d, 0.5 * (1 + elasticity) * s);
        
                // Update Velocities
                sphere.velocity = add(sphere.velocity, delta_v_i);
                other.velocity = add(other.velocity, delta_v_j);
        
                // Correct Positions to Resolve Overlap
                const overlap = minDist - dist;
                if (overlap > EPS) {
                    const correction = mul(d, overlap / 2);
                    sphere.position = add(sphere.position, correction);
                    other.position = sub(other.position, correction);
                }
            }
        }
    
        //console.log("Updating physics...");
    });
}


// sphere.json values used to create sphere geometry
function generateSphereGeometry(radius) {
    // Sphere data from the JSON
    const sphereJSON = {
        "attributes":
        [
          [[0.850651,0.525731,0]
          ,[0,-0.850651,0.525731]
          ,[0,0.850651,-0.525731]
          ,[0,-0.850651,-0.525731]
          ,[0,-1,0]
          ,[1,0,0]
          ,[-1,0,0]
          ,[0.809017,0.309017,0.5]
          ,[0.809017,0.309017,-0.5]
          ,[-0.809017,0.309017,0.5]
          ,[-0.809017,0.309017,-0.5]
          ,[-0.850651,0.525731,0]
          ,[0.5,0.809017,0.309017]
          ,[0.5,-0.809017,0.309017]
          ,[0.5,0.809017,-0.309017]
          ,[0.5,-0.809017,-0.309017]
          ,[0.809017,-0.309017,0.5]
          ,[0.809017,-0.309017,-0.5]
          ,[-0.5,0.809017,0.309017]
          ,[-0.809017,-0.309017,0.5]
          ,[-0.5,0.809017,-0.309017]
          ,[-0.809017,-0.309017,-0.5]
          ,[0.850651,-0.525731,0]
          ,[0,0,1]
          ,[-0.5,-0.809017,0.309017]
          ,[0.309017,0.5,0.809017]
          ,[0,0,-1]
          ,[0.309017,-0.5,0.809017]
          ,[-0.5,-0.809017,-0.309017]
          ,[-0.309017,0.5,0.809017]
          ,[0.309017,0.5,-0.809017]
          ,[-0.309017,-0.5,0.809017]
          ,[0.309017,-0.5,-0.809017]
          ,[-0.850651,-0.525731,0]
          ,[-0.309017,0.5,-0.809017]
          ,[-0.309017,-0.5,-0.809017]
          ,[0,1,0]
          ,[0.525731,0,0.850651]
          ,[0.525731,0,-0.850651]
          ,[-0.525731,0,0.850651]
          ,[-0.525731,0,-0.850651]
          ,[0,0.850651,0.525731]
          ]
        ,
          [[0.8507,0.5257,0]
          ,[0,-0.8507,0.5257]
          ,[0,0.8507,-0.5257]
          ,[0,-0.8507,-0.5257]
          ,[0,-1,0]
          ,[1,0,0]
          ,[-1,0,0]
          ,[0.809,0.309,0.5]
          ,[0.809,0.309,-0.5]
          ,[-0.809,0.309,0.5]
          ,[-0.809,0.309,-0.5]
          ,[-0.8507,0.5257,0]
          ,[0.5,0.809,0.309]
          ,[0.5,-0.809,0.309]
          ,[0.5,0.809,-0.309]
          ,[0.5,-0.809,-0.309]
          ,[0.809,-0.309,0.5]
          ,[0.809,-0.309,-0.5]
          ,[-0.5,0.809,0.309]
          ,[-0.809,-0.309,0.5]
          ,[-0.5,0.809,-0.309]
          ,[-0.809,-0.309,-0.5]
          ,[0.8507,-0.5257,0]
          ,[0,0,1]
          ,[-0.5,-0.809,0.309]
          ,[0.309,0.5,0.809]
          ,[0,0,-1]
          ,[0.309,-0.5,0.809]
          ,[-0.5,-0.809,-0.309]
          ,[-0.309,0.5,0.809]
          ,[0.309,0.5,-0.809]
          ,[-0.309,-0.5,0.809]
          ,[0.309,-0.5,-0.809]
          ,[-0.8507,-0.5257,0]
          ,[-0.309,0.5,-0.809]
          ,[-0.309,-0.5,-0.809]
          ,[0,1,0]
          ,[0.5257,0,0.8507]
          ,[0.5257,0,-0.8507]
          ,[-0.5257,0,0.8507]
          ,[-0.5257,0,-0.8507]
          ,[0,0.8507,0.5257]
          ]
        ]
      ,"triangles":
        [[0,5,8]
        ,[0,7,5]
        ,[0,8,14]
        ,[0,12,7]
        ,[0,14,12]
        ,[1,4,13]
        ,[1,13,27]
        ,[1,24,4]
        ,[1,27,31]
        ,[1,31,24]
        ,[2,14,30]
        ,[2,20,36]
        ,[2,30,34]
        ,[2,34,20]
        ,[2,36,14]
        ,[3,4,28]
        ,[3,15,4]
        ,[3,28,35]
        ,[3,32,15]
        ,[3,35,32]
        ,[4,15,13]
        ,[4,24,28]
        ,[5,7,16]
        ,[5,16,22]
        ,[5,17,8]
        ,[5,22,17]
        ,[6,9,11]
        ,[6,10,21]
        ,[6,11,10]
        ,[6,19,9]
        ,[6,21,33]
        ,[6,33,19]
        ,[7,12,25]
        ,[7,25,37]
        ,[7,37,16]
        ,[8,17,38]
        ,[8,30,14]
        ,[8,38,30]
        ,[9,18,11]
        ,[9,19,39]
        ,[9,29,18]
        ,[9,39,29]
        ,[10,11,20]
        ,[10,20,34]
        ,[10,34,40]
        ,[10,40,21]
        ,[11,18,20]
        ,[12,14,36]
        ,[12,36,41]
        ,[12,41,25]
        ,[13,15,22]
        ,[13,16,27]
        ,[13,22,16]
        ,[15,17,22]
        ,[15,32,17]
        ,[16,37,27]
        ,[17,32,38]
        ,[18,29,41]
        ,[18,36,20]
        ,[18,41,36]
        ,[19,24,31]
        ,[19,31,39]
        ,[19,33,24]
        ,[21,28,33]
        ,[21,35,28]
        ,[21,40,35]
        ,[23,25,29]
        ,[23,27,37]
        ,[23,29,39]
        ,[23,31,27]
        ,[23,37,25]
        ,[23,39,31]
        ,[24,33,28]
        ,[25,41,29]
        ,[26,30,38]
        ,[26,32,35]
        ,[26,34,30]
        ,[26,35,40]
        ,[26,38,32]
        ,[26,40,34]
        ]
      }
      
    const rawPositions = sphereJSON.attributes[0];
    const positions = rawPositions.map((p) => mul(p, radius));
    const normals = rawPositions.map(normalize);
    const indices = sphereJSON.triangles.flat();
    console.log("Generate sphere geometry ...");        // Debugging
    console.log("attributes-positions: ", sphereJSON.attributes[0].length);     // Debugging
    console.log("attributes-normals: ", sphereJSON.attributes[1].length);       // Debugging
    return {
        attributes: [positions, normals],
        triangles: indices
    };
}

function setupGeometry(geomData) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    // Setup attribute buffers (positions and normals)
    for (let i = 0; i < geomData.attributes.length; i++) {
        const data = geomData.attributes[i];
        supplyDataBuffer(data, i);
    }

    // Setup index buffer
    const indices = new Uint16Array(geomData.triangles.flat());
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    console.log("Geometry setup complete");
    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: vao,
    };
}



// Render spheres
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewMatrix = m4view(eyePos, [0, 0, 0], globalUp);

    gl.useProgram(program);

    // lighting 
    const lightdir = normalize([3, 3, 3]);
    gl.uniform3fv(program.uniforms.lightdir, lightdir);
    gl.uniform3fv(program.uniforms.lightcolor, [1.0, 1.0, 1.0]);
    gl.uniform3fv(program.uniforms.specularColor, [1.0, 1.0, 1.0]);

    spheres.forEach((sphere) => {
        // model matrix
        const modelMatrix = m4trans(...sphere.position);
        gl.bindVertexArray(sphereGeometry.vao);

        gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(viewMatrix, modelMatrix));
        gl.uniformMatrix4fv(program.uniforms.p, false, window.p);
        gl.uniform3fv(program.uniforms.diffuseColor, sphere.color);

        // console.log("Projection Matrix:", window.p);
        // console.log("View Matrix:", viewMatrix);
        // console.log("Model Matrix:", modelMatrix);
        // console.log("Diffuse Color:", sphere.color);

        // Draw the sphere
        gl.drawElements(sphereGeometry.mode, sphereGeometry.count, sphereGeometry.type, 0);
    });
    //console.log("Rendering....");
    // spheres.forEach((sphere, index) => {
    //     console.log(`Drawing sphere ${index} at position`, sphere.position);
    // });
}



/** 
 * Compile, link, set geometry
 * async functions return a Promise instead of their actual result.
 * Because of that, they can `await` for other Promises to be fulfilled,
 * which makes functions that call `fetch` or other async functions cleaner.
 */
window.addEventListener('load', async (event) => {
    window.canvas = document.querySelector('canvas');
    window.gl = initWebGL2(canvas);
    if (!gl) return;

    fillScreen();
    window.addEventListener('resize', fillScreen);

    // Set globalUp WebGL viewport and clear the screen
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Fetch and compile shaders
    const vs = await fetch('vertex-shader.glsl').then(res => res.text());
    const fs = await fetch('fragment-shader.glsl').then(res => res.text());
    window.program = compileShader(vs, fs);
    if (!program) return;

    // Load sphere geometry
    const sphereData = generateSphereGeometry(radius);
    window.sphereGeometry = setupGeometry(sphereData);
    console.log("Sphere Geometry:", sphereGeometry);        // Debugging
    generateSpheres();
    requestAnimationFrame(tick); 

    console.log("Spheres in spheres: ", spheres.length);        // Debugging

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    console.log(".....");
}); 



function tick(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    //console.log(currentTime);
    if (isNaN(deltaTime) || deltaTime <= 0) {
        console.error("Invalid deltaTime tick:", deltaTime);
        requestAnimationFrame(tick); // Continue the loop even if deltaTime is invalid
        return;
    }

    timeSinceLastReset += deltaTime;

    // Reset spheres every 15 seconds
    if (timeSinceLastReset >= timeInterval / 1000) {
        generateSpheres();      // spheres reset
        timeSinceLastReset = 0; // time reset
    }

    updatePhysics(deltaTime);
    render();
    requestAnimationFrame(tick);
}

