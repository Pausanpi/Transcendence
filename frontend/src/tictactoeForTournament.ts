/**
 * tictactoeForTournament.ts
 *
 * Thin wrapper around tictactoe.ts logic, adapted for tournament use.
 * It duplicates only what is necessary to wire the "game end" callback
 * that the tournament controller needs, without modifying tictactoe.ts.
 *
 * The approach mirrors how pong.ts exposes setOnGameEnd / initPongGame.
 */

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
} from './gameService.js';

// ===== CALLBACK (mirrors pong.ts) =====

export interface MatchResult {
	player1: Player;
	player2: Player;
	player1Score: number;
	player2Score: number;
	winner: Player;
}

let onGameEndCallback: ((result: MatchResult) => void) | null = null;

export function setOnTicTacToeGameEnd(callback: (result: MatchResult) => void): void {
	onGameEndCallback = callback;
}

// ===== GAME STATE =====

type Theme = 'classic' | 'neon' | 'minimal';
type SpecialMode = 'none' | 'timed' | 'gravity';

interface Settings {
	boardSize: number;
	theme: Theme;
	specialMode: SpecialMode;
}

const themes = {
	classic: { backgroundColor: '#000',    gridColor: '#fff',    xColor: '#3b82f6', oColor: '#ef4444' },
	neon:    { backgroundColor: '#0a0a1a', gridColor: '#00ff00', xColor: '#ff00ff', oColor: '#00ffff' },
	minimal: { backgroundColor: '#f5f5f5', gridColor: '#333',    xColor: '#666',    oColor: '#999'    },
};

const TURN_TIME_SECONDS = 10;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let board: string[][] = [];
let currentPlayer: 'X' | 'O' = 'X';
let over = false;
let settings: Settings = { boardSize: 3, theme: 'classic', specialMode: 'none' };

let timerSecondsLeft = TURN_TIME_SECONDS;
let timerIntervalId: ReturnType<typeof setInterval> | null = null;
let aiMoveTimeoutId: ReturnType<typeof setTimeout> | null = null;
let winnerTimeoutId: ReturnType<typeof setTimeout> | null = null;
let initTimeoutId: ReturnType<typeof setTimeout> | null = null;

let player1: Player;
let player2: Player;
let isAI = false;

// ===== PUBLIC API =====

/**
 * Entry point called by tournamentController — mirrors initPongGame signature style.
 * Assumes startGameSession() has already been called by the controller.
 */
export function initTicTacToeForTournament(config: {
	player1: Player;
	player2: Player;
	isAI: boolean;
	difficulty?: number;
}): void {
	const session = getGameSession();
	if (!session) {
		console.error('No game session found for TicTacToe tournament match');
		navigate('games');
		return;
	}

	player1 = config.player1;
	player2 = config.player2;
	isAI = config.isAI;

	// Load saved customisation (board size, theme, mode) just like tictactoe.ts does
	loadCustomization();

	navigate('game');

	initTimeoutId = setTimeout(() => {
		initTimeoutId = null;

		canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
		if (!canvas) return;
		ctx = canvas.getContext('2d')!;

		canvas.width = 600;
		canvas.height = 600;
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		board = Array(settings.boardSize).fill(null).map(() =>
			Array(settings.boardSize).fill('')
		);
		currentPlayer = 'X';
		over = false;

		// Show exit button (tournament may hide it later on win)
		document.getElementById('exitGameContainer')?.classList.remove('hidden');

		// Show TicTacToe settings panel if present
		document.getElementById('tictactoeSettings')?.classList.remove('hidden');

		canvas.removeEventListener('click', handleClick);
		canvas.addEventListener('click', handleClick);

		draw();
		startTurnTimer();
	}, 50);
}

export function stopTicTacToeForTournament(): void {
	over = true;

	if (initTimeoutId)    { clearTimeout(initTimeoutId);    initTimeoutId = null; }
	if (aiMoveTimeoutId)  { clearTimeout(aiMoveTimeoutId);  aiMoveTimeoutId = null; }
	if (winnerTimeoutId)  { clearTimeout(winnerTimeoutId);  winnerTimeoutId = null; }
	stopTurnTimer();

	window.removeEventListener('resize', resizeCanvas);

	if (canvas) {
		canvas.removeEventListener('click', handleClick);
		canvas = null;
	}

	document.getElementById('exitGameBtn')?.classList.add('hidden');
	document.getElementById('tictactoeSettings')?.classList.add('hidden');
}

// ===== DRAWING =====

function draw(): void {
	if (!ctx) return;
	const theme = themes[settings.theme];
	const cellSize = 600 / settings.boardSize;

	ctx.fillStyle = theme.backgroundColor;
	ctx.fillRect(0, 0, 600, 600);

	ctx.strokeStyle = theme.gridColor;
	ctx.lineWidth = 4;

	for (let i = 1; i < settings.boardSize; i++) {
		ctx.beginPath(); ctx.moveTo(i * cellSize, 0);   ctx.lineTo(i * cellSize, 600); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(0, i * cellSize);   ctx.lineTo(600, i * cellSize); ctx.stroke();
	}

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

	if (settings.specialMode === 'timed' && !over) {
		const ratio = timerSecondsLeft / TURN_TIME_SECONDS;
		const barH = 10;
		const barY = 600 - barH;

		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.fillRect(0, barY, 600, barH);

		const r2 = Math.min(1, 2 * (1 - ratio));
		const g2 = Math.min(1, 2 * ratio);
		ctx.fillStyle = `rgb(${Math.round(r2 * 220)},${Math.round(g2 * 180)},0)`;
		ctx.fillRect(0, barY, 600 * ratio, barH);

		ctx.font = 'bold 18px monospace';
		ctx.fillStyle = timerSecondsLeft <= 3 ? '#ff4444' : '#ffffff';
		ctx.textAlign = 'right';
		ctx.textBaseline = 'bottom';
		ctx.fillText(`${timerSecondsLeft}s`, 596, barY - 2);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
	}
}

function resizeCanvas(): void {
	if (!canvas) return;
	const maxW = Math.min(window.innerWidth - 32, 600);
	canvas.style.width  = `${maxW}px`;
	canvas.style.height = `${maxW}px`;
}

// ===== INPUT =====

function handleClick(e: MouseEvent): void {
	if (over || !canvas) return;
	if (currentPlayer === 'O' && isAI) return;

	const rect = canvas.getBoundingClientRect();
	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;
	const cellSize = canvas.width / settings.boardSize;
	const c = Math.floor((e.clientX - rect.left) * scaleX / cellSize);

	if (c < 0 || c >= settings.boardSize) return;

	if (settings.specialMode === 'gravity') {
		let targetRow = -1;
		for (let row = settings.boardSize - 1; row >= 0; row--) {
			if (!board[row][c]) { targetRow = row; break; }
		}
		if (targetRow === -1) return;
		makeMove(targetRow, c);
	} else {
		const r = Math.floor((e.clientY - rect.top) * scaleY / cellSize);
		if (r < 0 || r >= settings.boardSize) return;
		if (board[r][c]) return;
		makeMove(r, c);
	}
}

// ===== GAME LOGIC =====

function makeMove(r: number, c: number): void {
	stopTurnTimer();
	board[r][c] = currentPlayer;
	draw();

	const result = checkWin();
	if (result) {
		over = true;

		let score1 = 0, score2 = 0;
		if      (result === 'X') { score1 = 1; }
		else if (result === 'O') { score2 = 1; }
		else                     { score1 = 0.5; score2 = 0.5; }  // Tie

		// Do NOT call endGameSession here — in tournament mode the controller
		// handles persistence via saveTournamentMatch to avoid double-saving.
		// (mirrors the pattern in pong.ts checkWin)
		winnerTimeoutId = setTimeout(() => {
			winnerTimeoutId = null;
			fireGameEnd(result, score1, score2);
		}, 300);
	} else {
		currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

		if (isAI && currentPlayer === 'O' && !over) {
			aiMoveTimeoutId = setTimeout(() => { aiMoveTimeoutId = null; makeAIMove(); }, 500);
		} else {
			startTurnTimer();
		}
	}
}

/**
 * Fires the tournament callback (or falls back to navigating away).
 */
function fireGameEnd(result: string, score1: number, score2: number): void {
	// In a tie there is no real winner; we pass player1 only as a placeholder
	// but score1 === score2 === 0.5, so saveMatch / saveTournamentMatch will
	// record it correctly (both IDs present, scores equal).
	// The tournament bracket always needs a winner to advance, so in a tie
	// we pick the player who is registered (or player1 as last resort).
	const winner = result === 'Tie'
		? (!player1.isGuest ? player1 : !player2.isGuest ? player2 : player1)
		: result === 'X' ? player1 : player2;

	const matchResult: MatchResult = {
		player1,
		player2,
		player1Score: score1,
		player2Score: score2,
		winner,
	};

	if (onGameEndCallback) {
		onGameEndCallback(matchResult);
	} else {
		// Standalone fallback (should not normally happen in tournament context)
		showWinnerAndExit(result);
	}
}

function showWinnerAndExit(w: string): void {
	const el  = document.getElementById('countdown')!;
	const txt = document.getElementById('countdownText')!;
	el.classList.remove('hidden');

	document.getElementById('exitGameBtn')?.classList.add('hidden');
	document.getElementById('tictactoeSettings')?.classList.add('hidden');

	txt.textContent = w === 'Tie'
		? "It's a Tie!"
		: `${(w === 'X' ? player1 : player2).name} Wins!`;
	txt.className = 'text-5xl font-bold text-yellow-300';

	setTimeout(() => {
		el.classList.add('hidden');
		txt.className = 'text-9xl font-extrabold text-yellow-300';
		navigate('games');
	}, 2000);
}

// ===== TIMER =====

function startTurnTimer(): void {
	stopTurnTimer();
	if (settings.specialMode !== 'timed' || over) return;

	timerSecondsLeft = TURN_TIME_SECONDS;
	draw();

	timerIntervalId = setInterval(() => {
		timerSecondsLeft--;
		draw();
		if (timerSecondsLeft <= 0) {
			stopTurnTimer();
			if (over) return;
			currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
			if (isAI && currentPlayer === 'O' && !over) {
				aiMoveTimeoutId = setTimeout(() => { aiMoveTimeoutId = null; makeAIMove(); }, 300);
			} else {
				startTurnTimer();
			}
		}
	}, 1000);
}

function stopTurnTimer(): void {
	if (timerIntervalId !== null) {
		clearInterval(timerIntervalId);
		timerIntervalId = null;
	}
}

// ===== AI =====

function makeAIMove(): void {
	if (over) return;
	const difficulty = getGameSession()?.difficulty ?? 3;
	let move: { r: number; c: number } | null = null;

	if      (difficulty === 2) { move = getRandomMove(); }
	else if (difficulty === 3) { move = Math.random() < 0.6 ? getBestMove() : getRandomMove(); }
	else                       { move = getBestMove(); }

	if (move) makeMove(move.r, move.c);
}

function getRandomMove(): { r: number; c: number } | null {
	const empty: { r: number; c: number }[] = [];
	for (let r = 0; r < settings.boardSize; r++)
		for (let c = 0; c < settings.boardSize; c++)
			if (!board[r][c]) empty.push({ r, c });
	return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

function getBestMove(): { r: number; c: number } | null {
	let bestScore = -Infinity;
	let bestMove: { r: number; c: number } | null = null;

	for (let r = 0; r < settings.boardSize; r++) {
		for (let c = 0; c < settings.boardSize; c++) {
			if (!board[r][c]) {
				board[r][c] = 'O';
				const score = minimax(board, 0, false);
				board[r][c] = '';
				if (score > bestScore) { bestScore = score; bestMove = { r, c }; }
			}
		}
	}
	return bestMove;
}

function minimax(b: string[][], depth: number, isMax: boolean): number {
	const res = checkWin();
	if (res === 'O')   return 10 - depth;
	if (res === 'X')   return depth - 10;
	if (res === 'Tie') return 0;
	if (depth > 6 && settings.boardSize > 3) return 0;

	if (isMax) {
		let best = -Infinity;
		for (let r = 0; r < settings.boardSize; r++)
			for (let c = 0; c < settings.boardSize; c++)
				if (!b[r][c]) { b[r][c] = 'O'; best = Math.max(best, minimax(b, depth + 1, false)); b[r][c] = ''; }
		return best;
	} else {
		let best = Infinity;
		for (let r = 0; r < settings.boardSize; r++)
			for (let c = 0; c < settings.boardSize; c++)
				if (!b[r][c]) { b[r][c] = 'X'; best = Math.min(best, minimax(b, depth + 1, true)); b[r][c] = ''; }
		return best;
	}
}

function checkWin(): string | null {
	const size = settings.boardSize;
	const winLen = size;  // for tournament we always use full-size wins

	// Rows
	for (let r = 0; r < size; r++)
		for (let c = 0; c <= size - winLen; c++) {
			const first = board[r][c];
			if (first && board[r].slice(c, c + winLen).every(cell => cell === first)) return first;
		}

	// Columns
	for (let c = 0; c < size; c++)
		for (let r = 0; r <= size - winLen; r++) {
			const first = board[r][c];
			if (first) {
				let match = true;
				for (let i = 1; i < winLen; i++) if (board[r + i][c] !== first) { match = false; break; }
				if (match) return first;
			}
		}

	// Diagonals ↘
	for (let r = 0; r <= size - winLen; r++)
		for (let c = 0; c <= size - winLen; c++) {
			const first = board[r][c];
			if (first) {
				let match = true;
				for (let i = 1; i < winLen; i++) if (board[r + i][c + i] !== first) { match = false; break; }
				if (match) return first;
			}
		}

	// Diagonals ↙
	for (let r = 0; r <= size - winLen; r++)
		for (let c = winLen - 1; c < size; c++) {
			const first = board[r][c];
			if (first) {
				let match = true;
				for (let i = 1; i < winLen; i++) if (board[r + i][c - i] !== first) { match = false; break; }
				if (match) return first;
			}
		}

	return board.some(row => row.some(cell => cell === '')) ? null : 'Tie';
}

// ===== CUSTOMIZATION (read-only, same source as tictactoe.ts) =====

function loadCustomization(): void {
	const stored = localStorage.getItem('tictactoeCustomization');
	if (!stored) return;
	try {
		const parsed = JSON.parse(stored);
		settings = {
			boardSize:   parsed.boardSize   || 3,
			theme:       parsed.theme       || 'classic',
			specialMode: parsed.specialMode || 'none',
		};
	} catch { /* ignore corrupt data */ }
}

// ===== CLEANUP ON PAGE CHANGE =====

window.addEventListener('beforepagechange', () => {
	stopTicTacToeForTournament();
});