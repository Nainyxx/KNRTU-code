const size_x = 20;
const size_y = 20;

function generateMaze(size_x, size_y) {
    const maze = Array(size_x).fill().map(() => Array(size_y).fill('wall'));
    
    const startX = Math.floor(Math.random() * (size_x - 2)) + 1;
    const startY = Math.floor(Math.random() * (size_y - 2)) + 1;
    maze[startX][startY] = 'air';
    
    const directions = [[-1,0],[0,1],[1,0],[0,-1]];
    let cells = [[startX, startY]];
    
    while (cells.length > 0) {
        const [x, y] = cells[cells.length - 1];
        const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);
        let found = false;
        
        for (const [dx, dy] of shuffledDirs) {
            const nx = x + dx * 2;
            const ny = y + dy * 2;
            
            if (nx > 0 && nx < size_x - 1 && ny > 0 && ny < size_y - 1 && maze[nx][ny] === 'wall') {
                maze[x + dx][y + dy] = 'air';
                maze[nx][ny] = 'air';
                cells.push([nx, ny]);
                found = true;
                break;
            }
        }
        
        if (!found) {
            cells.pop();
        }
    }
    
    const borders = [];
    for (let j = 1; j < size_y - 1; j++) {
        if (maze[1][j] === 'air') borders.push([0, j]);
        if (maze[size_x - 2][j] === 'air') borders.push([size_x - 1, j]);
    }
    for (let i = 1; i < size_x - 1; i++) {
        if (maze[i][1] === 'air') borders.push([i, 0]);
        if (maze[i][size_y - 2] === 'air') borders.push([i, size_y - 1]);
    }
    
    if (borders.length > 0) {
        const [exitX, exitY] = borders[Math.floor(Math.random() * borders.length)];
        maze[exitX][exitY] = 'air';
    }
    
    return maze;
}


const maze = generateMaze(size_x, size_y);

const mazeContainer = document.createElement('div');
mazeContainer.className = 'maze-container';

for (let i = 0; i < size_x; i++) {
    let rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    
    for (let k = 0; k < size_y; k++) {
        let cellDiv = document.createElement('div');
        cellDiv.className = maze[i][k];
        rowDiv.appendChild(cellDiv);
    }
    mazeContainer.appendChild(rowDiv);
}

document.body.appendChild(mazeContainer);

const player = {
    x: 0,
    y: 0
};

const lightRadius = 3;
let showAllMaze = false;

function placePlayer(maze) {
    const airCells = [];
    for (let i = 1; i < maze.length - 1; i++) {
        for (let j = 1; j < maze[i].length - 1; j++) {
            if (maze[i][j] === 'air') {
                airCells.push([i, j]);
            }
        }
    }
    if (airCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * airCells.length);
        [player.x, player.y] = airCells[randomIndex];
    }
}

function isVisible(maze, startX, startY, targetX, targetY) {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    
    for (let i = 0; i <= distance; i++) {
        const x = startX + Math.round(dx * i / distance);
        const y = startY + Math.round(dy * i / distance);
        
        if (maze[x][y] === 'wall') {
            return false;
        }
    }
    return true;
}

function createToggleButton() {
    const button = document.createElement('button');
    button.textContent = 'Show map';
    button.className = 'toggle-button';
    button.addEventListener('click', () => {
        showAllMaze = !showAllMaze;
        button.textContent = showAllMaze ? 'Hide map' : 'Show map';
        drawMazeWithPlayer(maze);
    });
    return button;
}

function drawMazeWithPlayer(maze) {
    document.body.innerHTML = '';
    
    const button = createToggleButton();
    document.body.appendChild(button);
    
    const mazeContainer = document.createElement('div');
    mazeContainer.className = 'maze-container';

    for (let i = 0; i < maze.length; i++) {
        let rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        
        for (let j = 0; j < maze[i].length; j++) {
            let cellDiv = document.createElement('div');
            const distance = Math.max(Math.abs(i - player.x), Math.abs(j - player.y));
            
            if (i === player.x && j === player.y) {
                cellDiv.className = 'player';
                cellDiv.style.backgroundImage = 'url("player.png")';
            } else if (showAllMaze || (distance <= lightRadius && isVisible(maze, player.x, player.y, i, j))) {
                cellDiv.className = maze[i][j];
            } else {
                cellDiv.className = 'non-visible';
            }
            rowDiv.appendChild(cellDiv);
        }
        mazeContainer.appendChild(rowDiv);
    }
    
    document.body.appendChild(mazeContainer);
}

function movePlayer(dx, dy, maze) {
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (newX >= 0 && newX < maze.length && newY >= 0 && newY < maze[0].length) {
        if (maze[newX][newY] === 'air') {
            player.x = newX;
            player.y = newY;
            drawMazeWithPlayer(maze);
        }
    }
}

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': movePlayer(-1, 0, maze); break;
        case 'ArrowDown': movePlayer(1, 0, maze); break;
        case 'ArrowLeft': movePlayer(0, -1, maze); break;
        case 'ArrowRight': movePlayer(0, 1, maze); break;
    }
});

placePlayer(maze);
drawMazeWithPlayer(maze);