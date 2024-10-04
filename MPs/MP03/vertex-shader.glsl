#version 300 es
precision highp float;

layout(location=0) in vec4 a_position;
layout(location=1) in vec4 a_color;

out vec4 v_color;

uniform mat4 mv;
uniform mat4 p;

void main() {
    gl_Position = p * mv * a_position;
    v_color = a_color;
}