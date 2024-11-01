#version 300 es
precision highp float;
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec2 texCoord;

uniform mat4 mv;                  // view matrix
uniform mat4 p;                  // Projection matrix
uniform vec3 lightdir;           // Light position in world coord

out vec3 v_normal;
out vec3 v_LightDir;
out vec3 v_Position;
out vec2 v_texCoord;

void main() {
    gl_Position = p * mv * vec4(position, 1.0);
    
    v_Position = (mv * vec4(position, 1.0)).xyz;
    v_normal = normalize(mat3(mv) * normal);
    v_LightDir = normalize(mat3(mv) * lightdir); 
    v_texCoord = texCoord;
}
