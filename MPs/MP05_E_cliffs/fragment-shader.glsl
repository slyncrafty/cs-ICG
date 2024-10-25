#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_Position;
in vec3 v_worldNormal;

uniform vec3 specularColor;
uniform vec3 lightcolor;
uniform vec3 lightdir;
uniform vec3 H;

out vec4 fragColor;

void main() {
    vec3 N = normalize(v_normal); 
    vec3 L = lightdir;
    vec3 V = normalize(-v_Position);
    float slope = normalize(v_worldNormal).y; // bigger y, shallower slope
    bool thres = slope > 0.6;

    vec3 shallowColor = vec3(0.2, 0.6, 0.1);   // Green
    float shallowShine = 120.0;                // small bright shine spots
    float shallowIntensity = 0.8;

    vec3 steepColor = vec3(0.6, 0.3, 0.3);    // Red
    float steepShine = 30.0;                  // large dimmer shine spots
    float steepIntensity = 3.0;

    vec3 color = thres ? shallowColor : steepColor;
    float shine = thres ? shallowShine : steepShine;
    float intensity = thres ? shallowIntensity : steepIntensity;

    // Diffuse shading
    float diff = max(dot(N, L), 0.0);               // lambert
    vec3 diffuse = color * diff * lightcolor; 

    // Specular shading
    float spec = pow(max(dot(N, H), 0.0), shine);   // bp
    vec3 specular = spec * lightcolor * specularColor * intensity;

    fragColor = vec4(diffuse + specular, 1.0);

}
