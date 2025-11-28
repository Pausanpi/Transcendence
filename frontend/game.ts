interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Ball {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface Keys {
  [key: string]: boolean;
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const menu = document.getElementById('menu') as HTMLElement;
const btnPlayer = document.getElementById('btnPlayer') as HTMLButtonElement;
const btnIA = document.getElementById('btnIA') as HTMLButtonElement;
const countdownEl = document.getElementById('countdown') as HTMLElement;
const countdownText = document.getElementById('countdownText') as HTMLElement;
const gameContainer = document.getElementById('gameContainer') as HTMLElement;
const difficultyModal = document.getElementById('difficultyModal') as HTMLElement;
const btnEasy = document.getElementById('btnEasy') as HTMLButtonElement;
const btnMedium = document.getElementById('btnMedium') as HTMLButtonElement;
const btnHard = document.getElementById('btnHard') as HTMLButtonElement;
const btnCancelDifficulty = document.getElementById('btnCancelDifficulty') as HTMLButtonElement;

let isAIMode: boolean = false;
let aiDifficulty: Difficulty = 'medium';
let gameStarted: boolean = false;
const WINNING_SCORE: number = 5;
let score1: number = 0;
let score2: number = 0;

const paddle1: Paddle = { x: 10, y: canvas.height / 2 - 50, width: 10, height: 100, speed: 5 };
const paddle2: Paddle = { x: canvas.width - 20, y: canvas.height / 2 - 50, width: 10, height: 100, speed: 5 };
const ball: Ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, speedX: 5, speedY: 5 };

btnPlayer.addEventListener('click', () => startGame(false));
btnIA.addEventListener('click', showDifficultyModal);

// Event listeners para el modal de dificultad
btnEasy.addEventListener('click', () => startGameWithDifficulty('easy'));
btnMedium.addEventListener('click', () => startGameWithDifficulty('medium'));
btnHard.addEventListener('click', () => startGameWithDifficulty('hard'));
btnCancelDifficulty.addEventListener('click', hideDifficultyModal);

function showDifficultyModal(): void {
  menu.classList.add('hidden');
  difficultyModal.classList.remove('hidden');
}

function hideDifficultyModal(): void {
  difficultyModal.classList.add('hidden');
  menu.classList.remove('hidden');
}

function startGameWithDifficulty(difficulty: Difficulty): void {
  aiDifficulty = difficulty;
  difficultyModal.classList.add('hidden');
  startGame(true);
}

function startGame(aiMode: boolean): void {
  isAIMode = aiMode;
  // Ajustar tamaño del canvas para Pong
  canvas.width = 800;
  canvas.height = 600;
  hideMenu();
  showCanvas();
  resetGame();
  // Limpiar el canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  startCountdown();
}

function resetGame(): void {
  score1 = 0;
  score2 = 0;
  paddle1.x = 10;
  paddle1.y = canvas.height / 2 - 50;
  paddle2.x = canvas.width - 20;
  paddle2.y = canvas.height / 2 - 50;
  resetBall();
  gameStarted = false;
}

function startCountdown(): void {
  let count: number = 3;
  countdownEl.classList.remove('hidden');
  countdownText.textContent = count.toString();

  const interval = setInterval(() => {
    count--;
    if (count > 0) countdownText.textContent = count.toString();
    else if (count === 0) countdownText.textContent = '¡GO!';
    else {
      clearInterval(interval);
      countdownEl.classList.add('hidden');
      gameStarted = true;
      gameLoop();
    }
  }, 1000);
}

const keys: Keys = {};
window.addEventListener('keydown', (e: KeyboardEvent) => keys[e.key] = true);
window.addEventListener('keyup', (e: KeyboardEvent) => keys[e.key] = false);

function updatePaddles(): void {
  if (keys['w'] && paddle1.y > 0) paddle1.y -= paddle1.speed;
  if (keys['s'] && paddle1.y < canvas.height - paddle1.height) paddle1.y += paddle1.speed;

  if (isAIMode) updateAI();
  else {
    if (keys['ArrowUp'] && paddle2.y > 0) paddle2.y -= paddle2.speed;
    if (keys['ArrowDown'] && paddle2.y < canvas.height - paddle2.height) paddle2.y += paddle2.speed;
  }
}

function predictBallPosition(): number {
  let tempX: number = ball.x;
  let tempY: number = ball.y;
  let tempSpeedX: number = ball.speedX;
  let tempSpeedY: number = ball.speedY;

  if (tempSpeedX <= 0) return paddle2.y + paddle2.height / 2;

  while (tempX < paddle2.x) {
    tempX += tempSpeedX;
    tempY += tempSpeedY;

    if (tempY - ball.radius < 0 || tempY + ball.radius > canvas.height) {
      tempSpeedY = -tempSpeedY;
      if (tempY - ball.radius < 0) tempY = ball.radius;
      else tempY = canvas.height - ball.radius;
    }

    if (tempX > canvas.width * 2) break;
  }

  return tempY;
}

function updateAI(): void {
  const predictedY: number = predictBallPosition();
  const paddleCenter: number = paddle2.y + paddle2.height / 2;
  
  // Configuración según dificultad
  let aiSpeed: number, reactionZone: number, errorMargin: number;
  
  switch(aiDifficulty) {
    case 'easy':
      aiSpeed = paddle2.speed * 0.5;  // Más lento
      reactionZone = 40;  // Zona de reacción más amplia (menos preciso)
      errorMargin = Math.random() * 60 - 30;  // Error aleatorio mayor
      break;
    case 'medium':
      aiSpeed = paddle2.speed * 0.75;
      reactionZone = 20;
      errorMargin = Math.random() * 30 - 15;  // Error aleatorio moderado
      break;
    case 'hard':
      aiSpeed = paddle2.speed * 0.95;  // Muy rápido
      reactionZone = 5;  // Muy preciso
      errorMargin = Math.random() * 10 - 5;  // Error mínimo
      break;
    default:
      aiSpeed = paddle2.speed * 0.75;
      reactionZone = 20;
      errorMargin = 0;
  }
  
  const targetY: number = predictedY + errorMargin;

  if (paddleCenter < targetY - reactionZone) paddle2.y += aiSpeed;
  else if (paddleCenter > targetY + reactionZone) paddle2.y -= aiSpeed;

  if (paddle2.y < 0) paddle2.y = 0;
  if (paddle2.y > canvas.height - paddle2.height) paddle2.y = canvas.height - paddle2.height;
}

function updateBall(): void {
  ball.x += ball.speedX;
  ball.y += ball.speedY;

  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) ball.speedY = -ball.speedY;

  if (
    ball.x - ball.radius < paddle1.x + paddle1.width &&
    ball.y > paddle1.y &&
    ball.y < paddle1.y + paddle1.height
  ) {
    ball.speedX = Math.abs(ball.speedX) * 1.05;
    ball.x = paddle1.x + paddle1.width + ball.radius;
    const hitPos: number = (ball.y - paddle1.y) / paddle1.height - 0.5;
    ball.speedY += hitPos * 2;
  }

  if (
    ball.x + ball.radius > paddle2.x &&
    ball.y > paddle2.y &&
    ball.y < paddle2.y + paddle2.height
  ) {
    ball.speedX = -Math.abs(ball.speedX) * 1.05;
    ball.x = paddle2.x - ball.radius;
    const hitPos: number = (ball.y - paddle2.y) / paddle2.height - 0.5;
    ball.speedY += hitPos * 2;
  }

  if (ball.x < 0) {
    score2++;
    checkWinner();
    resetBall();
  }
  if (ball.x > canvas.width) {
    score1++;
    checkWinner();
    resetBall();
  }
}

function resetBall(): void {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
  ball.speedY = (Math.random() > 0.5 ? 1 : -1) * 5;
}

function checkWinner(): void {
  if (score1 >= WINNING_SCORE) showWinner('Jugador 1');
  else if (score2 >= WINNING_SCORE) showWinner(isAIMode ? 'IA' : 'Jugador 2');
}

function showWinner(winner: string): void {
  gameStarted = false;
  hideCanvas();
  countdownEl.classList.remove('hidden');
  countdownText.innerHTML = `🎉 ${winner} GANA 🎉`;
  countdownText.className = 'text-5xl';

  setTimeout(() => {
    countdownEl.classList.add('hidden');
    menu.classList.remove('hidden');
  }, 3001);
}

function draw(): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fff';
  ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
  ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();

  ctx.strokeStyle = '#fff';
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = '48px Courier New';
  ctx.fillText(score1.toString(), canvas.width / 4, 60);
  ctx.fillText(score2.toString(), 3 * canvas.width / 4, 60);

  ctx.font = '20px Courier New';
  ctx.fillStyle = '#666';
  ctx.fillText(`Primera a ${WINNING_SCORE}`, canvas.width / 2 - 80, canvas.height - 20);
}

function gameLoop(): void {
  if (!gameStarted) return;
  updatePaddles();
  updateBall();
  draw();
  requestAnimationFrame(gameLoop);
}
