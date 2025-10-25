# █ ▓
from random import randint

def labGenerator(size_x, size_y, exit_x, exit_y):
    if ((exit_x == size_x or exit_x - 1 == 0) and (exit_y == size_y or exit_y - 1 == 0)):
        return False
    #if not((exit_x == size_x) or (exit_y == size_y)):
    #    return False
    lab = ['▓' * size_x for s in range(size_y)]
    lab[exit_y - 1].replace(lab[exit_y - 1][exit_x - 1], ' ')
    return lab

def labPrint(lab):
    for i in lab:
        print(i)

labPrint(labGenerator(13,12, 13, 2))