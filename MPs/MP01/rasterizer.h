#pragma once
#include <vector>
#include "uselibpng.h"


// Data structures 
struct Vec4 {
    float x, y, z, w;

    Vec4(): x(0), y(0), z(0), w(1){}
    // // Constructor for a 2D position (z=0, w=1 by default)
    Vec4(float x, float y) : x(x), y(y), z(0), w(1) {}

    // Constructor for a 4D position
    Vec4(float x, float y, float z, float w) : x(x), y(y), z(z), w(w) {}

    // Constructor for RGBA color
    static Vec4 Color(float r, float g, float b, float a) {
        return Vec4(r, g, b, a);
    }

    Vec4 operator+(const Vec4 &v) const {
        return Vec4(x + v.x, y + v.y, z + v.z, w + v.w);
    }

    Vec4 operator-(const Vec4 &v) const {
        return Vec4(x - v.x, y - v.y, z - v.z, w - v.w);
    }

    Vec4 operator*(float scalar) const {
        return Vec4(x * scalar, y * scalar, z * scalar, w * scalar);
    }

    Vec4 operator/(float scalar) const {
        return Vec4(x / scalar, y / scalar, z / scalar, w / scalar);
    }
};



extern std::vector<Vec4> positions;
extern std::vector<Vec4> colors;
extern Image* img;
extern std::vector<int> elements;
extern bool hypEnabled;
extern bool depthEnabled;
extern std::vector<float> depthBuffer;

void DDA(const Vec4 &start, const Vec4 &end, const Vec4 &startColor, const Vec4 &endColor);
void scanlineFill(const Vec4 &top, const Vec4 &middle, const Vec4 &bottom, const Vec4 &colorTop, const Vec4 &colorMiddle, const Vec4 &colorBottom);

void setPixel(int x, int y, const Vec4 &color);

void drawArraysTriangles(int first, int count);
void drawElementsTriangles(int count, int offset);
