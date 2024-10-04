#version 300 es
precision mediump float;

layout(location = 0) in vec4 vert;        // Position is assigned to location 0
layout(location = 1) in vec4 a_color;     // Color is assigned to location 1

out vec4 v_color;                         // Output the color

void main() {
    // scaling 
    float s = 0.2;
    float dx = -0.2;
    float dy = -0.2;

    gl_Position = vec4(vert.x * s + dx, vert.y * s + dy, vert.z, 1);
    v_color = a_color; 
}
