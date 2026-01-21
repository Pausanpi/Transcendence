import { navigate } from './router.js';
import { getCurrentUser, createRegisteredPlayer, createGuestPlayer, createAIPlayer, startGameSession, endGameSession, getGameSession } from './gameService.js';
let canvas;
let ctx;
let animationId;
let gameOn = false;
let isAI = false;
let difficulty = 3;
// Player info for current game
let player1;
let player2;
const paddle1 = { x: 10, y: 250, w: 10, h: 100 };
const paddle2 = { x: 780, y: 250, w: 10, h: 100 };
const ball = { x: 400, y: 300, r: 10, dx: 5, dy: 5 };
let score1 = 0, score2 = 0;
const keys = {};
export function startPong(ai, diff = 3) {
    // This is called after players are set up
    const session = getGameSession();
    if (!session) {
        console.error('No game session - call setupPongGame first');
        return;
    }
    player1 = session.player1;
    player2 = session.player2;
    isAI = session.isAI;
    difficulty = session.difficulty || diff;
    navigate('game');
    setTimeout(() => {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 600;
        score1 = score2 = 0;
        paddle1.y = paddle2.y = 250;
        resetBall();
        countdown(() => { gameOn = true; loop(); });
    }, 50);
}
/**
 * Setup game with player names, then start
 */
export async function setupPongGame(ai, diff = 3) {
    const currentUser = await getCurrentUser();
    // Create player 1 (always the local user or guest)
    if (currentUser) {
        player1 = createRegisteredPlayer(currentUser);
    }
    else {
        // Will be set from modal
        player1 = createGuestPlayer('Player 1');
    }
    if (ai) {
        // AI game - player 2 is AI
        player2 = createAIPlayer(diff);
        // Start session
        startGameSession({
            player1,
            player2,
            gameType: 'pong',
            isAI: true,
            difficulty: diff,
            startTime: Date.now()
        });
        startPong(true, diff);
    }
    else {
        // PvP - show modal for player names
        showPlayerSetupModal(currentUser);
    }
}
/**
 * Show modal to enter player names for PvP
 */
function showPlayerSetupModal(currentUser, onConfirm) {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    const player1Default = currentUser ? currentUser.display_name || currentUser.username : '';
    const player1Disabled = currentUser ? 'disabled' : '';
    const player1Class = currentUser ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700';
    modal.innerHTML = `
    <div class="card text-center space-y-4 max-w-md mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="players.enterNames">Enter Player Names</h2>
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="players.player1Keys">Player 1 (W/S keys)</label>
        <input
          type="text"
          id="player1Name"
          value="${player1Default}"
          placeholder="Enter name..."
          ${player1Disabled}
          class="w-full p-3 rounded ${player1Class} text-white"
          maxlength="20"
        />
    ${currentUser ? `<p class="text-xs text-green-400 mt-1" data-i18n="players.loggedInAs">✓ Logged in as ${player1Default}</p>` : '<p class="text-xs text-gray-500 mt-1" data-i18n="players.guestPlaying">Playing as guest</p>'}
      </div>
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="players.player2Keys">Player 2 (↑/↓ keys)</label>
        <input
          type="text"
          id="player2Name"
          placeholder="Enter name..."
          class="w-full p-3 rounded bg-gray-700 text-white"
          maxlength="20"
        />
        <div id="player2Status" class="mt-1"></div>
      </div>
      <div class="flex gap-4 mt-6">
        <button onclick="hideModal()" class="btn btn-gray flex-1" data-i18n="common.cancel">Cancel</button>
        <button id="confirmPlayerSetupBtn" class="btn btn-green flex-1" data-i18n="players.startGame">Start Game</button>
      </div>
    </div>
  `;
    // Si hay un callback personalizado, lo usamos
    if (onConfirm) {
        document.getElementById('confirmPlayerSetupBtn').onclick = () => onConfirm();
    }
    else {
        document.getElementById('confirmPlayerSetupBtn').onclick = confirmPlayerSetup;
    }
    // Aplicar traducciones
    if (window.languageManager?.isReady()) {
        window.languageManager.applyTranslations();
    }
    setTimeout(() => {
        const input = currentUser
            ? document.getElementById('player2Name')
            : document.getElementById('player1Name');
        input?.focus();
    }, 100);
}
/**
 * Confirm player names and start PvP game
 */
async function confirmPlayerSetup() {
    const currentUser = await getCurrentUser();
    const p1Input = document.getElementById('player1Name');
    const p2Input = document.getElementById('player2Name');
    const p1Name = p1Input.value.trim() || 'Player 1';
    const p2Name = p2Input.value.trim() || 'Player 2';
    // Validate names are different
    if (p1Name.toLowerCase() === p2Name.toLowerCase()) {
        alert('Players must have different names!');
        return;
    }
    // Create players
    if (currentUser) {
        player1 = createRegisteredPlayer(currentUser);
    }
    else {
        player1 = createGuestPlayer(p1Name);
    }
    player2 = createGuestPlayer(p2Name);
    // Start session
    startGameSession({
        player1,
        player2,
        gameType: 'pong',
        isAI: false,
        startTime: Date.now()
    });
    hideModal();
    startPong(false);
}
function resetBall() {
    ball.x = 400;
    ball.y = 300;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() > 0.5 ? 1 : -1) * 5;
}
function loop() {
    if (!gameOn)
        return;
    update();
    draw();
    animationId = requestAnimationFrame(loop);
}
function update() {
    // Paddles
    if (keys['w'] && paddle1.y > 0)
        paddle1.y -= 5;
    if (keys['s'] && paddle1.y < 500)
        paddle1.y += 5;
    if (isAI) {
        const center = paddle2.y + 50;
        if (center < ball.y - 10)
            paddle2.y += difficulty;
        else if (center > ball.y + 10)
            paddle2.y -= difficulty;
        paddle2.y = Math.max(0, Math.min(500, paddle2.y));
    }
    else {
        if (keys['ArrowUp'] && paddle2.y > 0)
            paddle2.y -= 5;
        if (keys['ArrowDown'] && paddle2.y < 500)
            paddle2.y += 5;
    }
    // Ball
    ball.x += ball.dx;
    ball.y += ball.dy;
    if (ball.y < 10 || ball.y > 590)
        ball.dy = -ball.dy;
    if (ball.x < 20 && ball.y > paddle1.y && ball.y < paddle1.y + 100) {
        ball.dx = Math.abs(ball.dx) * 1.05;
    }
    if (ball.x > 770 && ball.y > paddle2.y && ball.y < paddle2.y + 100) {
        ball.dx = -Math.abs(ball.dx) * 1.05;
    }
    if (ball.x < 0) {
        score2++;
        checkWin();
        resetBall();
    }
    if (ball.x > 800) {
        score1++;
        checkWin();
        resetBall();
    }
}
function checkWin() {
    if (score1 >= 5 || score2 >= 5) {
        gameOn = false;
        const winner = score1 >= 5 ? player1 : player2;
        // Save match to database
        endGameSession(score1, score2).then(result => {
            if (result.success) {
                console.log('Match saved with ID:', result.matchId);
            }
            else {
                console.warn('Failed to save match - may be offline or API error');
            }
        });
        showWinner(winner.name);
    }
}
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#fff';
    ctx.fillRect(paddle1.x, paddle1.y, 10, 100);
    ctx.fillRect(paddle2.x, paddle2.y, 10, 100);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
    ctx.fill();
    // Scores
    ctx.font = '48px monospace';
    ctx.fillText(score1.toString(), 200, 60);
    ctx.fillText(score2.toString(), 580, 60);
    // Player names
    ctx.font = '16px monospace';
    ctx.fillStyle = '#888';
    const p1Name = player1?.name || 'Player 1';
    const p2Name = player2?.name || 'Player 2';
    ctx.fillText(p1Name, 200 - ctx.measureText(p1Name).width / 2, 85);
    ctx.fillText(p2Name, 580 - ctx.measureText(p2Name).width / 2, 85);
}
function countdown(cb) {
    const el = document.getElementById('countdown');
    const txt = document.getElementById('countdownText');
    el.classList.remove('hidden');
    let n = 3;
    txt.textContent = n.toString();
    const i = setInterval(() => {
        n--;
        if (n > 0)
            txt.textContent = n.toString();
        else if (n === 0)
            txt.textContent = 'GO!';
        else {
            clearInterval(i);
            el.classList.add('hidden');
            cb();
        }
    }, 1000);
}
function showWinner(winner) {
    const el = document.getElementById('countdown');
    const txt = document.getElementById('countdownText');
    el.classList.remove('hidden');
    txt.textContent = `🎉 ${winner} Wins!`;
    txt.className = 'text-5xl font-bold text-yellow-300';
    setTimeout(() => {
        el.classList.add('hidden');
        txt.className = 'text-9xl font-extrabold text-yellow-300';
        navigate('games');
    }, 3000);
}
function showDifficulty() {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    modal.innerHTML = `
    <div class="card text-center space-y-4">
      <h2 class="text-2xl font-bold text-yellow-400">Difficulty</h2>
      <button onclick="setupAIGame(2)" class="btn btn-green w-full">Easy</button>
      <button onclick="setupAIGame(3)" class="btn btn-yellow w-full">Medium</button>
      <button onclick="setupAIGame(4)" class="btn btn-red w-full">Hard</button>
      <button onclick="hideModal()" class="btn btn-gray w-full">Cancel</button>
    </div>
  `;
}
async function setupAIGame(diff) {
    hideModal();
    await setupPongGame(true, diff);
}
function hideModal() {
    document.getElementById('modal').classList.add('hidden');
}
// Keyboard
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
// Global
window.startPong = startPong;
window.setupPongGame = setupPongGame;
window.setupAIGame = setupAIGame;
window.showDifficulty = showDifficulty;
window.hideModal = hideModal;
window.confirmPlayerSetup = confirmPlayerSetup;
