#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_LightDir;
in vec3 v_Position;

//uniform vec3 eyePos;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform vec3 lightcolor;

out vec4 fragColor;

void main() {
    vec3 N = normalize(v_normal);    
    vec3 L = normalize(v_LightDir);             
    vec3 V = normalize(-v_Position); 
    vec3 H = normalize(L + V);

    // Diffuse shading
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = diff * diffuseColor * lightcolor;

    // Specular shading
    float spec = pow(max(dot(N, H), 0.0), 80.0);
    float shine = 0.8;
    vec3 specular = spec * specularColor * lightcolor;

    fragColor = vec4(diffuse + specular * shine, 1.0);

    //fragColor = vec4(diffuse, 1.0);
}

/*
    // Debugging check normals
    vec3 color = normalize(v_normal) * 0.5 + 0.5;  
    fragColor = vec4(color, 1.0);
*/