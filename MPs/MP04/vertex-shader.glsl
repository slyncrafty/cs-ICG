#version 300 es
precision highp float;

layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;

uniform mat4 mv;                  // view matrix
uniform mat4 m;                  // Model matrix
uniform mat4 p;                  // Projection matrix
uniform vec3 lightdir;           // Light position in world coord

out vec3 v_normal;
out vec3 v_LightDir;
out vec3 v_Position;

void main() {
    vec4 pos = vec4(position, 1.0);
    v_Position = (mv * pos).xyz;
    gl_Position = p * mv * pos;

    v_normal = normalize(mat3(mv) * normal);        // surface normal in view space
    v_LightDir = normalize(mat3(mv) * lightdir - v_Position);    // lightdir in view space
}