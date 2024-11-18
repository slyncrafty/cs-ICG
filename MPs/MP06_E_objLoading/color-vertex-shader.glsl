#version 300 es
precision highp float;

layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec3 color;

uniform mat4 mv;                  // view matrix
uniform mat4 p;                  // Projection matrix
uniform vec3 lightdir;           // Light position in world coord

out vec3 v_normal;
out vec3 v_LightDir;
out vec3 v_Position;
out vec3 v_color;

void main() {
    vec4 pos = vec4(position, 1.0);
    v_Position = (mv * pos).xyz;
    gl_Position = p * mv * pos;

    v_normal = normalize(mat3(mv) * normal);        // surface normal in view space
    v_LightDir = normalize(lightdir);
    v_color = color;
}