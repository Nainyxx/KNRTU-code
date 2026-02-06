// y = 2 * sqrt(x + 3) + x^2
#include <iostream>
#include <cmath>
#include <vector>
#include <algorithm>

const float a = 2;
const float b = 4;
const float pogr = 0.1;

float math_funct(float x) {
    return 2 * std::sqrt(x + 3) + x * x;
}

std::vector<float> ravnomraspred(float a, float b, float eps, float iter = 0) {
    float step = eps / 10;
    std::vector<float> nums;
    std::vector<float> x_values;

    for (float x = a; x <= b + step/2; x += step) {
        x_values.push_back(x);
        nums.push_back(math_funct(x));
    }

    auto max_it = std::max_element(nums.begin(), nums.end());
    int max_index = std::distance(nums.begin(), max_it);
    float x_max = x_values[max_index];
    float y_max = *max_it;

    return {x_max, y_max, iter + (b - a) / step};
}

std::vector<float> diht(float a, float b, float eps, int iter = 0) {
    if ((b - a) <= eps) {
        float x_opt = (a + b) / 2;
        float y_opt = math_funct(x_opt);
        return {x_opt, y_opt, static_cast<float>(iter)};
    }

    float x1 = (a + b - eps/2) / 2;
    float x2 = (a + b + eps/2) / 2;

    if (math_funct(x1) < math_funct(x2)) {
        return diht(x1, b, eps, iter + 1);
    } else {
        return diht(a, x2, eps, iter + 1);
    }
}

std::vector<float> goldenRatio(float a, float b, float eps, float iter = 0) {
    if (b - a <= eps) {
        float x_opt = (a + b) / 2;
        float y_opt = math_funct(x_opt);
        return {x_opt, y_opt, iter};
    }
    
    float x1 = a + 0.382 * (b - a);
    float x2 = a + 0.618 * (b - a);
    
    float f1 = math_funct(x1);
    float f2 = math_funct(x2);
    
    if (f1 > f2) {
        return goldenRatio(a, x2, eps, iter + 1);
    } else {
        return goldenRatio(x1, b, eps, iter + 1);
    }
}

int main() {
    std::vector<float> result = ravnomraspred(a,b,pogr, 1);
    
    std::cout << result[1] << " " << result[2] << std::endl;

    result = diht(a,b,pogr, 1);
    std::cout << result[1] << " " << result[2] << std::endl;

    result = goldenRatio(a,b,pogr, 1);
    std::cout << result[1] << " " << result[2] << std::endl;
    return 1;
}   