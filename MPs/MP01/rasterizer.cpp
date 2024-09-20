#include <algorithm>
#include <iostream>
#include <vector>
#include <cmath>
#include <fstream>
#include <sstream>
#include "rasterizer.h"

using namespace std;



void DDA(const Vec4 &start, const Vec4 &end, const Vec4 &startColor, const Vec4 &endColor) {
    Vec4 delta = end - start;  // Difference between end and start points
    float steps = std::max(std::abs(delta.x), std::abs(delta.y));  // Maximum number of steps in x or y

    Vec4 step = delta / steps;  // Incremental change in position per step
    Vec4 colorStep = (endColor - startColor) / steps;  // Incremental change in color per step

    Vec4 currentPoint = start;
    Vec4 currentColor = startColor;

    std::cout << delta.x << " " << delta.y << " " << delta.z << " " << delta.w << "." << std::endl; // debugging
    
    for (int i = 0; i <= steps; ++i) {
        int x = static_cast<int>(std::round(currentPoint.x));
        int y = static_cast<int>(std::round(currentPoint.y));

        setPixel(x, y, currentColor);

        currentPoint = currentPoint + step;
        currentColor = currentColor + colorStep;
    }
}



void scanlineFill(const Vec4 &top, const Vec4 &middle, const Vec4 &bottom, const Vec4 &colorTop, const Vec4 &colorMiddle, const Vec4 &colorBottom) {
    // Sort vertices by y-coordinate
    std::vector<std::pair<Vec4, Vec4>> vertices = {{top, colorTop}, {middle, colorMiddle}, {bottom, colorBottom}};
    std::sort(vertices.begin(), vertices.end(), [](const auto &a, const auto &b) {
        return a.first.y < b.first.y;
    });

    const Vec4 &v0 = vertices[0].first;
    const Vec4 &v1 = vertices[1].first;
    const Vec4 &v2 = vertices[2].first;

    const Vec4 &c0 = vertices[0].second;
    const Vec4 &c1 = vertices[1].second;
    const Vec4 &c2 = vertices[2].second;

    if (v1.y == v0.y || v2.y == v0.y) 
    {
        std::cerr << "Error: Division by zero detected in scanlineFill" << std::endl;
        return;
    }
    // Compute (v0 to v1 & v0 to v2)
    for (int y = static_cast<int>(std::ceil(v0.y)); y <= static_cast<int>(std::ceil(v2.y)); ++y) {
        // Top half of the triangle (v0 to v1 and v0 to v2)
        float t0 = (y - v0.y) / (v1.y - v0.y);  // Interpolation factor for edge v0-v1
        float t1 = (y - v0.y) / (v2.y - v0.y);  // Interpolation factor for edge v0-v2

        Vec4 p0 = v0 + (v1 - v0) * t0;
        Vec4 p1 = v0 + (v2 - v0) * t1;

        Vec4 colorP0 = c0 + (c1 - c0) * t0;
        Vec4 colorP1 = c0 + (c2 - c0) * t1;

        // Use DDA to fill the scanline between p0 and p1
        DDA(p0, p1, colorP0, colorP1);
          
    }
    // Compute (v1 to v2 & v0 to v2)
    for (int y = static_cast<int>(std::ceil(v1.y)); y <= static_cast<int>(std::ceil(v2.y)); ++y)
    {
        // Bottom half of the triangle (v1 to v2 and v0 to v2)
        float t0 = (y - v1.y) / (v2.y - v1.y);  // Interpolation factor for edge v1-v2
        float t1 = (y - v0.y) / (v2.y - v0.y);  // Interpolation factor for edge v0-v2
        // Interpolated positions
        Vec4 p0 = v1 + (v2 - v1) * t0;
        Vec4 p1 = v0 + (v2 - v0) * t1;
        // Interpolated colors
        Vec4 colorP0 = c1 + (c2 - c1) * t0;
        Vec4 colorP1 = c0 + (c2 - c0) * t1;

        // Use DDA to fill the scanline between p0 and p1
        DDA(p0, p1, colorP0, colorP1);
    }
}



// void drawArraysTriangles(int first, int count) {

//     for (int i = 0; i < count; i += 3) {
//         Vec4 v0 = positions[first + i];
//         Vec4 v1 = positions[first + i + 1];
//         Vec4 v2 = positions[first + i + 2];

//         Vec4 c0 = colors[first + i];
//         Vec4 c1 = colors[first + i + 1];
//         Vec4 c2 = colors[first + i + 2];

//         std::cout << "Drawing Arrays" << i << "/" << count << std::endl;
//         // Fill the triangle using the scanline function
//         scanlineFill(v0, v1, v2, c0, c1, c2);
//     }
// }


void drawArraysTriangles(int first, int count) {
    for (int i = 0; i < count; i += 3) {
        // Get the vertices for the triangle
        Vec4 v0 = positions[first + i];
        Vec4 v1 = positions[first + i + 1];
        Vec4 v2 = positions[first + i + 2];

        // Get the corresponding colors for the vertices
        Vec4 c0 = colors[first + i];
        Vec4 c1 = colors[first + i + 1];
        Vec4 c2 = colors[first + i + 2];

        // Sort the vertices by their y-coordinate to ensure top-to-bottom order
        if (v1.y < v0.y) {
            std::swap(v0, v1);
            std::swap(c0, c1);
        }
        if (v2.y < v0.y) {
            std::swap(v0, v2);
            std::swap(c0, c2);
        }
        if (v2.y < v1.y) {
            std::swap(v1, v2);
            std::swap(c1, c2);
        }

        // Now v0 is the top, v1 is the middle, and v2 is the bottom vertex.

        // Draw the top half of the triangle (v0 -> v1 and v0 -> v2)
        if (v1.y != v0.y) {
            for (int y = static_cast<int>(std::ceil(v0.y)); y <= static_cast<int>(std::ceil(v1.y)); ++y) {
                float t0 = (y - v0.y) / (v1.y - v0.y);  // Interpolation factor for v0 -> v1
                float t1 = (y - v0.y) / (v2.y - v0.y);  // Interpolation factor for v0 -> v2

                Vec4 p0 = v0 + (v1 - v0) * t0;  // Interpolated position between v0 and v1
                Vec4 p1 = v0 + (v2 - v0) * t1;  // Interpolated position between v0 and v2

                Vec4 colorP0 = c0 + (c1 - c0) * t0;  // Interpolated color between v0 and c1
                Vec4 colorP1 = c0 + (c2 - c0) * t1;  // Interpolated color between v0 and c2

                // Use DDA to fill the scanline between p0 and p1
                DDA(p0, p1, colorP0, colorP1);
            }
        }

        // Draw the bottom half of the triangle (v1 -> v2 and v0 -> v2)
        if (v2.y != v1.y) {
            for (int y = static_cast<int>(std::ceil(v1.y)); y <= static_cast<int>(std::ceil(v2.y)); ++y) {
                float t0 = (y - v1.y) / (v2.y - v1.y);  // Interpolation factor for v1 -> v2
                float t1 = (y - v0.y) / (v2.y - v0.y);  // Interpolation factor for v0 -> v2

                Vec4 p0 = v1 + (v2 - v1) * t0;  // Interpolated position between v1 and v2
                Vec4 p1 = v0 + (v2 - v0) * t1;  // Interpolated position between v0 and v2

                Vec4 colorP0 = c1 + (c2 - c1) * t0;  // Interpolated color between v1 and v2
                Vec4 colorP1 = c0 + (c2 - c0) * t1;  // Interpolated color between v0 and c2

                // Use DDA to fill the scanline between p0 and p1
                DDA(p0, p1, colorP0, colorP1);
            }
        }
    }
}


void drawElementsTriangles(int count, int offset) {
    for (int i = 0; i < count; i += 3) {
        // Retrieve vertex indices from the element array buffer
        unsigned int idx0 = elements[offset + i];
        unsigned int idx1 = elements[offset + i + 1];
        unsigned int idx2 = elements[offset + i + 2];

        // Get the corresponding vertices and colors
        Vec4 v0 = positions[idx0];
        Vec4 v1 = positions[idx1];
        Vec4 v2 = positions[idx2];

        Vec4 c0 = colors[idx0];
        Vec4 c1 = colors[idx1];
        Vec4 c2 = colors[idx2];

        // Perspective-correct interpolation
        if (hypEnabled) 
        {
            v0 = v0 / v0.w;
            v1 = v1 / v1.w;
            v2 = v2 / v2.w;
            c0 = c0 / v0.w;
            c1 = c1 / v1.w;
            c2 = c2 / v2.w;
        }
        if (v1.y < v0.y) { std::swap(v0, v1); std::swap(c0, c1); }
        if (v2.y < v0.y) { std::swap(v0, v2); std::swap(c0, c2); }
        if (v2.y < v1.y) { std::swap(v1, v2); std::swap(c1, c2); }

        // Draw the triangle using the vertices and colors
        scanlineFill(v0, v1, v2, c0, c1, c2);
    }
}



// Set a pixel in the img 
void setPixel(int x, int y, const Vec4 &color) {
    if (x < 0 || x >= (int)img->width() || y < 0 || y >= (int)img->height()) {
        return;  // Out of bounds return
    }

    // pixel_t *pixel = &img->rgba[y * img->width + x];
    std::cout << "Setting pixel at (" << x << ", " << y << ")" << std::endl;    // Debugging

    pixel_t &pixel = img->operator[](y)[x]; 
    pixel.r = static_cast<uint8_t>(color.x * 255.0f);  // Convert from [0, 1] to [0, 255]
    pixel.g = static_cast<uint8_t>(color.y * 255.0f);
    pixel.b = static_cast<uint8_t>(color.z * 255.0f);
    pixel.a = static_cast<uint8_t>(color.w * 255.0f);  // Alpha channel
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
