CC = clang++
CFLAGS = -O3 
LDFLAGS = -lpng
OBJ = main.o uselibpng.o rasterizer.o
TARGET = program

.PHONY: build run clean

build: $(TARGET)

$(TARGET): $(OBJ)
	    $(CC) $(OBJ) $(LDFLAGS) -o $(TARGET)

main.o: main.cpp uselibpng.h rasterizer.h
	    $(CC) $(CFLAGS) -c main.cpp

uselibpng.o: uselibpng.c uselibpng.h
		$(CC) $(CFLAGS) -c uselibpng.c

rasterizer.o: rasterizer.cpp rasterizer.h

run: $(TARGET)
	    ./$(TARGET) $(file)

clean:
	    rm -f $(OBJ) $(TARGET)