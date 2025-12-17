import { navigate } from './router.js';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let board: string[][] = [['','',''],['','',''],['','','']];
let player = 'X';
let over = false;

export function startTicTacToe(): void {
  navigate('game');
  
  setTimeout(() => {
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d')!;
    canvas.width = 600;
    canvas.height = 600;
    
    board = [['','',''],['','',''],['','','']];
    player = 'X';
    over = false;
    
    canvas.onclick = handleClick;
    draw();
  }, 50);
}

function draw(): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 600, 600);
  
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 200, 0); ctx.lineTo(i * 200, 600);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * 200); ctx.lineTo(600, i * 200);
    ctx.stroke();
  }
  
  ctx.font = '120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c]) {
        ctx.fillStyle = board[r][c] === 'X' ? '#3b82f6' : '#ef4444';
        ctx.fillText(board[r][c], c * 200 + 100, r * 200 + 100);
      }
    }
  }
}

function handleClick(e: MouseEvent): void {
  if (over) return;
  
  const rect = canvas.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / 200);
  const r = Math.floor((e.clientY - rect.top) / 200);
  
  if (board[r][c]) return;
  
  board[r][c] = player;
  draw();
  
  const winner = checkWin();
  if (winner) {
    over = true;
    setTimeout(() => showWinner(winner), 300);
  } else {
    player = player === 'X' ? 'O' : 'X';
  }
}

function checkWin(): string | null {
  const lines = [
    [board[0][0], board[0][1], board[0][2]],
    [board[1][0], board[1][1], board[1][2]],
    [board[2][0], board[2][1], board[2][2]],
    [board[0][0], board[1][0], board[2][0]],
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],
    [board[0][0], board[1][1], board[2][2]],
    [board[0][2], board[1][1], board[2][0]],
  ];
  
  for (const l of lines) {
    if (l[0] && l[0] === l[1] && l[1] === l[2]) return l[0];
  }
  
  return board.flat().includes('') ? null : 'Tie';
}

function showWinner(w: string): void {
  const el = document.getElementById('countdown')!;
  const txt = document.getElementById('countdownText')!;
  el.classList.remove('hidden');
  txt.textContent = w === 'Tie' ? "It's a Tie!" : `${w} Wins!`;
  txt.className = 'text-5xl font-bold text-yellow-300';
  
  setTimeout(() => {
    el.classList.add('hidden');
    txt.className = 'text-9xl font-extrabold text-yellow-300';
    navigate('games');
  }, 2000);
}

// Global
(window as any).startTicTacToe = startTicTacToe;