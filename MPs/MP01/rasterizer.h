#pragma once
#include <vector>
#include "uselibpng.h"


// Data structures 
struct Vec2 {
    float x, y;

    // Default constructor
    Vec2() : x(0), y(0) {}

    // Constructor to initialize with values
    Vec2(float _x, float _y) : x(_x), y(_y) {}

    Vec2 operator+(const Vec2 &v) const {
        return Vec2(x + v.x, y + v.y);
    }

    Vec2 operator-(const Vec2 &v) const {
        return Vec2(x - v.x, y - v.y);
    }

    Vec2 operator*(float scalar) const {
        return Vec2(x * scalar, y * scalar);
    }

    Vec2 operator/(float scalar) const {
        return Vec2(x / scalar, y / scalar);
    }
};

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

struct Vertex {
    Vec4 position;  // (x, y, z, w)
    Vec4 color;     // (r, g, b, a)
    Vec2 texcoord;  // (s, t)

    Vertex()
    {
        Vec4 position;
        Vec4 color;
        Vec2 texcoord;
    }
    Vertex(const Vec4 &pos, const Vec4 &col, const Vec2 &tex) 
        : position(pos), color(col), texcoord(tex) {}
};


extern std::vector<Vertex> vertices;
extern std::vector<Vec4> positions;
extern std::vector<Vec4> colors;
extern Image* img;
extern std::vector<int> elements;
extern std::vector<Vec2> texcoords;
extern bool hypEnabled;
extern bool sRGBEnabled;
extern bool depthEnabled;
extern std::vector<float> depthBuffer;

std::vector<Vertex> DDA(const Vertex &a, const Vertex &b, bool dirY);
void scanlineFill(const Vertex &p1, const Vertex &p2, const Vertex &p3);

void setPixel(int x, int y, const Vec4 &color);

void drawArraysTriangles(int first, int count);
void drawElementsTriangles(int count, int offset);
