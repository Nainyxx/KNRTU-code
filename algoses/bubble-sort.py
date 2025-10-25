import random

numbers = [random.randint(1, 100) for _ in range(10)]
print("Before Sort:", numbers, "\n")

n = len(numbers)
for i in range(n):
    for j in range(0, n - i - 1):
        if numbers[j] > numbers[j + 1]:
            numbers[j], numbers[j + 1] = numbers[j + 1], numbers[j]
    print(f"Operation {i + 1}: ", numbers)

print("\nAfter Sort:", numbers)