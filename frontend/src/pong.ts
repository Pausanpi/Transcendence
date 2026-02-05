import { navigate } from './router.js';
import {
  type Player
} from './gameService.js';

// Game end callback for external handling
let onGameEndCallback: ((result: MatchResult) => void) | null = null;

export function setOnGameEnd(callback: (result: MatchResult) => void): void {
  onGameEndCallback = callback;
}

interface MatchResult {
  player1: Player;
  player2: Player;
  player1Score: number;
  player2Score: number;
  winner: Player;
}

interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
  dy: number;
}

interface Ball {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let animationId: number;
let gameOn = false;
let isAI = false;
let difficulty = 3;

// Player info for current game
let player1: Player;
let player2: Player;

const paddle1: Paddle = { x: 10, y: 250, w: 10, h: 100, dy: 0 };
const paddle2: Paddle = { x: 780, y: 250, w: 10, h: 100, dy: 0 };
const ball: Ball = { x: 400, y: 300, r: 10, dx: 5, dy: 5 };
let score1 = 0, score2 = 0;
const keys: Record<string, boolean> = {};

// Game constants
const INITIAL_BALL_SPEED = 5;
const MAX_BALL_SPEED = 15;
const SPEED_INCREMENT = 0.05;
const PADDLE_SPEED = 5;
const COLLISION_MARGIN = 6;
const IMPACT_ANGLE_FACTOR = 8;

// AI state variables - decision with prediction
let aiLastUpdate = 0;
let aiDecision: 'up' | 'down' | '' = '';
let aiTargetY: number = 250;

export function initPongGame(config: {
  player1: Player;
  player2: Player;
  isAI: boolean;
  difficulty?: number;
}): void {
  player1 = config.player1;
  player2 = config.player2;
  isAI = config.isAI;
  difficulty = config.difficulty || 3;

  navigate('game');

  setTimeout(() => {
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 600;

    // Reset game state
    gameOn = false;
    score1 = score2 = 0;
    paddle1.y = paddle2.y = 250;
    paddle1.dy = paddle2.dy = 0;
    resetBall();
    
    // Reset AI state
    aiLastUpdate = 0;
    aiDecision = '';
    aiTargetY = 250;
    Object.keys(keys).forEach(key => keys[key] = false);
    
    // Show exit button
    const exitContainer = document.getElementById('exitGameContainer');
    if (exitContainer) exitContainer.classList.remove('hidden');
    
    countdown(() => { gameOn = true; loop(); });
  }, 50);
}







function resetBall(): void {
  ball.x = 400;
  ball.y = 300;
  ball.dx = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED;
  ball.dy = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED;
  
  // Update AI target on ball reset
  if (isAI) {
    updateAITarget();
  }
}

/**
 * Predice dónde estará la bola cuando llegue al paddle de la IA
 * Considera rebotes en paredes superior e inferior con simulación física
 */
function predictBallYAtPaddle(ballState: Ball, paddleX: number): number {
  // Copiar estado para no modificar el original
  let x = ballState.x;
  let y = ballState.y;
  let dx = ballState.dx;
  let dy = ballState.dy;

  // Si la bola no se dirige hacia la IA, retornar posición actual
  if (dx <= 0) return y;

  // Simular el movimiento de la bola hasta que alcance la posición X del paddle
  while (x < paddleX - ballState.r) {
    x += dx;
    y += dy;

    // Simular rebotes en paredes superior e inferior
    if (y - ballState.r < 0) {
      y = ballState.r;
      dy = -dy;
    } else if (y + ballState.r > canvas.height) {
      y = canvas.height - ballState.r;
      dy = -dy;
    }
  }
  
  return y;
}

/**
 * Actualiza el objetivo de la IA con predicción mejorada y margen de error
 */
function updateAITarget(): void {
  const predictedY = predictBallYAtPaddle(ball, paddle2.x);
  
  // Agregar margen de error aleatorio basado en la dificultad
  const errorMargin = difficulty === 2 ? 60 : difficulty === 3 ? 40 : 20;
  const randomOffset = (Math.random() - 0.5) * errorMargin;
  
  aiTargetY = predictedY - paddle2.h / 2 + randomOffset;
  
  // Mantener dentro de los límites
  if (aiTargetY < 0) aiTargetY = 0;
  if (aiTargetY > canvas.height - paddle2.h) {
    aiTargetY = canvas.height - paddle2.h;
  }
}

function loop(): void {
  if (!gameOn) return;
  update();
  draw();
  animationId = requestAnimationFrame(loop);
}

function update(): void {
  // Player 1 paddle (W/S keys)
  paddle1.dy = 0;
  if (keys['w'] && paddle1.y > 0) paddle1.dy = -PADDLE_SPEED;
  if (keys['s'] && paddle1.y < canvas.height - paddle1.h) paddle1.dy = PADDLE_SPEED;
  paddle1.y += paddle1.dy;
  
  // Clamp paddle1 position
  if (paddle1.y < 0) paddle1.y = 0;
  if (paddle1.y > canvas.height - paddle1.h) paddle1.y = canvas.height - paddle1.h;

  // Player 2 / AI paddle
  if (isAI) {
    // AI decision update - ONLY ONCE PER SECOND (requirement)
    const now = Date.now();
    if (now - aiLastUpdate >= 1000) {
      aiLastUpdate = now;
      updateAITarget();
      
      // Calculate AI decision based on prediction
      const paddleCenter = paddle2.y + paddle2.h / 2;
      const threshold = 10; // Small margin to avoid oscillation
      
      if (paddleCenter < aiTargetY - threshold) {
        aiDecision = 'down';
      } else if (paddleCenter > aiTargetY + threshold) {
        aiDecision = 'up';
      } else {
        aiDecision = ''; // Centered, don't move
      }
    }
    
    // Simulate keyboard input (replicate human behavior - requirement)
    keys['ArrowUp'] = aiDecision === 'up';
    keys['ArrowDown'] = aiDecision === 'down';
  }
  
  // Apply arrow key movement for paddle2 (both AI and human use same logic)
  paddle2.dy = 0;
  if (keys['ArrowUp'] && paddle2.y > 0) paddle2.dy = -PADDLE_SPEED;
  if (keys['ArrowDown'] && paddle2.y < canvas.height - paddle2.h) paddle2.dy = PADDLE_SPEED;
  paddle2.y += paddle2.dy;
  
  // Clamp paddle2 position
  if (paddle2.y < 0) paddle2.y = 0;
  if (paddle2.y > canvas.height - paddle2.h) paddle2.y = canvas.height - paddle2.h;

  // Progressive ball speed increase
  if (Math.abs(ball.dx) < MAX_BALL_SPEED) {
    ball.dx += ball.dx > 0 ? SPEED_INCREMENT : -SPEED_INCREMENT;
  }

  // Ball movement
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall collision (top and bottom)
  if (ball.y - ball.r < 0 || ball.y + ball.r > canvas.height) {
    ball.dy = -ball.dy;
    // Correct position to prevent ball from getting stuck
    if (ball.y - ball.r < 0) ball.y = ball.r;
    if (ball.y + ball.r > canvas.height) ball.y = canvas.height - ball.r;
  }

  // Paddle collision detection with improved physics
  // Left paddle (Player 1)
  if (ball.x - ball.r < paddle1.x + paddle1.w + COLLISION_MARGIN &&
      ball.x - ball.r > paddle1.x - COLLISION_MARGIN &&
      ball.y > paddle1.y - COLLISION_MARGIN && 
      ball.y < paddle1.y + paddle1.h + COLLISION_MARGIN) {
    ball.dx = Math.abs(ball.dx); // Ensure ball goes right
    
    // Calculate impact position (0 to 1) for angle variation
    const impactPosition = (ball.y - paddle1.y) / paddle1.h;
    ball.dy = IMPACT_ANGLE_FACTOR * (impactPosition - 0.5);
    
    // Correct position to prevent ball from getting stuck
    ball.x = paddle1.x + paddle1.w + ball.r;
    
    // Update AI target on paddle hit
    if (isAI) updateAITarget();
  }
  
  // Right paddle (Player 2 / AI)
  if (ball.x + ball.r > paddle2.x - COLLISION_MARGIN &&
      ball.x + ball.r < paddle2.x + paddle2.w + COLLISION_MARGIN &&
      ball.y > paddle2.y - COLLISION_MARGIN && 
      ball.y < paddle2.y + paddle2.h + COLLISION_MARGIN) {
    ball.dx = -Math.abs(ball.dx); // Ensure ball goes left
    
    // Calculate impact position (0 to 1) for angle variation
    const impactPosition = (ball.y - paddle2.y) / paddle2.h;
    ball.dy = IMPACT_ANGLE_FACTOR * (impactPosition - 0.5);
    
    // Correct position to prevent ball from getting stuck
    ball.x = paddle2.x - ball.r;
  }

  if (ball.x < 0) { score2++; checkWin(); resetBall(); }
  if (ball.x > 800) { score1++; checkWin(); resetBall(); }
}

function checkWin(): void {
  if (score1 >= 5 || score2 >= 5) {
    gameOn = false;
    const winner = score1 >= 5 ? player1 : player2;

    // Create match result
    const result: MatchResult = {
      player1,
      player2,
      player1Score: score1,
      player2Score: score2,
      winner
    };

    // Call external callback if set
    if (onGameEndCallback) {
      onGameEndCallback(result);
    } else {
      // Fallback to old behavior
      showWinner(winner.name);
    }
  }
}

function draw(): void {
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

function countdown(cb: () => void): void {
  const el = document.getElementById('countdown')!;
  const txt = document.getElementById('countdownText')!;
  el.classList.remove('hidden');

  let n = 3;
  txt.textContent = n.toString();

  const i = setInterval(() => {
    n--;
    if (n > 0) txt.textContent = n.toString();
    else if (n === 0) txt.textContent = 'GO!';
    else { clearInterval(i); el.classList.add('hidden'); cb(); }
  }, 1000);
}

export function showWinnerOverlay(winnerName: string, onContinue: () => void): void {
  const el = document.getElementById('countdown')!;
  const txt = document.getElementById('countdownText')!;
  el.classList.remove('hidden');
  txt.textContent = `🎉 ${winnerName} Wins!`;
  txt.className = 'text-5xl font-bold text-yellow-300';

  // Hide exit button when game ends
  const exitContainer = document.getElementById('exitGameContainer');
  if (exitContainer) exitContainer.classList.add('hidden');

  setTimeout(() => {
    el.classList.add('hidden');
    txt.className = 'text-9xl font-extrabold text-yellow-300';
    onContinue();
  }, 3000);
}

export function stopPongGame(): void {
  gameOn = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  // Reset game state
  Object.keys(keys).forEach(key => keys[key] = false);
  
  // Reset AI state
  aiLastUpdate = 0;
  aiDecision = '';
  aiTargetY = 250;
  
  // Reset ball and paddles
  ball.x = 400;
  ball.y = 300;
  ball.dx = INITIAL_BALL_SPEED;
  ball.dy = INITIAL_BALL_SPEED;
  paddle1.y = paddle2.y = 250;
  paddle1.dy = paddle2.dy = 0;
  score1 = score2 = 0;
  
  // Hide exit button
  const exitContainer = document.getElementById('exitGameContainer');
  if (exitContainer) exitContainer.classList.add('hidden');
}

function showWinner(winner: string): void {
  const el = document.getElementById('countdown')!;
  const txt = document.getElementById('countdownText')!;
  el.classList.remove('hidden');
  txt.textContent = `🎉 ${winner} Wins!`;
  txt.className = 'text-5xl font-bold text-yellow-300';

  // Hide exit button when game ends
  const exitContainer = document.getElementById('exitGameContainer');
  if (exitContainer) exitContainer.classList.add('hidden');

  setTimeout(() => {
    el.classList.add('hidden');
    txt.className = 'text-9xl font-extrabold text-yellow-300';
    navigate('games');
  }, 3000);
}

/**
 * Exit game without finishing
 * Stops the game loop and resets state
 */
export function exitGame(): void {
  // Use the stopPongGame function
  stopPongGame();
  
  // Navigate back to games page
  navigate('games');
}



// Keyboard
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Global exports (only keep what's still needed)
(window as any).exitGame = exitGame;
