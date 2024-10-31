#version 300 es
precision highp float;

layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;

uniform mat4 mv;                 // Model-view matrix
uniform mat4 m;
uniform mat4 p;                  // Projection matrix
uniform vec3 lightdir;           // Light position in world coord
uniform vec3 lightdir2;           // Light position in world coord

out vec3 v_normal;
out vec3 v_LightDir;
out vec3 v_LightDir2;
out vec3 v_Position;

void main() {
    vec4 pos = vec4(position, 1.0);
    v_Position = (mv * pos).xyz;
    gl_Position = p * mv * pos;

    v_normal = normalize(mat3(mv) * normal);

    // Compute light directions in view space
    //v_LightDir = normalize((mv * vec4(lightdir, 1.0)).xyz - v_Position);
    //v_LightDir2 = normalize((mv * vec4(lightdir2, 1.0)).xyz - v_Position);
    v_LightDir = mat3(mv) * lightdir;
    v_LightDir2 = mat3(mv) * lightdir2;

}