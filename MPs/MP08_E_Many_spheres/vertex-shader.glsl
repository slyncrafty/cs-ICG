#version 300 es
precision highp float;

layout(location=0) in vec3 position;
layout(location=1) in vec3 color;
layout(location=2) in float radius;

uniform mat4 mv;                  // view matrix
uniform mat4 p;                  // Projection matrix
uniform vec3 lightdir;           // Light position in world coord
uniform float uViewportSize;
uniform float uProjScale;

out vec3 v_normal;
out vec3 v_LightDir;
out vec3 v_Position;

void main() {
    vec4 pos = vec4(position, 1.0);
    v_Position = (mv * pos).xyz;
    gl_Position = p * mv * pos;
    float pointSize = uViewportSize * uProjScale * (1.0 / gl_Position.w) * radius;
    gl_PointSize = pointSize;

    //v_LightDir = normalize(mat3(mv) * lightdir);    // lightdir in view space

}