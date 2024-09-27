#include <iostream>
#include <fstream>
#include <string>
#include <png.h>
#include <vector>
#include <cmath>
#include <sstream>

#include "rasterizer.h"

// Global Variables
std::vector<Vertex> vertices;
std::vector<Vec4> positions;
std::vector<Vec4> colors;
Image* img = nullptr;
std::string fileName;

// Mode Setting
bool depthEnabled = false;
std::vector<float> depthBuffer;
bool sRGBEnabled = false;
bool hypEnabled  = false;
// bool frustumClippingEnabled = false;
// bool cullingEnabled = false;
// bool decalsEnabled = false;
// int fsaaLevel = 1;
std::vector<int> elements;
std::vector<Vec2> texcoords;
// std::vector<float> pointSizes;


void parseFile(const std::string &filename);
void createVertices(const std::vector<Vec4>& positions, const std::vector<Vec4>& colors, const std::vector<Vec2>& texcoords);


void createVertices(const std::vector<Vec4>& positions, const std::vector<Vec4>& colors, const std::vector<Vec2>& texcoords) 
{
    vertices.clear();
    size_t numVertices = positions.size();
    
    for (size_t i = 0; i < numVertices; ++i) 
    {
        Vec4 pos = positions[i];
        Vec4 col = (i < colors.size()) ? colors[i] : Vec4(1, 1, 1, 1);  // Default color is white (1, 1, 1, 1)
        Vec2 tex = (i < texcoords.size()) ? texcoords[i] : Vec2(0, 0);  // Default texcoord is (0, 0)
        
        // Create vertex and push into the vertices vector
        Vertex vertex(pos, col, tex);
        vertices.push_back(vertex);
        std::cout << "createVertices " << pos.x <<" "<< pos.y <<" " << pos.z <<" " << pos.w <<" " << col.x <<" " << col.y <<" " << col.z <<" " << col.w <<" " << std::endl;
    }
}


void parseFile(const std::string &filename) 
{
    std::ifstream infile(filename);
    std::string inputLine;
    int width{1}, height{1};
    
    std::cout << "Begin parsing file..." << std::endl;
    while (std::getline(infile, inputLine)) {
        std::istringstream iss(inputLine);
        std::string keyword;
        iss >> keyword;
        if (keyword == "png")
        {
            iss >> width >> height >> fileName;
            img = new Image(width, height);
            std::cout << "PNG" << width << "x" << height<< std::endl;    //Debugging
        }
        // Mode Setting 
        else if (keyword == "depth") 
        {
            depthEnabled = true;
            std::cout << "Depth buffer and tests enabled." << std::endl;
        } 
        else if (keyword == "sRGB") 
        {
            sRGBEnabled = true;
            std::cout << "sRGB conversion enabled" << std::endl;
        } 
        else if (keyword == "hyp") 
        {
            hypEnabled = true;
            std::cout << "Hyperbolic interpolation enabled." << std::endl;

        } 
        // else if (keyword == "fsaa") 
        // {
        //     iss >> fsaaLevel;
        //     std::cout << "fsaa Level set: " << fsaaLevel << std::endl;
        // } 
        // else if (keyword == "cull") 
        // {
        //     cullingEnabled = true;
        // } 
        // else if (keyword == "decals") 
        // {
        //     decalsEnabled = true;
        // } 
        // else if (keyword == "frustum") 
        // {
        //     frustumClippingEnabled = true;
        // }
        // else if (keyword == "texture") {
        //     std::string textureFile;
        //     iss >> textureFile;
        //     // Handle texture loading (can use libpng to read texture from PNG)
        // } else if (keyword == "uniformMatrix") {
        //     float matrix[16];
        //     for (int i = 0; i < 16; ++i) {
        //         iss >> matrix[i];
        //     }
        // } 
        // Buffer provision
        else if (keyword == "position") 
        {
            int size;
            iss >> size;
            float num;
             std::vector<float> positionData;
            while (iss >> num) 
            {
                positionData.push_back(num);
            }
            // Get the positions
            for (size_t i = 0; i < positionData.size(); i += size) 
            {
                Vec4 pos;
                pos.x = positionData[i];
                pos.y = (size > 1) ? positionData[i + 1] : 0;
                pos.z = (size > 2) ? positionData[i + 2] : 0;
                pos.w = (size > 3) ? positionData[i + 3] : 1; 

                // Viewport transformation
                pos.x = ((pos.x / pos.w) + 1) * (width / 2.0f);
                pos.y = ((pos.y / pos.w) + 1) * (height / 2.0f);
                positions.push_back(pos);
                std::cout << "pos: " << pos.x << " "<< pos.y<< " " << pos.z << " "<< pos.w<< std::endl;
            }
            std::cout << "Position" << size << std::endl;    //Debugging
        } 
        else if (keyword == "color") {
            int size;
            iss >> size;
            float num;
            while (iss >> num) 
            {
                Vec4 col;
                col.x = num;
                if (size > 1) iss >> col.y;
                if (size > 2) iss >> col.z;
                if (size > 3) iss >> col.w;
                colors.push_back(col);
                std::cout << "col: " << col.x << " "<< col.y<< " " << col.z << " "<< col.w<< std::endl;

            }
        }
        else if (keyword == "texcoord")
        {
            int size;
            iss >> size;
            float s, t;
            while (iss >> s >> t) 
            {
                texcoords.push_back(Vec2(s, t));
                std::cout << "texcoords: " << s << " "<< t << std::endl;

            }
        }
        // else if (keyword == "pointsize")
        // {
        //     float size;
        //     while (iss >> size) 
        //     {
        //         pointSizes.push_back(size);
        //     }
        // }
        else if (keyword == "elements") 
        {
            int elementIdx;
            while (iss >> elementIdx) 
            {
                elements.push_back(elementIdx);
            }
        }
        else if (keyword == "drawArraysTriangles")
        {
            int first, count;
            iss >> first >> count;
            std::cout << "DrawArraysTriangles" << first << ":"<< count <<  std::endl;    // Debugging
            createVertices(positions, colors, texcoords);
            drawArraysTriangles(first, count);
        } 
        else if (keyword == "drawElementsTriangles") 
        {
            int count, offset;
            iss >> count >> offset;
            std::cout << "drawElementsTriangles" << count << ":"<< offset <<  std::endl;    // Debugging
            createVertices(positions, colors, texcoords);
            drawElementsTriangles(count, offset);
        } 
        // else if (keyword == "drawArraysPoints") 
        // {
        //     int first, count;
        //     iss >> first >> count;
        //     // Draw points based on positions and pointSizes
        //     createVertices(positions, colors, texcoords);
        //     drawArraysPoints(positions[first], pointSizes[first]);
        // }

    }
}


int main(int argc, char *argv[])
{
    std::string inputFile = argv[1];
	std::ifstream infile(inputFile);
    std::cout << "Opening File..." << std::endl;    // Debugging
	if (!infile)
	{
		std::cerr << "Error opening the file! Terminating the program" << std::endl;
		exit(1);
	}
    //Image* img = nullptr;

    parseFile(inputFile);

    if(img)
    {
        std::cout << "saving img to ... " << fileName << std::endl;;
        img->save(fileName.c_str());
        delete img;
        img = nullptr;
    }
    else
    {
        std::cout << "Error: Can't save image." << std::endl;
    }

    return 0;
}
