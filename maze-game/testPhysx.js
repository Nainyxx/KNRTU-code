const CONFIG = {
    frameRate: 120,
    speedScale: 2,
    strippin: true,
    otskokScale: 0.7,
    friction: 0.98,
    gravitation: 10,
    maze_size_x: 30,
    maze_size_y: 30,
    one_cube_size_x: 30,
    colorCube: 'black',
    vision: 300
};

class letObj {
    constructor(id, size_x, size_y, color, cord_x, cord_y, className) {
        this.id = id;
        this.size_x = size_x;
        this.size_y = size_y;
        this.color = color;
        this.cord_x = cord_x;
        this.cord_y = cord_y;
        this.element = null;
        this.class = className;
    }
}

class Player {
    constructor(size_x, size_y, form, png, speedChange, cord_x = 0, cord_y = 0, vision=CONFIG.vision) {
        this.size_x = size_x;
        this.size_y = size_y;
        this.png = png;
        this.form = form;
        this.speed_x = 0;
        this.speed_y = 0;
        this.cord_x = cord_x;
        this.cord_y = cord_y;
        this.speedChange = speedChange;
        this.element = null;
        this.vision = vision;

    }
}

class Maze {
    constructor(size_x, size_y) {
        this.size_x = size_x;
        this.size_y = size_y;
    }
}

function generateMaze(size_x, size_y, CONFIG) {
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
    console.log(maze)
    let letObjArray = [];
    let k = 0;
    for (let i = 0; i < maze.length; i++) {
        for (let j = 0; j < maze[i].length; j++) {
            if (maze[i][j] == 'wall') {
                letObjArray.push(new letObj(k, CONFIG.one_cube_size_x, CONFIG.one_cube_size_x, CONFIG.colorCube, j * CONFIG.one_cube_size_x, i * CONFIG.one_cube_size_x, 'wall1'))
            }
        }
    }

    return letObjArray;
}



let player = new Player(20, 20, 'circle', 'player.png', 10, 420, 350, );

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    subtract(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    multiply(s) {
        return new Vector(this.x * s, this.y * s);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        const m = this.mag();
        return m === 0 ? new Vector(0, 0) : new Vector(this.x / m, this.y / m);
    }
    reflect(n) {
        const dot = this.dot(n);
        return new Vector(this.x - 2 * dot * n.x, this.y - 2 * dot * n.y);
    }
}

function getCollisionNormal(player, obj) {
    const pCenter = new Vector(
        player.cord_x + player.size_x / 2,
        player.cord_y + player.size_y / 2
    );
    
    const oCenter = new Vector(
        obj.cord_x + obj.size_x / 2,
        obj.cord_y + obj.size_y / 2
    );
    
    const delta = pCenter.subtract(oCenter);
    const halfW = obj.size_x / 2;
    const halfH = obj.size_y / 2;
    const overlapX = halfW - Math.abs(delta.x);
    const overlapY = halfH - Math.abs(delta.y);
    
    if (overlapX < overlapY) {
        return new Vector(delta.x > 0 ? 1 : -1, 0);
    } else {
        return new Vector(0, delta.y > 0 ? 1 : -1);
    }
}

function checkCollision(player, obj) {
    return player.cord_x < obj.cord_x + obj.size_x &&
           player.cord_x + player.size_x > obj.cord_x &&
           player.cord_y < obj.cord_y + obj.size_y &&
           player.cord_y + player.size_y > obj.cord_y;
}

function handleCollisions(player, letObjArray, CONFIG) {
    
    for (let obj of letObjArray) {
        if (checkCollision(player, obj)) {
            const normal = getCollisionNormal(player, obj);
            const velocity = new Vector(player.speed_x, player.speed_y);
            const reflected = velocity.reflect(normal).multiply(CONFIG.otskokScale);
            
            player.speed_x = reflected.x;
            player.speed_y = reflected.y;
            
            if (normal.x !== 0) {
                if (normal.x > 0) {
                    player.cord_x = obj.cord_x + obj.size_x;
                } else {
                    player.cord_x = obj.cord_x - player.size_x;
                }
            }
            
            if (normal.y !== 0) {
                if (normal.y > 0) {
                    player.cord_y = obj.cord_y + obj.size_y;
                } else {
                    player.cord_y = obj.cord_y - player.size_y;
                }
            }
        }
    }
}



async function movement(playerObj, speedScale, speedChange, letObjArray, CONFIG, gravitation,vision_div) {
    if (keys.w) {
        playerObj.speed_y = playerObj.speed_y - speedChange * speedScale;
    }
    if (keys.s) {
        playerObj.speed_y = playerObj.speed_y + speedChange * speedScale;
    }
    if (keys.a) {
        playerObj.speed_x = playerObj.speed_x - speedChange * speedScale;
    }
    if (keys.d) {
        playerObj.speed_x = playerObj.speed_x + speedChange * speedScale;
    }
    
    if (!keys.w && !keys.s) {
        if (Math.abs(playerObj.speed_y) > 1) {
            if (gravitation !== 0) {
                playerObj.speed_y = playerObj.speed_y + (gravitation / CONFIG.frameRate);
            } else {
                playerObj.speed_y = playerObj.speed_y / (1 + 3 / CONFIG.frameRate);
            }
        }
    }
    
    if (!keys.a && !keys.d) {
        if (Math.abs(playerObj.speed_x) > 1) {
            playerObj.speed_x = playerObj.speed_x / (1 + 3 / CONFIG.frameRate);
        }
    }
    
    await updatePlayerPosition(playerObj, letObjArray, CONFIG, vision_div);
}

async function updatePlayerPosition(player, letObjArray, CONFIG, vision_div) {
    if (player.element) {
        player.cord_x = player.cord_x + player.speed_x / CONFIG.frameRate;
        player.cord_y = player.cord_y + player.speed_y / CONFIG.frameRate;
        
        handleCollisions(player, letObjArray, CONFIG);
        
        player.element.style.left = player.cord_x + 'px';
        player.element.style.top = player.cord_y + 'px';

        if (vision_div) {
            vision_div.style.left = (player.cord_x - (player.vision - player.size_x) / 2) + 'px';
            vision_div.style.top = (player.cord_y - (player.vision - player.size_y) / 2) + 'px';
        }
    }
}

async function physX(player, speedChange, speedScale, stoppin, CONFIG, gravitation = 0) {
    const letObjArray = generateMaze(CONFIG.maze_size_x, CONFIG.maze_size_y, CONFIG)
    const mazeContainer = document.createElement('div')
    mazeContainer.style.cssText = `
        position: absolute;
        left: calc(50% - ${CONFIG.maze_size_x * CONFIG.one_cube_size_x / 2} px);
        top: calc(50% - ${CONFIG.maze_size_y * CONFIG.one_cube_size_x / 2} px);
        width: ${CONFIG.maze_size_x * CONFIG.one_cube_size_x}px;
        height: ${CONFIG.maze_size_y * CONFIG.one_cube_size_x}px;
    `

    for (let i = 0; i < letObjArray.length; i++) {
        let objData = letObjArray[i];
        let objElement = document.createElement('div');
        objElement.className = 'letObj';
        objElement.style.cssText = `
            position: absolute;
            left: ${objData.cord_x}px;
            top: ${objData.cord_y}px;
            width: ${objData.size_x}px;
            height: ${objData.size_y}px;
            background-color: ${objData.color};
        `;
        mazeContainer.appendChild(objElement);
    }

let pl = document.createElement('div');
pl.style.cssText = `
    position: absolute;
    left: ${player.cord_x}px;
    top: ${player.cord_y}px;
    width: ${player.size_x}px;
    height: ${player.size_y}px;
    border-radius: ${player.form === 'circle' ? '50%' : '0'};
    background-color: red;
    border: 2px solid darkred;
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
    z-index: 1000;
`;

// Создаем освещение отдельно
let vision_div = document.createElement('div');
vision_div.style.cssText = `
    position: absolute;
    width: ${player.vision}px;
    height: ${player.vision}px;
    border-radius: 50%;
    background-color: transparent;
    top: ${player.cord_y - (player.vision - player.size_y) / 2}px;
    left: ${player.cord_x - (player.vision - player.size_x) / 2}px;
    z-index: 100;
    box-shadow: 0 0 0 9999px black;
    pointer-events: none;
`;

mazeContainer.appendChild(pl);
mazeContainer.appendChild(vision_div);
player.element = pl;


    document.body.appendChild(mazeContainer)
    
    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (key in keys) keys[key] = true;
    });
    
    document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        if (key in keys) keys[key] = false;
    });
    
    async function gameLoop() {
        if (!stoppin) return;
        player.speed_y += gravitation;
        await movement(player, speedScale, speedChange, letObjArray, CONFIG, gravitation, vision_div);
        requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
}

physX(player, player.speedChange, CONFIG.speedScale, CONFIG.strippin, CONFIG, CONFIG.gravitation);
