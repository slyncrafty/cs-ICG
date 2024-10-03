#version 300 es
precision mediump float;

in vec2 v_position;
uniform float seconds;

out vec4 v_color;

void main()
{
    //scaling 
    float s = 5.0;
    float dist = length(v_position);
    float r = 0.5 * sin(dist * s - seconds);  
    float g = 0.5 * cos((v_position.x * v_position.y) * s - seconds); 
    float b = 0.5 * sin(dist * s + seconds); 
    v_color = vec4(r, g, b, 1.0);
}
