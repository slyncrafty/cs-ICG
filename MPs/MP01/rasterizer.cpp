#include <algorithm>
#include <iostream>
#include <vector>
#include <cmath>
#include <fstream>
#include <sstream>
#include "rasterizer.h"

using namespace std;


// std::vector<Vertex> DDA(const Vertex &start, const Vertex &end, bool dirY)
// {
//     /*
//     Finds all points vector p between vector a and vector b where p_d is an integer

//     Inputs:
//     - Vertex start
//     - Vertex end
//     Output:
//     - all points between start and end
//     */
    
//     Vec4 a = start.position;
//     Vec4 b = end.position;
//     // setup
//     if(dirY && a.y == b.y)          return{};
//     if(!dirY && a.x == b.x)         return{};
//     if(dirY && a.y > b.y)           std::swap(a,b);
//     else if(!dirY && a.x > b.x)     std::swap(a,b);

//     Vec4 deltaPos = b - a;
//     Vec4 deltaCol = end.color - start.color;
//     Vec2 deltaTex = end.texcoord - start.texcoord;

//     float step = dirY ? deltaPos.y : deltaPos.x;
//     if(step == 0.0f)    return{}; //(divide by zero)
//     Vec4 stepPos = deltaPos / step;
//     Vec4 stepCol = deltaCol / step;
//     Vec2 stepTex = deltaTex / step;

//     float startPt = dirY ? std::ceil(a.y) : std::ceil(a.x);
//     float offset = startPt - (dirY ? a.y : a.x);

//     // Interpolation
//     Vertex currVertex = start;
//     currVertex.position = currVertex.position + stepPos * offset;
//     currVertex.color = currVertex.color + stepCol * offset;
//     currVertex.texcoord = currVertex.texcoord + stepTex * offset;

//     std::vector<Vertex> intpVertices;  
//     for (int i = 0; i <= step; ++i) {
//         intpVertices.push_back(currVertex);  
//         currVertex.position = currVertex.position + stepPos;  
//         currVertex.color = currVertex.color + stepCol;
//         currVertex.texcoord = currVertex.texcoord + stepTex;
//     }
//     return intpVertices;
// }

std::vector<Vertex> DDA(const Vertex &start, const Vertex &end, bool dirY) {
    /*
    Finds all points vector p between vector a and vector b where p_d is an integer

    Inputs:
    - Vertex start
    - Vertex end
    Output:
    - all points between start and end
    */
    Vertex vStart = start;
    Vertex vEnd = end;    

    // 1 : no points return
    if (dirY && start.position.y == end.position.y) return {};  
    if (!dirY && start.position.x == end.position.x) return {};  

    // 2: Ensure the correct order
    if (dirY && vStart.position.y > vEnd.position.y) { std::swap(vStart, vEnd); } 
    if (!dirY && vStart.position.x > vEnd.position.x) { std::swap(vStart, vEnd); }

    // 3: Calculate deltas
    Vec4 deltaPos = vEnd.position - vStart.position;                   
    Vec4 deltaCol = vEnd.color - vStart.color;              
    Vec2 deltaTex = vEnd.texcoord - vStart.texcoord; 

    // 4: step
    float step = dirY ? deltaPos.y : deltaPos.x;  // Step along y if dirY is true, otherwise along x
    if (step == 0.0f) return {};  // No valid steps, return early

    Vec4 stepPos = deltaPos / step;     // Position increment per step
    Vec4 stepCol = deltaCol / step;     // Color increment per step
    Vec2 stepTex = deltaTex / step;     // Texcoord increment per step

    // 5: Find the first potential point:
    float startCoord = dirY ? vStart.position.y : vStart.position.x;
    float offset = std::ceil(startCoord) - startCoord;
    Vertex currVertex = vStart;
    currVertex.position = currVertex.position + stepPos * offset;
    currVertex.color = currVertex.color + stepCol * offset;
    currVertex.texcoord = currVertex.texcoord + stepTex * offset;

    // 6: Find all points
    std::vector<Vertex> intpVertices; 
    for (int i = 0; i <= step; ++i) 
    {
        intpVertices.push_back(currVertex);
        currVertex.position = currVertex.position + stepPos;
        currVertex.color = currVertex.color + stepCol;
        currVertex.texcoord = currVertex.texcoord + stepTex;
    }

    return intpVertices;  // Return all the interpolated vertices
}


void scanlineFill(const Vertex &p1, const Vertex &p2, const Vertex &p3) {
    // Sort vertices by y-coordinate smallest-top; biggest-bot
    std::vector<Vertex> verts = {p1, p2, p3};
    std::sort(verts.begin(), verts.end(), [](const auto &a, const auto &b) 
    {
        return a.position.y < b.position.y;
    });
    
    // Divide triangle to top & bot halves
    const Vertex &top = verts[0];
    const Vertex &mid = verts[1];
    const Vertex &bot = verts[2];
    // std::cout << "top: " << top.position.y <<" mid: " << mid.position.y << " bot: " << bot.position.y << std::endl; // Debugging
   
    // DDA along edges in y
    std::vector<Vertex> topMidEdge = DDA(top, mid, true);
    std::vector<Vertex> midBotEdge = DDA(mid, bot, true);
    std::vector<Vertex> topBotEdge = DDA(top, bot, true);
    // std::cout << "DDA Result size: " << topBotEdge.size() << " " << topMidEdge.size() << " " << midBotEdge.size() << " " << std::endl;
        
    if (topMidEdge.empty() || midBotEdge.empty() || topBotEdge.empty()) { return; }

    // top half of the triangle
    for (int y = 0; y < topMidEdge.size(); ++y) {
        Vertex left = topMidEdge[y];  
        Vertex right = topBotEdge[y]; 
        std::vector<Vertex> scanline = DDA(left, right, false);
        for (const Vertex &v : scanline) {
            setPixel(static_cast<int>(v.position.x), static_cast<int>(y + top.position.y), v.color);
        }
    }

    // bottom half of the triangle
    for (int y = 0; y < midBotEdge.size(); ++y) {
        Vertex left = midBotEdge[y];  
        Vertex right = topBotEdge[topMidEdge.size() + y]; 
        std::vector<Vertex> scanline = DDA(left, right, false);
        for (const Vertex &v : scanline) {
            setPixel(static_cast<int>(v.position.x), static_cast<int>(y + mid.position.y), v.color);
        }
    }
}


// void scanlineFill(const Vertex &p1, const Vertex &p2, const Vertex &p3) {
//     // Sort vertices by y-coordinate smallest-top; biggest-bot
//     std::vector<Vertex> verts = {p1, p2, p3};
//     std::sort(verts.begin(), verts.end(), [](const auto &a, const auto &b) 
//     {
//         return a.position.y < b.position.y;
//     });
    
//     // Divide triangle to top & bot halves
//     const Vertex &top = verts[0];
//     const Vertex &mid = verts[1];
//     const Vertex &bot = verts[2];
//     // std::cout << "top: " << top.position.y <<" mid: " << mid.position.y << " bot: " << bot.position.y << std::endl; // Debugging
   
//     // DDA along edges in y
//     std::vector<Vertex> topBotEdge = DDA(top, bot, true);
//     std::vector<Vertex> topMidEdge = DDA(top, mid, true);
//     std::vector<Vertex> midBotEdge = DDA(mid, bot, true);
//     // std::cout << "DDA Result size: " << topBotEdge.size() << " " << topMidEdge.size() << " " << midBotEdge.size() << " " << std::endl;
    
//     // top half of the triangle
//     for (int y = 0; y < topMidEdge.size(); ++y) {
//         Vertex left = topMidEdge[y];  // Left edge point from top to mid
//         Vertex right = topBotEdge[y]; // Right edge point from top to bot
        
//         // Ensure left is on the left side
//         if (left.position.x > right.position.x) std::swap(left, right);

//         // Fill the pixels between the left and right edges
//         for (float x = std::ceil(left.position.x); x <= right.position.x; ++x) {
//             float t = (x - left.position.x) / (right.position.x - left.position.x);
//             Vec4 interpColor = left.color + (right.color - left.color) * t;
//             setPixel(static_cast<int>(x), static_cast<int>(y + top.position.y), interpColor);
//         }
//     }

//     // bottom half of the triangle
//     int topMidSize = topMidEdge.size();
//     for (int y = 0; y < midBotEdge.size(); ++y) {
//         Vertex left = midBotEdge[y];  // Left edge point from mid to bot
//         Vertex right = topBotEdge[topMidSize + y]; // Right edge point from top to bot
        
//         // Ensure left is on the left side
//         if (left.position.x > right.position.x) std::swap(left, right);

//         // Fill the pixels between the left and right edges
//         for (float x = std::ceil(left.position.x); x <= right.position.x; ++x) {
//             float t = (x - left.position.x) / (right.position.x - left.position.x);
//             Vec4 interpColor = left.color + (right.color - left.color) * t;
//             setPixel(static_cast<int>(x), static_cast<int>(y + mid.position.y), interpColor);
//         }
//     }
// }


// Set a pixel in the img 
void setPixel(int x, int y, const Vec4 &color) {
    if (x < 0 || x >= (int)img->width() || y < 0 || y >= (int)img->height()) {
        return;  // Out of bounds
    }

    // pixel_t *pixel = &img->rgba[y * img->width + x];
    std::cout << "Setting pixel at (" << x << ", " << y << ") with color: ("
              << color.x << ", " << color.y << ", " << color.z << ", " << color.w << ")\n";    // Debugging

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


void drawArraysTriangles(int first, int count) 
{
    for (int i = 0; i < count; i += 3) 
    {
        // Get the vertices for the triangle
        Vertex v0 = vertices[first + i];
        Vertex v1 = vertices[first + i + 1];
        Vertex v2 = vertices[first + i + 2];
        std::cout << "Draw arrays triangles starting with " << first + i << " " << first + i + 1 << " " << first + i + 2 << std::endl;

        // Draw the triangle using scanlineFill
        scanlineFill(v0, v1, v2);
    }
}


void drawElementsTriangles(int count, int offset) 
{
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
