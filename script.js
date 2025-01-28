const board = document.getElementById('board');
const resetButton = document.getElementById('reset-button');
const bombCountDisplay = document.getElementById('bomb-count');
const flagCountDisplay = document.getElementById('flag-count');

let size = 10;
let bombFrequency = 0.15;
let bombs = [];
let flags = 0;
let revealedTiles = 0;
let gameOver = false;

function init() {
    board.innerHTML = '';
    bombs = [];
    flags = 0;
    revealedTiles = 0;
    gameOver = false;
    bombCountDisplay.textContent = Math.floor(size * size * bombFrequency);
    flagCountDisplay.textContent = flags;
    generateBoard();
    placeBombs();
    calculateNumbers();
}

function generateBoard() {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.tile = `${i},${j}`;
            tile.addEventListener('click', handleLeftClick);
            tile.addEventListener('contextmenu', handleRightClick);
            board.appendChild(tile);
        }
    }
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
}

function placeBombs() {
    while (bombs.length < Math.floor(size * size * bombFrequency)) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        if (!bombs.includes(`${x},${y}`)) {
            bombs.push(`${x},${y}`);
        }
    }
}

function calculateNumbers() {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (!bombs.includes(`${i},${j}`)) {
                const count = countBombsAround(i, j);
                if (count > 0) {
                    const tile = document.querySelector(`.tile[data-tile="${i},${j}"]`);
                    tile.dataset.number = count;
                }
            }
        }
    }
}

function countBombsAround(x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const nx = x + i;
            const ny = y + j;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && bombs.includes(`${nx},${ny}`)) {
                count++;
            }
        }
    }
    return count;
}

function handleLeftClick(event) {
    if (gameOver) return;
    const tile = event.target;
    const [x, y] = tile.dataset.tile.split(',').map(Number);
    if (tile.classList.contains('flagged')) return;
    if (bombs.includes(`${x},${y}`)) {
        endGame(false);
    } else {
        revealTile(x, y);
        if (revealedTiles === size * size - bombs.length) {
            endGame(true);
        }
    }
}

function revealTile(x, y) {
    const tile = document.querySelector(`.tile[data-tile="${x},${y}"]`);
    if (tile.classList.contains('clicked') || tile.classList.contains('flagged')) return;
    tile.classList.add('clicked');
    revealedTiles++;
    if (tile.dataset.number) {
        tile.textContent = tile.dataset.number;
    } else {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const nx = x + i;
                const ny = y + j;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                    revealTile(nx, ny);
                }
            }
        }
    }
}

function handleRightClick(event) {
    event.preventDefault();
    if (gameOver) return;
    const tile = event.target;
    if (tile.classList.contains('clicked')) return;
    if (tile.classList.contains('flagged')) {
        tile.classList.remove('flagged');
        flags--;
    } else {
        tile.classList.add('flagged');
        flags++;
    }
    flagCountDisplay.textContent = flags;
}

function endGame(won) {
    gameOver = true;
    bombs.forEach(bomb => {
        const [x, y] = bomb.split(',').map(Number);
        const tile = document.querySelector(`.tile[data-tile="${x},${y}"]`);
        tile.classList.add('bomb');
    });
}

resetButton.addEventListener('click', init);

init();
