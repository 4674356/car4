if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}


// DOM要素の取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreEl = document.getElementById('finalScore');

// キャンバスのサイズ設定
let canvasWidth, canvasHeight;
function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// ゲームの状態
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameRunning = false;
let animationFrameId;

// プレイヤーの車
const player = {
    width: canvasWidth / 8,
    height: (canvasWidth / 8) * 1.8,
    x: canvasWidth / 2 - (canvasWidth / 8) / 2,
    y: canvasHeight - ((canvasWidth / 8) * 1.8) - 20,
    speed: 7,
    dx: 0
};

// 障害物の車
let obstacles = [];
const obstacleWidth = canvasWidth / 8;
const obstacleHeight = (canvasWidth / 8) * 1.8;
let obstacleSpeed = 4;
let obstacleSpawnTimer = 0;

// ハイスコア表示更新
highScoreEl.textContent = `ハイスコア: ${highScore}`;

// 描画関数
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawPlayer() {
    drawRect(player.x, player.y, player.width, player.height, '#007bff');
    // ヘッドライト
    drawRect(player.x + player.width * 0.15, player.y, player.width * 0.2, player.height * 0.1, '#ffdd00');
    drawRect(player.x + player.width * 0.65, player.y, player.width * 0.2, player.height * 0.1, '#ffdd00');
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        drawRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, '#dc3545');
    });
}

// 道路の描画
const roadLines = [];
const roadLineWidth = 10;
const roadLineHeight = 40;
const roadLineGap = 40;
let roadSpeed = 5;

function initRoadLines() {
    for (let i = 0; i < Math.ceil(canvasHeight / (roadLineHeight + roadLineGap)) + 1; i++) {
        roadLines.push({
            x: canvasWidth / 2 - roadLineWidth / 2,
            y: i * (roadLineHeight + roadLineGap)
        });
    }
}

function drawRoad() {
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    roadLines.forEach(line => {
        drawRect(line.x, line.y, roadLineWidth, roadLineHeight, 'rgba(255, 255, 255, 0.5)');
        line.y += roadSpeed;
        if (line.y > canvasHeight) {
            line.y = -roadLineHeight;
        }
    });
}


// ゲームの更新
function update() {
    if (!gameRunning) return;

    // プレイヤーの移動
    player.x += player.dx;

    // 壁との衝突判定
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvasWidth) {
        player.x = canvasWidth - player.width;
    }

    // 障害物の生成
    obstacleSpawnTimer++;
    if (obstacleSpawnTimer > 60) { // 約1秒ごとに生成
        const lane = Math.floor(Math.random() * 4); // 4レーンを想定
        const laneWidth = canvasWidth / 4;
        obstacles.push({
            x: lane * laneWidth + (laneWidth - obstacleWidth) / 2,
            y: -obstacleHeight,
            width: obstacleWidth,
            height: obstacleHeight
        });
        obstacleSpawnTimer = 0;
    }

    // 障害物の移動と衝突判定
    obstacles.forEach((obstacle, index) => {
        obstacle.y += obstacleSpeed;

        // 画面外に出たら削除
        if (obstacle.y > canvasHeight) {
            obstacles.splice(index, 1);
            score++;
            scoreEl.textContent = `スコア: ${score}`;
            // スピードアップ
            if (score % 10 === 0) {
                obstacleSpeed += 0.5;
                roadSpeed += 0.5;
            }
        }

        // プレイヤーとの衝突判定
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            gameOver();
        }
    });

    // 画面のクリアと再描画
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawRoad();
    drawPlayer();
    drawObstacles();

    animationFrameId = requestAnimationFrame(update);
}

// ゲームオーバー処理
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);

    // ハイスコア更新
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreEl.textContent = `ハイスコア: ${highScore}`;
    }

    finalScoreEl.textContent = `最終スコア: ${score}`;
    gameOverScreen.style.display = 'flex';
}

// ゲーム開始処理
function startGame() {
    // リセット
    score = 0;
    obstacles = [];
    player.x = canvasWidth / 2 - player.width / 2;
    obstacleSpeed = 4;
    roadSpeed = 5;
    scoreEl.textContent = `スコア: 0`;

    gameRunning = true;
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    initRoadLines();
    update();
}

// イベントリスナー
function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
        player.dx = player.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        player.dx = -player.speed;
    }
}

function keyUp(e) {
    if (
        e.key === 'ArrowRight' ||
        e.key === 'Right' ||
        e.key === 'ArrowLeft' ||
        e.key === 'Left'
    ) {
        player.dx = 0;
    }
}

// タッチ操作
function touchMove(e) {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const gameContainerRect = canvas.getBoundingClientRect();
    const targetX = touchX - gameContainerRect.left - player.width / 2;
    
    // プレイヤーが画面外に出ないように制限
    player.x = Math.max(0, Math.min(canvasWidth - player.width, targetX));
}

function touchEnd() {
    // player.dx = 0; // タッチ操作では離したときに停止する必要はない
}


document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
canvas.addEventListener('touchmove', touchMove, { passive: false });
canvas.addEventListener('touchend', touchEnd);

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
