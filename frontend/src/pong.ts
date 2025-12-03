import { navigate } from './router.js';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let animationId: number;
let gameOn = false;
let isAI = false;
let difficulty = 3;

const paddle1 = { x: 10, y: 250, w: 10, h: 100 };
const paddle2 = { x: 780, y: 250, w: 10, h: 100 };
const ball = { x: 400, y: 300, r: 10, dx: 5, dy: 5 };
let score1 = 0, score2 = 0;
const keys: Record<string, boolean> = {};

export function startPong(ai: boolean, diff = 3): void {
  isAI = ai;
  difficulty = diff;
  navigate('game');
  
  setTimeout(() => {
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 600;
    
    score1 = score2 = 0;
    paddle1.y = paddle2.y = 250;
    resetBall();
    countdown(() => { gameOn = true; loop(); });
  }, 50);
}

function resetBall(): void {
  ball.x = 400; ball.y = 300;
  ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
  ball.dy = (Math.random() > 0.5 ? 1 : -1) * 5;
}

function loop(): void {
  if (!gameOn) return;
  update();
  draw();
  animationId = requestAnimationFrame(loop);
}

function update(): void {
  // Paddles
  if (keys['w'] && paddle1.y > 0) paddle1.y -= 5;
  if (keys['s'] && paddle1.y < 500) paddle1.y += 5;
  
  if (isAI) {
    const center = paddle2.y + 50;
    if (center < ball.y - 10) paddle2.y += difficulty;
    else if (center > ball.y + 10) paddle2.y -= difficulty;
    paddle2.y = Math.max(0, Math.min(500, paddle2.y));
  } else {
    if (keys['ArrowUp'] && paddle2.y > 0) paddle2.y -= 5;
    if (keys['ArrowDown'] && paddle2.y < 500) paddle2.y += 5;
  }
  
  // Ball
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  if (ball.y < 10 || ball.y > 590) ball.dy = -ball.dy;
  
  if (ball.x < 20 && ball.y > paddle1.y && ball.y < paddle1.y + 100) {
    ball.dx = Math.abs(ball.dx) * 1.05;
  }
  if (ball.x > 770 && ball.y > paddle2.y && ball.y < paddle2.y + 100) {
    ball.dx = -Math.abs(ball.dx) * 1.05;
  }
  
  if (ball.x < 0) { score2++; checkWin(); resetBall(); }
  if (ball.x > 800) { score1++; checkWin(); resetBall(); }
}

function checkWin(): void {
  if (score1 >= 5 || score2 >= 5) {
    gameOn = false;
    const winner = score1 >= 5 ? 'Player 1' : (isAI ? 'AI' : 'Player 2');
    showWinner(winner);
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
  
  ctx.font = '48px monospace';
  ctx.fillText(score1.toString(), 200, 60);
  ctx.fillText(score2.toString(), 580, 60);
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

function showWinner(winner: string): void {
  const el = document.getElementById('countdown')!;
  const txt = document.getElementById('countdownText')!;
  el.classList.remove('hidden');
  txt.textContent = `🎉 ${winner} Wins!`;
  txt.className = 'text-5xl font-bold text-yellow-300';
  
  setTimeout(() => {
    el.classList.add('hidden');
    txt.className = 'text-9xl font-extrabold text-yellow-300';
    navigate('games');
  }, 3000);
}

function showDifficulty(): void {
  const modal = document.getElementById('modal')!;
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="card text-center space-y-4">
      <h2 class="text-2xl font-bold text-yellow-400">Difficulty</h2>
      <button onclick="startPong(true,2)" class="btn btn-green w-full">Easy</button>
      <button onclick="startPong(true,3)" class="btn btn-yellow w-full">Medium</button>
      <button onclick="startPong(true,4)" class="btn btn-red w-full">Hard</button>
      <button onclick="hideModal()" class="btn btn-gray w-full">Cancel</button>
    </div>
  `;
}

function hideModal(): void {
  document.getElementById('modal')!.classList.add('hidden');
}

// Keyboard
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Global
(window as any).startPong = startPong;
(window as any).showDifficulty = showDifficulty;
(window as any).hideModal = hideModal;