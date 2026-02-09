import { navigate } from './router.js';
import {
  getCurrentUser,
  createRegisteredPlayer,
  createGuestPlayer,
  createAIPlayer,
  startGameSession,
  endGameSession,
  getGameSession,
  type Player,
  type GameSession
} from './gameService.js';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let board: string[][] = [['','',''],['','',''],['','','']];
let currentPlayer: 'X' | 'O' = 'X';
let over = false;
let animationFrame: number | null = null;

// Player objects
let player1: Player;  // X
let player2: Player;  // O
let isAI = false;

// Customization settings
interface CustomSettings {
  boardSize: number;
  theme: 'classic' | 'neon' | 'minimal';
  specialMode: 'none' | 'timed' | 'gravity';
}

let settings: CustomSettings = {
  boardSize: 3,
  theme: 'classic',
  specialMode: 'none'
};

// Themes
const themes = {
  classic: {
    backgroundColor: '#000',
    gridColor: '#fff',
    xColor: '#3b82f6',
    oColor: '#ef4444'
  },
  neon: {
    backgroundColor: '#0a0a1a',
    gridColor: '#00ff00',
    xColor: '#ff00ff',
    oColor: '#00ffff'
  },
  minimal: {
    backgroundColor: '#f5f5f5',
    gridColor: '#333',
    xColor: '#666',
    oColor: '#999'
  }
};

/**
 * Setup TicTacToe game with players
 */
export async function setupTicTacToe(ai: boolean = false, difficulty: number = 3): Promise<void> {
  const currentUser = await getCurrentUser();
  
  // Load customization from localStorage
  loadCustomization();
  
  if (currentUser) {
    player1 = createRegisteredPlayer(currentUser);
  } else {
    player1 = createGuestPlayer('Player 1');
  }
  
  if (ai) {
    player2 = createAIPlayer(difficulty);
    isAI = true;
  } else {
    player2 = createGuestPlayer('Player 2');
    isAI = false;
  }
  
  // Start session
  startGameSession({
    player1,
    player2,
    gameType: 'tictactoe',
    isAI: ai,
    difficulty: ai ? difficulty : undefined,
    startTime: Date.now()
  });
  
  startTicTacToe();
}

export function startTicTacToe(): void {
  const session = getGameSession();
  if (!session) {
    console.error('No game session');
    navigate('games');
    return;
  }
  
  player1 = session.player1;
  player2 = session.player2;
  isAI = session.isAI;
  
  navigate('game');
  
  setTimeout(() => {
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d')!;
    
    // Adjust canvas size based on board size
    const canvasSize = 600;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Initialize board based on settings
    board = Array(settings.boardSize).fill(null).map(() => 
      Array(settings.boardSize).fill('')
    );
    currentPlayer = 'X';
    over = false;
    
    // Show exit button and settings
    const exitBtn = document.getElementById('exitGameBtn');
    if (exitBtn) {
      exitBtn.classList.remove('hidden');
    }
    
    const settingsMenu = document.getElementById('tictactoeSettings');
    if (settingsMenu) {
      settingsMenu.classList.remove('hidden');
    }
    
    // Remove previous event listener if any
    canvas.onclick = null;
    // Add new event listener
    canvas.addEventListener('click', handleClick);
    draw();
  }, 50);
}

function draw(): void {
  const theme = themes[settings.theme];
  const cellSize = 600 / settings.boardSize;
  
  // Background
  ctx.fillStyle = theme.backgroundColor;
  ctx.fillRect(0, 0, 600, 600);
  
  // Grid
  ctx.strokeStyle = theme.gridColor;
  ctx.lineWidth = 4;
  
  // Draw grid lines
  for (let i = 1; i < settings.boardSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, 600);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(600, i * cellSize);
    ctx.stroke();
  }
  
  // Draw symbols
  ctx.font = `${Math.floor(cellSize * 0.6)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let r = 0; r < settings.boardSize; r++) {
    for (let c = 0; c < settings.boardSize; c++) {
      if (board[r][c]) {
        ctx.fillStyle = board[r][c] === 'X' ? theme.xColor : theme.oColor;
        ctx.fillText(board[r][c], c * cellSize + cellSize / 2, r * cellSize + cellSize / 2);
      }
    }
  }
}

function handleClick(e: MouseEvent): void {
  if (over) return;
  if (currentPlayer === 'O' && isAI) return; // AI's turn, ignore clicks
  
  const rect = canvas.getBoundingClientRect();
  const cellSize = 600 / settings.boardSize;
  const c = Math.floor((e.clientX - rect.left) / cellSize);
  const r = Math.floor((e.clientY - rect.top) / cellSize);
  
  // Validation
  if (r < 0 || r >= settings.boardSize || c < 0 || c >= settings.boardSize) return;
  if (board[r][c]) return;
  
  makeMove(r, c);
}

function makeMove(r: number, c: number): void {
  board[r][c] = currentPlayer;
  draw();
  
  const result = checkWin();
  if (result) {
    over = true;
    
    // Calculate scores (winner gets 1, loser gets 0, tie gets 0.5 each)
    let score1 = 0, score2 = 0;
    if (result === 'X') score1 = 1;
    else if (result === 'O') score2 = 1;
    else { score1 = 0.5; score2 = 0.5; } // Tie
    
    // Save match
    endGameSession(score1, score2).then(() => {
      setTimeout(() => showWinner(result), 300);
    });
  } else {
    // Switch player
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    
    // AI turn
    if (isAI && currentPlayer === 'O' && !over) {
      setTimeout(() => makeAIMove(), 500); // Small delay for better UX
    }
  }
}

/**
 * AI makes a move using minimax algorithm
 */
function makeAIMove(): void {
  if (over) return;
  
  const session = getGameSession();
  const difficulty = session?.difficulty || 3;
  
  let move: { r: number; c: number } | null = null;
  
  // Difficulty levels:
  // 2 (Easy): Random moves
  // 3 (Medium): Mix of optimal and random
  // 4 (Hard): Always optimal (minimax)
  
  if (difficulty === 2) {
    // Easy: Random move
    move = getRandomMove();
  } else if (difficulty === 3) {
    // Medium: 60% optimal, 40% random
    move = Math.random() < 0.6 ? getBestMove() : getRandomMove();
  } else {
    // Hard: Always optimal
    move = getBestMove();
  }
  
  if (move) {
    makeMove(move.r, move.c);
  }
}

/**
 * Get random empty cell
 */
function getRandomMove(): { r: number; c: number } | null {
  const empty: { r: number; c: number }[] = [];
  
  for (let r = 0; r < settings.boardSize; r++) {
    for (let c = 0; c < settings.boardSize; c++) {
      if (!board[r][c]) {
        empty.push({ r, c });
      }
    }
  }
  
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

/**
 * Get best move using minimax algorithm
 */
function getBestMove(): { r: number; c: number } | null {
  let bestScore = -Infinity;
  let bestMove: { r: number; c: number } | null = null;
  
  for (let r = 0; r < settings.boardSize; r++) {
    for (let c = 0; c < settings.boardSize; c++) {
      if (!board[r][c]) {
        board[r][c] = 'O';
        const score = minimax(board, 0, false);
        board[r][c] = '';
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = { r, c };
        }
      }
    }
  }
  
  return bestMove;
}

/**
 * Minimax algorithm for optimal AI
 */
function minimax(board: string[][], depth: number, isMaximizing: boolean): number {
  const result = checkWin();
  
  if (result === 'O') return 10 - depth;
  if (result === 'X') return depth - 10;
  if (result === 'Tie') return 0;
  
  // Limit depth for larger boards to prevent slowness
  if (depth > 6 && settings.boardSize > 3) {
    return 0;
  }
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let r = 0; r < settings.boardSize; r++) {
      for (let c = 0; c < settings.boardSize; c++) {
        if (!board[r][c]) {
          board[r][c] = 'O';
          const score = minimax(board, depth + 1, false);
          board[r][c] = '';
          bestScore = Math.max(score, bestScore);
        }
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let r = 0; r < settings.boardSize; r++) {
      for (let c = 0; c < settings.boardSize; c++) {
        if (!board[r][c]) {
          board[r][c] = 'X';
          const score = minimax(board, depth + 1, true);
          board[r][c] = '';
          bestScore = Math.min(score, bestScore);
        }
      }
    }
    return bestScore;
  }
}

function checkWin(): string | null {
  const size = settings.boardSize;
  const winLength = size === 3 ? 3 : size; // 3 in a row for 3x3, 4+ for larger boards
  
  // Check rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const first = board[r][c];
      if (first && board[r].slice(c, c + winLength).every(cell => cell === first)) {
        return first;
      }
    }
  }
  
  // Check columns
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winLength; r++) {
      const first = board[r][c];
      if (first) {
        let match = true;
        for (let i = 1; i < winLength; i++) {
          if (board[r + i][c] !== first) {
            match = false;
            break;
          }
        }
        if (match) return first;
      }
    }
  }
  
  // Check diagonals (top-left to bottom-right)
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const first = board[r][c];
      if (first) {
        let match = true;
        for (let i = 1; i < winLength; i++) {
          if (board[r + i][c + i] !== first) {
            match = false;
            break;
          }
        }
        if (match) return first;
      }
    }
  }
  
  // Check diagonals (top-right to bottom-left)
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = winLength - 1; c < size; c++) {
      const first = board[r][c];
      if (first) {
        let match = true;
        for (let i = 1; i < winLength; i++) {
          if (board[r + i][c - i] !== first) {
            match = false;
            break;
          }
        }
        if (match) return first;
      }
    }
  }
  
  // Check for tie
  const hasEmpty = board.some(row => row.some(cell => cell === ''));
  return hasEmpty ? null : 'Tie';
}

function showWinner(w: string): void {
  const el = document.getElementById('countdown')!;
  const txt = document.getElementById('countdownText')!;
  el.classList.remove('hidden');
  
  // Hide exit button and settings
  const exitBtn = document.getElementById('exitGameBtn');
  if (exitBtn) {
    exitBtn.classList.add('hidden');
  }
  
  const settingsMenu = document.getElementById('tictactoeSettings');
  if (settingsMenu) {
    settingsMenu.classList.add('hidden');
  }
  
  let message = '';
  if (w === 'Tie') {
    message = "It's a Tie!";
  } else {
    const winner = w === 'X' ? player1 : player2;
    message = `${winner.name} Wins!`;
  }
  
  txt.textContent = message;
  txt.className = 'text-5xl font-bold text-yellow-300';
  
  setTimeout(() => {
    el.classList.add('hidden');
    txt.className = 'text-9xl font-extrabold text-yellow-300';
    navigate('games');
  }, 2000);
}

/**
 * Exit game early
 */
export function exitGame(): void {
  over = true;
  
  // Hide exit button and settings
  const exitBtn = document.getElementById('exitGameBtn');
  if (exitBtn) {
    exitBtn.classList.add('hidden');
  }
  
  const settingsMenu = document.getElementById('tictactoeSettings');
  if (settingsMenu) {
    settingsMenu.classList.add('hidden');
  }
  
  // Cancel animation if any
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  
  navigate('games');
}

/**
 * Load customization from localStorage
 */
function loadCustomization(): void {
  const stored = localStorage.getItem('tictactoeCustomization');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      settings = {
        boardSize: parsed.boardSize || 3,
        theme: parsed.theme || 'classic',
        specialMode: parsed.specialMode || 'none'
      };
    } catch (e) {
      console.error('Failed to load customization:', e);
    }
  }
}

/**
 * Save customization to localStorage
 */
export function saveCustomization(newSettings: Partial<CustomSettings>): void {
  settings = { ...settings, ...newSettings };
  localStorage.setItem('tictactoeCustomization', JSON.stringify(settings));
}

/**
 * Get current customization settings
 */
export function getCustomization(): CustomSettings {
  return { ...settings };
}

/**
 * Change theme in real-time
 */
export function changeTheme(theme: 'classic' | 'neon' | 'minimal'): void {
  settings.theme = theme;
  saveCustomization({ theme });
  draw(); // Redraw with new theme
}

// Global exports
(window as any).setupTicTacToe = setupTicTacToe;
(window as any).startTicTacToe = startTicTacToe;
(window as any).exitGame = exitGame;
(window as any).changeTicTacToeTheme = changeTheme;