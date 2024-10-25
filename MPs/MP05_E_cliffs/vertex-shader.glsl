#version 300 es
precision highp float;

layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;

uniform mat4 mv;                 // Model-view matrix
uniform mat4 p;                  // Projection matrix
uniform mat4 model;

out vec3 v_normal;
out vec3 v_Position;
out vec3 v_worldNormal;

void main() {
    vec4 pos = vec4(position, 1.0);
    gl_Position = p * mv * pos;
    v_Position =  (mv * pos).xyz;

    v_normal = mat3(mv) * normal;
    v_worldNormal = mat3(model) * normal;
}