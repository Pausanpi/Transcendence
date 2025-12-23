import { navigate } from './router.js';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let animationId: number;
let gameOn = false;
let isAI = false;
let difficulty = 3;
let numPlayers = 2;

const paddle1 = { x: 10, y: 250, w: 10, h: 100 }; // Izquierda
const paddle2 = { x: 780, y: 250, w: 10, h: 100 }; // Derecha
const paddle3 = { x: 350, y: 10, w: 100, h: 10 }; // Arriba
const paddle4 = { x: 350, y: 580, w: 100, h: 10 }; // Abajo
const ball = { x: 400, y: 300, r: 10, dx: 5, dy: 5 };
let score1 = 0, score2 = 0, score3 = 0, score4 = 0;
const keys: Record<string, boolean> = {};

export function startPong(ai: boolean, diff = 3): void {
  isAI = ai;
  difficulty = diff;
  
  if (!ai) {
    // Modo multijugador: preguntar n�mero de jugadores
    showPlayerSelection();
  } else {
    // Modo vs IA: siempre 2 jugadores
    numPlayers = 2;
    initGame();
  }
}

function initGame(): void {
  hideModal();
  navigate('game');
  
  setTimeout(() => {
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 600;
    
    score1 = score2 = score3 = score4 = 0;
    paddle1.y = paddle2.y = 250;
    paddle3.x = paddle4.x = 350;
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
  // Paddle 1 (Izquierda) - W/S
  if (keys['w'] && paddle1.y > 0) paddle1.y -= 5;
  if (keys['s'] && paddle1.y < 500) paddle1.y += 5;
  
  // Paddle 2 (Derecha) - Flechas o IA
  if (isAI) {
    const center = paddle2.y + 50;
    if (center < ball.y - 10) paddle2.y += difficulty;
    else if (center > ball.y + 10) paddle2.y -= difficulty;
    paddle2.y = Math.max(0, Math.min(500, paddle2.y));
  } else {
    if (keys['ArrowUp'] && paddle2.y > 0) paddle2.y -= 5;
    if (keys['ArrowDown'] && paddle2.y < 500) paddle2.y += 5;
  }
  
  // Paddle 3 (Arriba) - A/D
  if (numPlayers >= 3) {
    if (keys['a'] && paddle3.x > 0) paddle3.x -= 5;
    if (keys['d'] && paddle3.x < 700) paddle3.x += 5;
  }
  
  // Paddle 4 (Abajo) - J/L
  if (numPlayers >= 4) {
    if (keys['j'] && paddle4.x > 0) paddle4.x -= 5;
    if (keys['l'] && paddle4.x < 700) paddle4.x += 5;
  }
  
  // Ball
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  // Colisi�n con bordes verticales (arriba/abajo)
  if (numPlayers >= 3) {
    // Arriba - Paddle 3
    if (ball.y < 20 && ball.x > paddle3.x && ball.x < paddle3.x + 100) {
      ball.dy = Math.abs(ball.dy) * 1.05;
    }
  } else {
    if (ball.y < 10) ball.dy = Math.abs(ball.dy);
  }
  
  if (numPlayers >= 4) {
    // Abajo - Paddle 4
    if (ball.y > 570 && ball.x > paddle4.x && ball.x < paddle4.x + 100) {
      ball.dy = -Math.abs(ball.dy) * 1.05;
    }
  } else {
    if (ball.y > 590) ball.dy = -Math.abs(ball.dy);
  }
  
  // Colisi�n con paletas laterales
  if (ball.x < 20 && ball.y > paddle1.y && ball.y < paddle1.y + 100) {
    ball.dx = Math.abs(ball.dx) * 1.05;
  }
  if (ball.x > 770 && ball.y > paddle2.y && ball.y < paddle2.y + 100) {
    ball.dx = -Math.abs(ball.dx) * 1.05;
  }
  
  // Puntuaci�n
  if (ball.x < 0) { 
    if (numPlayers === 2) score2++;
    else scoreOthers(1);
    checkWin(); 
    resetBall(); 
  }
  if (ball.x > 800) { 
    if (numPlayers === 2) score1++;
    else scoreOthers(2);
    checkWin(); 
    resetBall(); 
  }
  if (ball.y < 0 && numPlayers >= 3) {
    scoreOthers(3);
    checkWin();
    resetBall();
  }
  if (ball.y > 600 && numPlayers >= 4) {
    scoreOthers(4);
    checkWin();
    resetBall();
  }
}

function scoreOthers(loser: number): void {
  // Todos menos el perdedor suman punto
  if (loser !== 1) score1++;
  if (loser !== 2) score2++;
  if (loser !== 3 && numPlayers >= 3) score3++;
  if (loser !== 4 && numPlayers >= 4) score4++;
}

function checkWin(): void {
  const winScore = 5;
  const winners: string[] = [];
  
  if (score1 >= winScore) winners.push('Player 1');
  if (score2 >= winScore) winners.push(isAI ? 'AI' : 'Player 2');
  if (numPlayers >= 3 && score3 >= winScore) winners.push('Player 3');
  if (numPlayers >= 4 && score4 >= winScore) winners.push('Player 4');
  
  if (winners.length > 0) {
    gameOn = false;
    if (winners.length > 1) {
      showWinner('¡Empate! ' + winners.join(' & '));
    } else {
      showWinner(winners[0]);
    }
  }
}

function draw(): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 800, 600);
  
  ctx.fillStyle = '#fff';
  
  // Paletas laterales
  ctx.fillRect(paddle1.x, paddle1.y, 10, 100);
  ctx.fillRect(paddle2.x, paddle2.y, 10, 100);
  
  // Paletas horizontales
  if (numPlayers >= 3) {
    ctx.fillRect(paddle3.x, paddle3.y, 100, 10);
  }
  if (numPlayers >= 4) {
    ctx.fillRect(paddle4.x, paddle4.y, 100, 10);
  }
  
  // Pelota
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
  ctx.fill();
  
  // Marcador
  ctx.font = '36px monospace';
  
  if (numPlayers === 2) {
    ctx.fillText(score1.toString(), 200, 60);
    ctx.fillText(score2.toString(), 580, 60);
  } else if (numPlayers === 3) {
    ctx.fillText('P1: ' + score1.toString(), 50, 60);
    ctx.fillText('P2: ' + score2.toString(), 650, 60);
    ctx.fillText('P3: ' + score3.toString(), 350, 60);
  } else if (numPlayers === 4) {
    ctx.fillText('P1: ' + score1.toString(), 50, 300);
    ctx.fillText('P2: ' + score2.toString(), 680, 300);
    ctx.fillText('P3: ' + score3.toString(), 350, 50);
    ctx.fillText('P4: ' + score4.toString(), 350, 580);
  }
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
  txt.textContent = ` ${winner} Wins!`;
  txt.className = 'text-5xl font-bold text-yellow-300';
  
  setTimeout(() => {
    el.classList.add('hidden');
    txt.className = 'text-9xl font-extrabold text-yellow-300';
    navigate('games');
  }, 3000);
}

function showPlayerSelection(): void {
  const modal = document.getElementById('modal')!;
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="card text-center space-y-4">
      <h2 class="text-2xl font-bold text-yellow-400">¿Cuántos jugadores?</h2>
      <p class="text-sm text-gray-300">Controles:</p>
      <p class="text-xs text-gray-400">P1: W/S | P2: / | P3: A/D | P4: J/L</p>
      <button onclick="selectPlayers(2)" class="btn btn-green w-full">2 Jugadores</button>
      <button onclick="selectPlayers(3)" class="btn btn-yellow w-full">3 Jugadores</button>
      <button onclick="selectPlayers(4)" class="btn btn-red w-full">4 Jugadores</button>
      <button onclick="hideModal()" class="btn btn-gray w-full">Cancelar</button>
    </div>
  `;
}

function selectPlayers(num: number): void {
  numPlayers = num;
  hideModal();
  initGame();
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
(window as any).selectPlayers = selectPlayers;
