import random

numbers = [random.randint(1, 10) for _ in range(15)]
print("Before Sort:", numbers, "\n")

max_val = max(numbers)
min_val = min(numbers)
count = [0] * (max_val - min_val + 1)
print(count)

for num in numbers:
    count[num - min_val] += 1
    print(num, "===>", count)

sorted_numbers = []
for i in range(len(count)):
    sorted_numbers.extend([i + min_val] * count[i])


print("\nAfter Sort:", sorted_numbers)
print("Count Arr:", count, "\n", "Min and max vals:", min_val, max_val)