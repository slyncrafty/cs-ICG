#include <algorithm>
#include <iostream>
#include <vector>
#include <cmath>
#include <fstream>
#include <sstream>
#include "rasterizer.h"

using namespace std;
Vec2 Vec2::operator+(const Vec2 &v) const {
    return Vec2(x + v.x, y + v.y);
}

Vec2 Vec2::operator-(const Vec2 &v) const {
    return Vec2(x - v.x, y - v.y);
}

Vec2 Vec2::operator*(float scalar) const {
    return Vec2(x * scalar, y * scalar);
}

Vec2 Vec2::operator/(float scalar) const {
    return Vec2(x / scalar, y / scalar);
}


    
Vec4 Vec4::operator+(const Vec4 &v) const {
    return Vec4(x + v.x, y + v.y, z + v.z, w + v.w);
}

Vec4 Vec4::operator-(const Vec4 &v) const {
    return Vec4(x - v.x, y - v.y, z - v.z, w - v.w);
}

Vec4 Vec4::operator*(float scalar) const {
    return Vec4(x * scalar, y * scalar, z * scalar, w * scalar);
}

Vec4 Vec4::operator/(float scalar) const {
    return Vec4(x / scalar, y / scalar, z / scalar, w / scalar);
}

Vec4 operator*(float scalar, const Vec4& vec) {
    return Vec4(vec.x * scalar, vec.y * scalar, vec.z * scalar, vec.w * scalar);
}


std::vector<Vertex> DDA(const Vertex &start, const Vertex &end, bool dirY) {
    /*
    Finds all points vector p between vector a and vector b where p_d is an integer

    Inputs:
    - Vertex start
    - Vertex end
    Output:
    - all points between start and end
    */
    // set up
    Vertex a = start;
    Vertex b = end;    
    int d = dirY? 1 : 0;

    // 1: If a_d == b_d, return (no points found)
    if (a.position[d] == b.position[d]) return {};
    
    // 2: If a_d > b_d, swap a and b
    if (a.position[d] > b.position[d]) std::swap(a, b);
    
    // 3: Calculate deltas
    Vertex delta = b - a;

    // 4: step s = delta / delta_d
    float delta_d = delta.position[d];
    Vertex s = delta / delta_d;

    // 5: Find the first potential point: e = ceiling(a_d) - a_d
    float e = std::ceil(a.position[d]) - a.position[d];

    // Step 6: o = e * s
    Vertex o = s * e;
    
    // 7: p = a + o
    Vertex p = a + o;

    // 8: Find all points; While p_d < b_d repeat
    std::vector<Vertex> intpVertices;
    while(p.position[d] < b.position[d])
    {
        intpVertices.push_back(p);
        setPixel(p);
        p = p + s;
    }

    return intpVertices;  // Return all the interpolated vertices
}


// Scanline algorithm
void scanlineFill(const Vertex& p_input, const Vertex& q_input, const Vertex& r_input) {
    int d_x = 0;
    int d_y = 1; 
    // Copy inputs
    Vertex p = p_input;
    Vertex q = q_input;
    Vertex r = r_input;

    // Steps 1-3: Sort the points by y-coordinate
    std::vector<Vertex> verts = {p, q, r};
    std::sort(verts.begin(), verts.end(), [](const Vertex &a, const Vertex &b) {
        if (a.position.y != b.position.y) return a.position.y < b.position.y;
        else return a.position.x < b.position.x;
    });
    const Vertex &top = verts[0];
    const Vertex &mid = verts[1];
    const Vertex &bot = verts[2];

    // Step 4: Setup DDA for long edge (top to bot)
    Vertex p_long, s_long;
    {
        Vertex a = top;
        Vertex b = bot;
        //if (a.position[d_y] == b.position[d_y]) return;
        if (a.position[d_y] > b.position[d_y]) std::swap(a, b);
        Vertex delta = b - a;
        float delta_d = delta.position[d_y];
        Vertex s = delta / delta_d;
        float e = std::ceil(a.position[d_y]) - a.position[d_y];
        Vertex o = s * e;
        p_long = a + o;
        s_long = s;
    }
    
    // Find points in the top half of the triangle:
    // Step 5: Setup DDA for top half edge from t to m
    Vertex p_edge, s_edge;
    {
        Vertex a = top;
        Vertex b = mid;
        //if (a.position[d_y] == b.position[d_y]) return;
        if (a.position[d_y] > b.position[d_y]) std::swap(a, b);
        Vertex delta = b - a;
        float delta_d = delta.position[d_y];
        Vertex s = delta / delta_d;
        float e = std::ceil(a.position[d_y]) - a.position[d_y];
        Vertex o = s * e;
        p_edge = a + o;
        s_edge = s;
    }

    // Step 6: DDA loop for top half of the triangle
    while(p_edge.position[d_y] < mid.position[d_y])    
    {
        // Run DDA in x between p_edge and p_long
        std::vector<Vertex> scanline = DDA(p_edge, p_long, false);
        p_edge = p_edge + s_edge;
        p_long = p_long + s_long;
        
    }

    //Find points in the bottom half of the triangle:
    // Step 7: Setup DDA for bottom half edge from m to b
    {
        Vertex a = mid;
        Vertex b = bot;
        //if (a.position[d_y] == b.position[d_y]) return;
        if (a.position[d_y] > b.position[d_y]) std::swap(a, b);
        Vertex delta = b - a;
        float delta_d = delta.position[d_y];
        Vertex s = delta / delta_d;
        float e = std::ceil(a.position[d_y]) - a.position[d_y];
        Vertex o = s * e;
        p_edge = a + o;
        s_edge = s;
    }

    // Step 8: DDA loop for bottom half of the triangle
    while(p_edge.position.y < bot.position.y)
    {
        // Run DDA in x between p_edge and p_long
        std::vector<Vertex> scanline = DDA(p_edge, p_long, false);
        p_edge = p_edge + s_edge;
        p_long = p_long + s_long;
        std::cout << "Bot half working..." << std::endl;
    }
}


// Set a pixel in the img 
void setPixel(Vertex p) {
    int x = static_cast<int>(p.position.x);
    int y = static_cast<int>(p.position.y);
    float depth = p.position.z;
    if (x < 0 || x >= (int)img->width() || y < 0 || y >= (int)img->height()) {
        return;  // Out of bounds
    }
    // pixel_t *pixel = &img->rgba[y * img->width + x];
    //// alpha blending
    // float srcAlpha = color.w;
    // float invAlpha = 1.0f - srcAlpha;

    std::cout << "Setting pixel: (" << p.position.x << ", " << p.position.y << ") & color: ("
              << p.color.x << ", " << p.color.y << ", " << p.color.z << ", " << p.color.w << ")\n";    // Debugging

    if (depthEnabled) {
        if (depth < depthBuffer[y][x]) 
        {
            depthBuffer[y][x] = depth;
            pixel_t &pixel = img->operator[](static_cast<int>(p.position.y))[static_cast<int>(p.position.x)]; 
            pixel.r = static_cast<uint8_t>(p.color.x * 255.0f);
            pixel.g = static_cast<uint8_t>(p.color.y * 255.0f);
            pixel.b = static_cast<uint8_t>(p.color.z * 255.0f);
            pixel.a = static_cast<uint8_t>(p.color.w * 255.0f);
        }
    } 
    else 
    {
        pixel_t &pixel = img->operator[](static_cast<int>(p.position.y))[static_cast<int>(p.position.x)]; 
        pixel.r = static_cast<uint8_t>(p.color.x * 255.0f);  // Convert range from [0, 1] to [0, 255]
        pixel.g = static_cast<uint8_t>(p.color.y * 255.0f);
        pixel.b = static_cast<uint8_t>(p.color.z * 255.0f);
        pixel.a = static_cast<uint8_t>(p.color.w * 255.0f);  // Alpha channel
    }
}

// // Set a pixel in the img with Depth Test and sRGB Conversion
// void setPixel(int x, int y, const Vec4 &color, float depth) {
//     if (x < 0 || x >= (int)img->width() || y < 0 || y >= (int)img->height()) {
//         return;  // Out of bounds
//     }

//     // Perform depth test if enabled
//     if (depthEnabled && depth >= depthBuffer[y * img->width() + x]) {
//         return;  // Skip the pixel if it's behind the existing depth
//     }

//     // Update the depth buffer
//     depthBuffer[y * img->width() + x] = depth;

//     // Get the pixel pointer
//     pixel_t *pixel = &img->operator[](y)[x];

//     // Apply sRGB conversion if enabled
//     Vec4 finalColor = color;
//     if (sRGBEnabled) {
//         finalColor.x = std::pow(finalColor.x, 1.0 / 2.2);  // Gamma correction for sRGB
//         finalColor.y = std::pow(finalColor.y, 1.0 / 2.2);
//         finalColor.z = std::pow(finalColor.z, 1.0 / 2.2);
//     }

//     // Set the pixel values
//     pixel->r = static_cast<uint8_t>(finalColor.x * 255.0f);
//     pixel->g = static_cast<uint8_t>(finalColor.y * 255.0f);
//     pixel->b = static_cast<uint8_t>(finalColor.z * 255.0f);
//     pixel->a = static_cast<uint8_t>(finalColor.w * 255.0f);  // Alpha channel
// }


void drawArraysTriangles(int first, int count) 
{
    for (int i = 0; i < count; i += 3) 
    {
        // Get the vertices for the triangle
        Vertex v0 = vertices[first + i];
        Vertex v1 = vertices[first + i + 1];
        Vertex v2 = vertices[first + i + 2];
        std::cout << "Draw arrays triangles starting with " << first + i << " " << first + i + 1 << " " << first + i + 2 << std::endl;

        // Draw the triangle using scanline
        scanlineFill(v0, v1, v2);
    }
}


void drawElementsTriangles(int count, int offset) 
{
    // Ensure that offset and count are within bounds
    if (offset < 0 || offset + count > elements.size()) {
        std::cerr << "Error: offset and count out of bounds." << std::endl;
        return;
    }
    for (int i = 0; i < count; i += 3) {
        // Retrieve vertex indices from the element array buffer
        unsigned int idx0 = elements[offset + i];
        unsigned int idx1 = elements[offset + i + 1];
        unsigned int idx2 = elements[offset + i + 2];

        // Get the corresponding vertices from the vertex buffer
        Vertex v0 = vertices[idx0];
        Vertex v1 = vertices[idx1];
        Vertex v2 = vertices[idx2];

        // Perspective-correct interpolation if 'hyp' (hyperbolic interpolation) is enabled
        if (hypEnabled) {
            v0.position = v0.position / v0.position.w;
            v1.position = v1.position / v1.position.w;
            v2.position = v2.position / v2.position.w;
            v0.color = v0.color / v0.position.w;
            v1.color = v1.color / v1.position.w;
            v2.color = v2.color / v2.position.w;
        }

        // Sort the vertices by y-coordinate
        if (v1.position.y < v0.position.y) { std::swap(v0, v1); }
        if (v2.position.y < v0.position.y) { std::swap(v0, v2); }
        if (v2.position.y < v1.position.y) { std::swap(v1, v2); }

        // Draw the triangle using scanlineFill
        scanlineFill(v0, v1, v2);
    }
}

