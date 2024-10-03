#version 300 es

out vec2 v_position;

void main()
{
    float x = (gl_VertexID == 0 || gl_VertexID == 4 || gl_VertexID == 5) ? -1.0 : 1.0;
    float y = (gl_VertexID == 0 || gl_VertexID == 1 || gl_VertexID == 5) ? -1.0 : 1.0;

    gl_Position = vec4(x, y, 0.0, 1.0);

    v_position = vec2(x, y);
}