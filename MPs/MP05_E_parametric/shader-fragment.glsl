#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_LightDir;
in vec3 v_LightDir2;
in vec3 v_Position;

uniform vec3 lightcolor;
uniform vec3 lightcolor2;
//uniform vec3 H;
//uniform vec3 H2;

uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform vec3 lineColor;
uniform bool isLine;


out vec4 fragColor;

void main() {
     if (isLine) {
        fragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        vec3 N = normalize(v_normal);
        vec3 V = normalize(-v_Position);
        vec3 L = normalize(v_LightDir);             
        vec3 L2 = normalize(v_LightDir2);             
        vec3 H = normalize(L + V);
        vec3 H2 = normalize(L2 + V);
    
        // Diffuse shading Lambert
        float diff = max(dot(N, L), 0.0);
        float diff2 = max(dot(N, L2), 0.0);
        vec3 diffuse = diffuseColor * (diff *lightcolor + diff2 * lightcolor2);

        // Specular shading Blinn
        float shine = 10.0;
        float spec = pow(max(dot(N, H), 0.0), 80.0);
        float spec2 = pow(max(dot(N, H2), 0.0), 20.0);
        vec3 specular = specularColor * (spec * lightcolor + spec2 * lightcolor2) * shine;

        fragColor = vec4(diffuse + specular, 1.0);    
    }
}

/*
    // Debugging check normals
    vec3 color = normalize(v_normal) * 0.5 + 0.5;  
    fragColor = vec4(color, 1.0);
*/