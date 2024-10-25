#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_Position;

uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform vec3 lightcolor;
uniform vec3 lightdir;
uniform vec3 H;

out vec4 fragColor;

void main() {
    vec3 N = normalize(v_normal);
    vec3 L = lightdir;
    vec3 V = normalize(-v_Position);

    // Diffuse shading
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = diff * diffuseColor * lightcolor;

    // Specular shading
    float spec = pow(max(dot(N, H), 0.0), 150.0); 
    float shine = 1.0;
    vec3 specular = spec * specularColor * lightcolor;

    fragColor = vec4(diffuse + specular * shine, 1.0);
}
