#include <iostream>
#include <string>
#include <fstream>

int main() {
    std::ifstream file("input.txt");
    std::string content;

    if (file.is_open()) {
        std::string line;
        while (std::getline(file, line)) {
            content += line + "\n";
        }
        file.close();
    }

    std::cout << content;
}