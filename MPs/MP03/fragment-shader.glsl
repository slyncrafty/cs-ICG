#version 300 es
precision highp float;

in vec4 v_color;

uniform vec4 color;
out vec4 fragColor;

void main() {
    fragColor = v_color;
}