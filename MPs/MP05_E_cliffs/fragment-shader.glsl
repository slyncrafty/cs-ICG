#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_LightDir;
in vec3 v_Position;
in vec3 v_worldNormal;

uniform vec3 specularColor;
uniform vec3 lightcolor;
uniform vec3 lightdir;
//uniform vec3 H;

out vec4 fragColor;

void main() {
    vec3 N = normalize(v_normal); 
    vec3 L = normalize(v_LightDir);   
    vec3 V = normalize(-v_Position);
    vec3 H = normalize(L + V);
    float slope = normalize(v_worldNormal).y; // bigger y, shallower slope
    bool thres = slope > 0.5;

    vec3 shallowColor = vec3(0.2, 0.6, 0.1);   // Green
    float shallowShine = 5.0;                // bright shine spots
    float shallowIntensity = 800.0;              // small shine spot

    vec3 steepColor = vec3(0.6, 0.3, 0.3);    // Red
    float steepShine = 2.0;                  // dimmer shine spots
    float steepIntensity = 40.0;               // Large shine spot

    vec3 color = thres ? shallowColor : steepColor;
    float shine = thres ? shallowShine : steepShine; // bigger the power, smaller the shine spot
    float intensity = thres ? shallowIntensity : steepIntensity;

    // Diffuse shading
    float diff = max(dot(N, L), 0.0);               // lambert
    vec3 diffuse = color * diff * lightcolor; 

    // Specular shading
    float spec = pow(max(dot(N, H), 0.0), intensity);   // bp
    vec3 specular = specularColor * (spec * lightcolor) * shine;

    fragColor = vec4(diffuse + specular, 1.0);

}
