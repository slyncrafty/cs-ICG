#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_LightDir;
in vec2 v_texCoord;

uniform sampler2D u_texture;
//uniform vec3 lightDir;
uniform vec3 lightColor;

out vec4 fragColor;

void main() {
    vec3 N = normalize(v_normal);
    vec3 L = normalize(v_LightDir);

    float diff = max(dot(N, L), 0.0);
    vec3 texColor = texture(u_texture, v_texCoord).rgb;
    vec3 diffuse = diff * texColor * lightColor;

    //fragColor = vec4(diffuse, 1.0);
    fragColor = vec4(texColor, 1.0);
}
