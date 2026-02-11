const CONFIG = {
    frameRate: 120,
    speedScale: 2,
    strippin: true,
    otskokScale: -0.8
};

class letObj {
    constructor(id, size_x, size_y, color, cord_x, cord_y) {
        this.id = id;
        this.size_x = size_x;
        this.size_y = size_y;
        this.color = color;
        this.cord_x = cord_x;
        this.cord_y = cord_y;
        this.element = null;
    }
}

class Player {
    constructor(size_x, size_y, form, png, speedChange, cord_x = 0, cord_y = 0) {
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
    }
}

let Obj1 = new letObj(1, 100, 100, 'black', 500, 500)

let letObjArray = [Obj1];

let player = new Player(20, 20, 'circle', 'player.png', 10, 100, 100);

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

async function movement(playerObj, speedScale, speedChange, letObjArray, CONFIG, gravitation) {
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
        if (playerObj.speed_y > 1 || playerObj.speed_y < -1) {
            playerObj.speed_y = playerObj.speed_y + (gravitation / CONFIG.frameRate);
        }
    }
    if (!keys.a && !keys.d) {
        if (playerObj.speed_x > 1 || playerObj.speed_x < -1) {
            playerObj.speed_x = playerObj.speed_x / (1 + 0.5 / CONFIG.frameRate);
        }
    }
    
    await updatePlayerPosition(playerObj, letObjArray, CONFIG);
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
            // Отскок
            player.speed_x *= CONFIG.otskokScale;
            player.speed_y *= CONFIG.otskokScale;
            
            // Выталкиваем игрока из объекта
            if (player.cord_x < obj.cord_x) {
                player.cord_x = obj.cord_x - player.size_x;
            } else {
                player.cord_x = obj.cord_x + obj.size_x;
            }
            
            if (player.cord_y < obj.cord_y) {
                player.cord_y = obj.cord_y - player.size_y;
            } else {
                player.cord_y = obj.cord_y + obj.size_y;
            }
        }
    }
}


async function updatePlayerPosition(player, letObjArray, CONFIG) {
    if (player.element) {
        
        handleCollisions(player,letObjArray, CONFIG)

        player.cord_x = player.cord_x + player.speed_x / CONFIG.frameRate;
        player.cord_y = player.cord_y + player.speed_y / CONFIG.frameRate;

        player.element.style.left = player.cord_x + 'px';
        player.element.style.top = player.cord_y + 'px';

    }
}

async function physX(player, speedChange, speedScale, stoppin, CONFIG, letObjArray, gravitation=0) {
    let letObjActive;
    for (let i = 0; i < letObjArray.length; i++) {
        letObjActiveData = letObjArray[i]
        letObjActive = document.createElement('div');
        letObjActive.className = 'letObj';
        letObjActive.style.cssText = `
            position: absolute;
            left: ${letObjActiveData.cord_x}px;
            top: ${letObjActiveData.cord_y}px;
            width: ${letObjActiveData.size_x}px;
            height: ${letObjActiveData.size_y}px;
            background-color: ${letObjActiveData.color};
        `
        document.body.appendChild(letObjActive)

    }

    let pl = document.createElement('div');
    pl.className = 'ghh';
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
        z-index: 10;
    `;
    document.body.appendChild(pl);
    player.element = pl;
    
    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (key in keys) {
            keys[key] = true;
        }
    });
    
    document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        if (key in keys) {
            keys[key] = false;
        }
    });
    
    async function gameLoop() {
        if (!stoppin) return;
        
        player.speed_y += gravitation;
        await movement(player, speedScale, speedChange, letObjArray, CONFIG, gravitation);
        
        requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
}

physX(player, player.speedChange, CONFIG.speedScale, CONFIG.strippin, CONFIG, letObjArray, 10);