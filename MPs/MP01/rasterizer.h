#pragma once
#include <vector>
#include <cmath>
#include <algorithm>
#include "uselibpng.h"


// Data structures 
struct Vec2 {
    float x, y;

    // Default constructor
    Vec2() : x(0), y(0) {}

    // Constructor to initialize with values
    Vec2(float _x, float _y) : x(_x), y(_y) {}

    Vec2 operator+(const Vec2 &v) const;

    Vec2 operator-(const Vec2 &v) const;

    Vec2 operator*(float scalar) const;

    Vec2 operator/(float scalar) const;
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
    
    Vec4 operator+(const Vec4 &v) const;

    Vec4 operator-(const Vec4 &v) const;

    Vec4 operator*(float scalar) const;

    Vec4 operator/(float scalar) const;

    float& operator[](int index) {
        switch (index) {
            case 0: return x; case 1: return y; case 2: return z; case 3: return w;
            default: throw std::out_of_range("Vec4 index out of range");
        }
    }

    const float& operator[](int index) const {
        switch (index) {
            case 0: return x; case 1: return y; case 2: return z; case 3: return w;
            default: throw std::out_of_range("Vec4 index out of range");
        }
    }
};

Vec4 operator*(float scalar, const Vec4& vec);


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

    Vertex operator-(const Vertex& other) const {
        Vertex result;
        result.position = this->position - other.position;
        result.color = this->color - other.color;
        return result;
    }

    // Add two vertices (add their positions and colors)
    Vertex operator+(const Vertex& other) const {
        Vertex result;
        result.position = this->position + other.position;
        result.color = this->color + other.color;
        return result;
    }

    // Scalar multiplication for interpolation (position and color)
    Vertex operator*(float scalar) const {
        Vertex result;
        result.position = this->position * scalar;
        result.color = this->color * scalar;
        return result;
    }

    // Scalar multiplication for interpolation (position and color)
    Vertex operator/(float scalar) const {
        Vertex result;
        result.position = this->position / scalar;
        result.color = this->color / scalar;
        return result;
    }

};


extern std::vector<Vertex> vertices;
extern std::vector<Vec4> positions;
extern std::vector<Vec4> colors;
extern Image* img;
extern std::vector<int> elements;
extern std::vector<std::vector<float>> depthBuffer; // std::vector<float> depthBuffer;
extern std::vector<Vec2> texcoords;
extern bool hypEnabled;
extern bool sRGBEnabled;
extern bool depthEnabled;

std::vector<Vertex> DDA(const Vertex &a, const Vertex &b, bool dirY);
void scanlineFill(const Vertex &p1, const Vertex &p2, const Vertex &p3);

void setPixel(Vertex p);

void drawArraysTriangles(int first, int count);
void drawElementsTriangles(int count, int offset);
