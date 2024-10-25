#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_Position;
in float v_altitude;

uniform float minAltitude;  // Minimum altitude in the terrain
uniform float maxAltitude;  // Minimum altitude in the terrain
//uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform vec3 lightcolor;
uniform vec3 lightdir;
uniform vec3 H;

out vec4 fragColor;

// Linear interpolation: (1−t)x+(t)y 
vec3 lerp(vec3 x, vec3 y, float t) {
    return (1.0 - t) * x + t * y;
}

void main() {
    vec3 N = normalize(v_normal);
    vec3 L = lightdir;
    vec3 V = normalize(-v_Position);

    // Diffuse lighting
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = diff * lightcolor;

    // Specular lighting
    float spec = pow(max(dot(N, H), 0.0), 60.0); 
    float shine = 1.0;
    vec3 specular = spec * specularColor * lightcolor;

    float normalizedAltitude = (v_altitude - minAltitude) / (maxAltitude - minAltitude);
    normalizedAltitude = clamp(normalizedAltitude, 0.0, 1.0);
    vec3 red = vec3(1.0, 0.0, 0.0);
    vec3 yellow = vec3(1.0, 1.0, 0.0);
    vec3 green = vec3(0.0, 1.0, 0.0);
    vec3 blue = vec3(0.0, 0.0, 1.0);
    vec3 cyan = vec3(0.0, 1.0, 1.0);

    // Generate color for each pixel based on the altitude fo the terrain beneath it plus lighting
    // Smooth transitions using lerp
    float step = normalizedAltitude * 5.0;
    vec3 color = 
        (step < 1.0) ? lerp(red, yellow, step) :           // Red -> Yellow
        (step < 2.0) ? lerp(yellow, green, step - 1.0) :   // Yellow -> Green
        (step < 3.0) ? lerp(green, cyan, step - 2.0) :     // Green -> Cyan
        (step < 4.0) ? lerp(cyan, blue, step - 3.0) :      // Cyan -> Blue
        lerp(blue, red, step - 4.0);                       // Blue -> Red

    fragColor = vec4(color * diffuse + specular * shine, 1.0);
}
