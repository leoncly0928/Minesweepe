const board = document.getElementById('board');
const resetButton = document.getElementById('reset-button');
const bombCountDisplay = document.getElementById('bomb-count');
const flagCountDisplay = document.getElementById('flag-count');
const difficultySelect = document.getElementById('difficulty');
const overlay = document.getElementById('overlay');
const gameResult = document.getElementById('game-result');
const confirmButton = document.getElementById('confirm-button');
const timeDisplay = document.getElementById('time'); // 新增时间显示元素
const recordButton = document.getElementById('record-button'); // 新增游戏记录按钮
const recordOverlay = document.getElementById('record-overlay'); // 新增游戏记录弹窗
const recordList = document.getElementById('record-list'); // 新增游戏记录列表
const closeRecordButton = document.getElementById('close-record-button'); // 新增关闭游戏记录按钮

// 添加音频元素
const winAudio = new Audio('music/win.mp3');
const loseAudio = new Audio('music/lose.mp3');

let size = 5; // 默认简单模式
let bombFrequency = 0.15;
let bombs = [];
let flags = 0;
let revealedTiles = 0;
let gameOver = false;
let startTime = 0; // 新增开始时间变量
let gameTimesWithDifficulty = JSON.parse(localStorage.getItem('gameTimesWithDifficulty')) || []; // 从localStorage加载游戏时间记录和难度

function init() {
    board.innerHTML = '';
    bombs = [];
    flags = 0;
    revealedTiles = 0;
    gameOver = false;
    size = difficultySelect.value === 'easy' ? 5 : 10; // 根据难度选择调整大小
    bombCountDisplay.textContent = Math.floor(size * size * bombFrequency);
    flagCountDisplay.textContent = flags;
    generateBoard();
    placeBombs();
    calculateNumbers();
    overlay.style.display = 'none'; // 确保覆盖层在游戏开始时隐藏
    recordOverlay.style.display = 'none'; // 确保游戏记录弹窗在游戏开始时隐藏
    startTime = Date.now(); // 记录开始时间
    timeDisplay.textContent = 0; // 重置时间显示
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
    gameResult.textContent = won ? '恭喜你，你赢了！' : '很遗憾，你输了！';
    overlay.style.display = 'flex';

    // 计算游戏时间
    const endTime = Date.now();
    const elapsedTime = Math.floor((endTime - startTime) / 1000);
    timeDisplay.textContent = elapsedTime;

    // 播放音频
    if (won) {
        winAudio.play();
        setTimeout(() => winAudio.pause(), 2000);
        gameTimesWithDifficulty.push({ difficulty: difficultySelect.value, time: elapsedTime });
        gameTimesWithDifficulty.sort((a, b) => a.time - b.time);
        if (gameTimesWithDifficulty.length > 10) {
            gameTimesWithDifficulty.pop();
        }
        localStorage.setItem('gameTimesWithDifficulty', JSON.stringify(gameTimesWithDifficulty));
    } else {
        loseAudio.play();
        setTimeout(() => loseAudio.pause(), 2000);
    }

    // 确保在游戏失败时，点击确认按钮后，重新开始游戏时保持原来的难度
    confirmButton.addEventListener('click', () => {
        init();
    });
}

function updateTimer() {
    if (!gameOver) {
        const currentTime = Date.now();
        const elapsedTime = Math.floor((currentTime - startTime) / 1000);
        timeDisplay.textContent = elapsedTime;
        setTimeout(updateTimer, 1000);
    }
}

function showRecord() {
    recordList.innerHTML = '';
    const difficultyMap = { easy: '简单', hard: '困难' }; // 新增难度映射对象
    gameTimesWithDifficulty.slice(0, 10).forEach((record, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${difficultyMap[record.difficulty]} - ${record.time} 秒`; // 使用映射对象转换难度
        recordList.appendChild(li);
    });
    recordOverlay.style.display = 'flex';
}

function closeRecord() {
    recordOverlay.style.display = 'none';
}

confirmButton.addEventListener('click', init);
resetButton.addEventListener('click', init);
difficultySelect.addEventListener('change', init);
recordButton.addEventListener('click', showRecord);
closeRecordButton.addEventListener('click', closeRecord);

init();
updateTimer(); // 启动计时器