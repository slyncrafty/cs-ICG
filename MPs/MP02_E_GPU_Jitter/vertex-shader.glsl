#version 300 es
precision mediump float;

layout(location = 0) in vec4 vert;  // Input vertex position
layout(location = 1) in vec4 a_color;     // Input vertex color

uniform float seconds;  // Time-based uniform

out vec4 v_color;  // Pass color to the fragment shader

void main() {
    // scale
    float s = 0.15;
    float dx = -0.2;
    float dy = -0.2;
    
    // Jitter based on time and vertex ID 
    float jitterX = 0.25 * sin(float(gl_VertexID) + seconds * 2.0);  // Jitter in X
    float jitterY = 0.25 * cos(float(gl_VertexID) + seconds * 2.0);  // Jitter in Y

    // Add jitter to the original position
    vec4 jitteredPos = vert + vec4(jitterX, jitterY, 0.0, 0.0);

    // Scaling and translation to the jittered position
    vec4 scaledJitteredPos = vec4(jitteredPos.x * s + dx, jitteredPos.y * s + dy, jitteredPos.z, 1);

    gl_Position = scaledJitteredPos;
    // Pass the color to the fragment shader
    v_color = a_color;
}
