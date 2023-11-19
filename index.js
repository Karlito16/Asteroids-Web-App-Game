// Game constants
const FPS = 30;
const NUM_OF_ENEMIES = 100;
const SPAWN_FREQUENCY = 3 * 1000; // Every 3 seconds
const MAX_COMPONENT_SPEED = 2;
const MIN_COMPONENT_SPEED = 0.1;
const MAX_COMPONENT_WIDTH = 10;
const MIN_COMPONENT_WIDTH = 2;
const SPAWN_OFFSET = MAX_COMPONENT_WIDTH * 10;
const LOCAL_STORAGE_BEST_SCORE_KEYWORD = "bestScore";

// Game variables
let gameArea;
let player;
let enemies;
let enemiesSpawnInterval;
let gameOver;
let startTime;
let bestScore;
let mainMenu;
let spawnFactor;


// UI elements
let startGameDialog = document.getElementById("startGameDialog");
let endGameDialog = document.getElementById("endGameDialog");


// Utility functions
let getRandom = (a, b) => (b - a) * Math.random() + a;


let toHex = (decimal) => {
    var hex = decimal.toString(16);
    
    // Ensure leading zero
    if (hex.length % 2 !== 0) {
        hex = '0' + hex;
    }
  
    return hex.toUpperCase();
}


let generateNewEnemy = () => {
    let rgbFactor = toHex(Math.floor(getRandom(100, 220)));
    let color = "#" + rgbFactor + rgbFactor + rgbFactor;
    let width = getRandom(MIN_COMPONENT_WIDTH, MAX_COMPONENT_WIDTH);

    // Get spawn position
    let validSpawnPosition = false;
    let x;
    let y;
    while (!validSpawnPosition) {
        x = getRandom(-SPAWN_OFFSET, gameArea.canvas.width + SPAWN_OFFSET);
        y = getRandom(-SPAWN_OFFSET, gameArea.canvas.height + SPAWN_OFFSET);

        validSpawnPosition = (x < -MAX_COMPONENT_WIDTH || x > gameArea.canvas.width) && (y < -MAX_COMPONENT_WIDTH || y > gameArea.canvas.height)
    }
    enemies.push(new Component(width, width, color, x, y, false));
};


let generateEnemies = (enemyList=undefined) => {
    enemies = enemyList == undefined ? [] : enemyList;
    for (i = 0; i < NUM_OF_ENEMIES; i++) {
        generateNewEnemy();
    }
};


let generateNewEnemies = () => {
    let existingEnemies = [];
    for (enemy of enemies) {
        // Check if enemy is still within the canvas
        if (enemy.isInGameArea()) 
            existingEnemies.push(enemy);
        
    }
    generateEnemies(existingEnemies);
};


let createPlayer = () => {
    // Create player instance
    let x = gameArea.canvas.width / 2;
    let y = gameArea.canvas.height / 2;
    let playerSpeed = MAX_COMPONENT_SPEED;
    player = new Component(MAX_COMPONENT_WIDTH, MAX_COMPONENT_WIDTH, "red", x, y, true);

    // Bind keyboard events
    window.onkeydown = (event) => {
        switch(event.key) {
            case "ArrowUp":
                player.speed_x = 0;
                player.speed_y = -playerSpeed;
                break;
            case "ArrowDown":
                player.speed_x = 0;
                player.speed_y = playerSpeed;
                break;
            case "ArrowLeft":
                player.speed_x = -playerSpeed;
                player.speed_y = 0;
                break;
            case "ArrowRight":
                player.speed_x = playerSpeed;
                player.speed_y = 0;
                break;
        }
    };
};


let createGameArea = () => {
    gameArea = new GameArea();
};


let loadBestScore = () => {
    let value = localStorage.getItem(LOCAL_STORAGE_BEST_SCORE_KEYWORD);
    return value != undefined ? Number.parseInt(value) : value;
};


let setBestScore = (score) => {
    localStorage.setItem(LOCAL_STORAGE_BEST_SCORE_KEYWORD, JSON.stringify(score));
};


let formatScore = (score) => {
    // Calculate minutes, seconds, and milliseconds
    var minutes = Math.floor(score / (60 * 1000));
    var seconds = Math.floor((score % (60 * 1000)) / 1000);
    var milliseconds = score % 1000;

    // Ensure leading zeros
    var formattedMinutes = (minutes < 10) ? '0' + minutes : minutes;
    var formattedSeconds = (seconds < 10) ? '0' + seconds : seconds;
    var formattedMilliseconds = milliseconds.toLocaleString('en-US', {
        minimumIntegerDigits: 3,
        useGrouping: false
    });

    // Combine into MM:SS:MMM
    return formattedMinutes + ':' + formattedSeconds + ':' + formattedMilliseconds;
};


let showMainMenuDialog = () => {
    // Clear any preexisting intervals
    if (enemiesSpawnInterval)
        clearInterval(enemiesSpawnInterval);
    if (gameArea)
        clearInterval(gameArea.interval);
    
    // Clear end game dialog if exists
    endGameDialog?.close();

    // Reset game state
    mainMenu = true;
    gameOver = false;

    // Temp game area
    createGameArea();  
    generateEnemies();
    enemiesSpawnInterval = setInterval(generateNewEnemies, SPAWN_FREQUENCY);

    startGameDialog.show();
    gameArea.start();
};


let showEndGameDialog = (score) => {
    endGameDialog.show();
    document.getElementById("yourScore").innerText = formatScore(score);
    document.getElementById("bestScore").innerText = formatScore(bestScore);
};


class Component {
    constructor(width, height, color, x, y, isPlayer) {
        this.width = width;
        this.height = height;
        this.color = color;
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;

        if (this.isPlayer) {
            this.speed_x = MAX_COMPONENT_SPEED;
            this.speed_y = 0;
        } else {
            let x_direction = getRandom(-1, 1) > 0 ? 1 : -1;
            let y_direction = getRandom(-1, 1) > 0 ? 1 : -1;
            this.speed_x = getRandom(MIN_COMPONENT_SPEED, MAX_COMPONENT_SPEED) * x_direction;
            this.speed_y = getRandom(MIN_COMPONENT_SPEED, MAX_COMPONENT_SPEED) * y_direction;
        }
    }

    update() {
        let ctx = gameArea.context;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 4;
        ctx.shadowColor = "black";
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }

    newPos() {
        this.x += this.speed_x;
        this.y += this.speed_y;
    }

    checkCollision(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    isInGameArea() {
        return (
            this.x >= 0 &&
            this.y >= 0 &&
            this.x + this.width <= gameArea.canvas.width &&
            this.y + this.height <= gameArea.canvas.height
        );
    }
};


class GameArea {
    constructor() {
        this.canvas = document.getElementById("canvas");
    }
    
    start() {
        this.context = this.canvas.getContext("2d");
        this.interval = setInterval(update, 1000 / FPS);
    }
    
    stop() {
        clearInterval(this.interval);
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};


let startGame = () => {
    // Close main menu dialog
    mainMenu = false;
    clearInterval(enemiesSpawnInterval);
    clearInterval(gameArea.interval);

    // Close start and end game dialogs
    startGameDialog.close();
    endGameDialog.close();

    // Create game area
    createGameArea();

    // Create objects
    createPlayer();
    generateEnemies();
    enemiesSpawnInterval = setInterval(generateNewEnemies, SPAWN_FREQUENCY);

    // Init game state
    startTime = new Date().getTime();
    spawnFactor = 1;
    gameArea.start();
};


let endGame = () => {
    let score = new Date().getTime() - startTime;
    
    // Reset game state
    gameOver = true;
    clearInterval(enemiesSpawnInterval);
    clearInterval(gameArea.interval);

    // Check current score and best score
    if (bestScore == undefined)
        bestScore = loadBestScore();
    if (bestScore == undefined || score > bestScore) {
        bestScore = score;
        setBestScore(score);
    }

    showEndGameDialog(score);
};


let update = () => {
    // Check collisions
    if (!mainMenu)
        for (enemy of enemies) {
            if (player.checkCollision(enemy)) {
                endGame();
                break;
            }
        }
    
    // Update new game frame only if game is still running
    if (!gameOver) {
        // Clear the previous frame
        gameArea.clear();

        // Calculate new component positions
        if (!mainMenu) 
            player.newPos();
        for (enemy of enemies) 
            enemy.newPos();

        // Update component visuals at the newly calculated positions
        if (!mainMenu)
            player.update();
        for (enemy of enemies) 
            enemy.update();
    }
};


showMainMenuDialog();