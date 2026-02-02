import { type Player } from './gameService.js';

// ===== GAME STATE =====

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let animationId: number;
let gameOn = false;

// Game objects
const paddle1 = { x: 10, y: 250, w: 10, h: 100 };
const paddle2 = { x: 780, y: 250, w: 10, h: 100 };
const ball = { x: 400, y: 300, r: 10, dx: 5, dy: 5 };
let score1 = 0;
let score2 = 0;

// Player info
let player1: Player;
let player2: Player;
let isAI = false;
let difficulty = 3;

// Input
const keys: Record<string, boolean> = {};

// ===== GAME CALLBACKS =====

// Callback for when the game ends
let onGameEndCallback: ((result: {
  player1: Player;
  player2: Player;
  player1Score: number;
  player2Score: number;
  winner: Player;
}) => void) | null = null;

export function setOnGameEnd(callback: typeof onGameEndCallback): void {
  onGameEndCallback = callback;
}

// ===== GAME INITIALIZATION =====

export interface PongConfig {
  player1: Player;
  player2: Player;
  isAI: boolean;
  difficulty?: number;
}

export function initPongGame(config: PongConfig): void {
  player1 = config.player1;
  player2 = config.player2;
  isAI = config.isAI;
  difficulty = config.difficulty || 3;

  // Wait for DOM to be ready
  setTimeout(() => {
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 600;

    // Reset game state
    score1 = 0;
    score2 = 0;
    paddle1.y = 250;
    paddle2.y = 250;
    resetBall();

    // Start countdown
    countdown(() => {
      gameOn = true;
      loop();
    });
  }, 50);
}

export function stopPongGame(): void {
  gameOn = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
}

// ===== GAME LOOP =====

function loop(): void {
  if (!gameOn) return;
  update();
  draw();
  animationId = requestAnimationFrame(loop);
}

function update(): void {
  // Player 1 controls (W/S)
  if (keys['w'] && paddle1.y > 0) paddle1.y -= 5;
  if (keys['s'] && paddle1.y < 500) paddle1.y += 5;

  // Player 2 controls (AI or Arrow keys)
  if (isAI) {
    const center = paddle2.y + 50;
    if (center < ball.y - 10) paddle2.y += difficulty;
    else if (center > ball.y + 10) paddle2.y -= difficulty;
    paddle2.y = Math.max(0, Math.min(500, paddle2.y));
  } else {
    if (keys['ArrowUp'] && paddle2.y > 0) paddle2.y -= 5;
    if (keys['ArrowDown'] && paddle2.y < 500) paddle2.y += 5;
  }

  // Ball physics
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall collisions
  if (ball.y < 10 || ball.y > 590) {
    ball.dy = -ball.dy;
  }

  // Paddle collisions
  if (ball.x < 20 && ball.y > paddle1.y && ball.y < paddle1.y + 100) {
    ball.dx = Math.abs(ball.dx) * 1.05;
  }
  if (ball.x > 770 && ball.y > paddle2.y && ball.y < paddle2.y + 100) {
    ball.dx = -Math.abs(ball.dx) * 1.05;
  }

  // Scoring
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

function checkWin(): void {
  if (score1 >= 5 || score2 >= 5) {
    gameOn = false;
    const winner = score1 >= 5 ? player1 : player2;
    
    // Call the callback if set
    if (onGameEndCallback) {
      onGameEndCallback({
        player1,
        player2,
        player1Score: score1,
        player2Score: score2,
        winner
      });
    }
  }
}

function resetBall(): void {
  ball.x = 400;
  ball.y = 300;
  ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
  ball.dy = (Math.random() > 0.5 ? 1 : -1) * 5;
}

// ===== RENDERING =====

function draw(): void {
  // Background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 800, 600);

  // Paddles
  ctx.fillStyle = '#fff';
  ctx.fillRect(paddle1.x, paddle1.y, 10, 100);
  ctx.fillRect(paddle2.x, paddle2.y, 10, 100);

  // Ball
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

// ===== UI HELPERS =====

function countdown(cb: () => void): void {
  const el = document.getElementById('countdown');
  const txt = document.getElementById('countdownText');
  
  if (!el || !txt) {
    cb(); // Start immediately if elements not found
    return;
  }

  el.classList.remove('hidden');

  let n = 3;
  txt.textContent = n.toString();

  const interval = setInterval(() => {
    n--;
    if (n > 0) {
      txt.textContent = n.toString();
    } else if (n === 0) {
      txt.textContent = 'GO!';
    } else {
      clearInterval(interval);
      el.classList.add('hidden');
      cb();
    }
  }, 1000);
}

export function showWinnerOverlay(winnerName: string, onComplete: () => void): void {
  const el = document.getElementById('countdown');
  const txt = document.getElementById('countdownText');
  
  if (!el || !txt) {
    onComplete();
    return;
  }

  el.classList.remove('hidden');
  txt.textContent = `🎉 ${winnerName} Wins!`;
  txt.className = 'text-5xl font-bold text-yellow-300';

  setTimeout(() => {
    el.classList.add('hidden');
    txt.className = 'text-9xl font-extrabold text-yellow-300';
    onComplete();
  }, 3000);
}

// ===== INPUT HANDLING =====

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
