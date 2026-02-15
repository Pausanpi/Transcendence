import { navigate } from '../router.js';
import { getCurrentUser, createRegisteredPlayer, createGuestPlayer, createAIPlayer, startGameSession, endGameSession, loginPlayer } from '../gameService.js';
import { initPongGame, setOnGameEnd, showWinnerOverlay } from '../pong.js';
import { setupTicTacToe } from '../tictactoe.js';
// ===== PLAYER SETUP STATE =====
let verifiedPlayer2: any = null;

// ===== GAME OPTIONS STATE =====
let pendingGamePlayers: any = null;
let gameOptions = {
	background: 'default',
	difficulty: 'medium'
};
// ===== GAME SELECTION PAGE =====
export function renderGames() {
	return `
    <h2 class="text-4xl font-bold text-center text-yellow-400 mb-8" data-i18n="game.select">Select Game</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="window.gameUI.startPongPvP()">
        <div class="text-6xl mb-4">🏓</div>
        <h3 class="text-xl font-bold" data-i18n="game.pongPvP">Pong - PvP</h3>
        <p class="text-gray-400" data-i18n="game.playerVSplayer">Player vs Player</p>
      </div>
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="window.gameUI.showDifficultySelect()">
        <div class="text-6xl mb-4">🤖</div>
        <h3 class="text-xl font-bold" data-i18n="game.pongAI">Pong - AI</h3>
        <p class="text-gray-400"data-i18n="game.playerVScomputer">Player vs Computer</p>
      </div>
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="window.gameUI.startTicTacToe()">
        <div class="text-6xl mb-4">⭕</div>
        <h3 class="text-xl font-bold" data-i18n="game.ttt">Tic-Tac-Toe</h3>
        <p class="text-gray-400" data-i18n="game.twoplayers">2 Players</p>
      </div>
    </div>
  `;
}
// ===== MODAL HELPERS =====
function showModal(html: string) {
	const modal = document.getElementById('modal');
	if (!modal)
		return;
	modal.classList.remove('hidden');
	modal.innerHTML = html;
}
function hideModal() {
	const modal = document.getElementById('modal');
	if (!modal)
		return;
	modal.classList.add('hidden');
	verifiedPlayer2 = null;
}
function clearPlayer2Verification() {
	verifiedPlayer2 = null;
	getCurrentUser().then(currentUser => {
		if (currentUser) {
			showPlayer2Setup(currentUser);
		}
	});
}
// ===== PONG GAME FLOWS =====
async function startPongPvP() {
	const currentUser = await getCurrentUser();
	if (!currentUser) {
		// No user logged in - both players must be guests
		showGuestVsGuestSetup();
	}
	else {
		// User logged in - show player 2 setup
		showPlayer2Setup(currentUser);
	}
}
async function startPongAI(difficulty: number) {
	hideModal(); // Close difficulty modal
	const currentUser = await getCurrentUser();
	let player1;
	if (currentUser) {
		player1 = createRegisteredPlayer(currentUser);
	}
	else {
		// Guest player
		player1 = createGuestPlayer('Guest');
	}
	const player2 = createAIPlayer(difficulty);
	// Start session
	startGameSession({
		player1,
		player2,
		gameType: 'pong',
		isAI: true,
		difficulty,
		startTime: Date.now()
	});
	// Setup game end handler
	setupPongGameEndHandler();
	// Navigate and init game
	navigate('game');
	initPongGame({
		player1,
		player2,
		isAI: true,
		difficulty
	});
}
// ===== PLAYER SETUP MODALS =====
function showGuestVsGuestSetup() {
	showModal(`
    <div class="card text-center space-y-4 max-w-md mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="game.guestVSguest">Guest vs Guest</h2>
      <p class="text-sm text-gray-400" data-i18n="game.noPlayersLogged">No players logged in - both will play as guests</p>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="game.player1">Player 1 (W/S keys)</label>
        <input
          type="text"
          value="Guest"
          disabled
          class="w-full p-3 rounded bg-gray-600 cursor-not-allowed text-white"
        />
        <p class="text-xs text-gray-400 mt-1" data-i18n="game.playingAsGuest">Playing as guest</p>
      </div>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="game.player2">Player 2 (↑/↓ keys)</label>
        <input
          type="text"
          value="Guest"
          disabled
          class="w-full p-3 rounded bg-gray-600 cursor-not-allowed text-white"
        />
        <p class="text-xs text-gray-400 mt-1" data-i18n="game.playingAsGuest">Playing as guest</p>
      </div>
      
      <div class="flex gap-4 mt-6">
        <button onclick="window.gameUI.hideModal()" class="btn btn-gray flex-1" data-i18n="game.cancel">Cancel</button>
        <button onclick="window.gameUI.confirmGuestVsGuest()" class="btn btn-green flex-1" data-i18n="game.startGame">Start Game</button>
      </div>
    </div>
  `);
	applyTranslations();
}
function showPlayer2Setup(currentUser: any) {
	const player1Name = currentUser.display_name || currentUser.username;
	const player2DisplayName = verifiedPlayer2
		? (verifiedPlayer2.display_name || verifiedPlayer2.username)
		: 'Guest';
	const verifiedStatus = verifiedPlayer2
		? `<p class="text-xs text-green-400 mt-1" data-i18n="game.verifiedPlayer">✓ Verified player</p>`
		: `<p class="text-xs text-gray-400 mt-1" data-i18n="game.playingAsGuest">Playing as guest</p>`;
	const verifyButtonHtml = verifiedPlayer2
		? '<button onclick="window.gameUI.clearPlayer2Verification()" class="btn btn-yellow mt-2" type="button" data-i18n="game.changePlayer">Change Player 2</button>'
		: '<button onclick="window.gameUI.showPlayer2VerifyModal()" class="btn btn-blue mt-2" type="button" data-i18n="game.verifyPlayer2">Verify Player 2</button>';
	showModal(`
    <div class="card text-center space-y-4 max-w-md mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="game.player2setup">Player 2 Setup</h2>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="game.player1">Player 1 (W/S keys)</label>
        <input
          type="text"
          value="${player1Name}"
          disabled
          class="w-full p-3 rounded bg-gray-600 cursor-not-allowed text-white"
        />
        <p class="text-xs text-green-400 mt-1" data-i18n="game.logged">✓ Logged in as ${player1Name}</p>
      </div>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="game.player2">Player 2 (↑/↓ keys)</label>
        <input
          type="text"
          value="${player2DisplayName}"
          disabled
          class="w-full p-3 rounded bg-gray-600 cursor-not-allowed text-white"
        />
        ${verifiedStatus}
        ${verifyButtonHtml}
      </div>
      
      <div class="flex gap-4 mt-6">
        <button onclick="window.gameUI.hideModal()" class="btn btn-gray flex-1" data-i18n="game.cancel">Cancel</button>
        <button onclick="window.gameUI.confirmPlayer2Setup()" class="btn btn-green flex-1" data-i18n="game.startGame">Start Game</button>
      </div>
    </div>
  `);
	applyTranslations();
}
function showPlayer2VerifyModal() {
	showModal(`
    <div class="card text-center space-y-4 max-w-md mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="game.verifyPlayer2">Verify Player 2</h2>
      <p class="text-gray-400" data-i18n="game.player2mustLog">Player 2 must log in to verify their identity</p>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="admin.email">Email</label>
        <input
          type="email"
          id="player2Email"
          placeholder="email@example.com"
          class="w-full p-3 rounded bg-gray-700 text-white"
        />
      </div>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="admin.password">Password</label>
        <input
          type="password"
          id="player2Password"
          placeholder="Password"
          class="w-full p-3 rounded bg-gray-700 text-white"
        />
      </div>
      
      <div id="loginStatus" class="text-sm"></div>
      
      <div class="flex gap-4 mt-6">
        <button onclick="window.gameUI.backToPlayer2Setup()" class="btn btn-gray flex-1" data-i18n="game.back">Back</button>
        <button onclick="window.gameUI.loginPlayer2Direct()" class="btn btn-green flex-1" data-i18n="game.login">Login</button>
      </div>
    </div>
  `);
	focusInput('player2Email');
	applyTranslations();
}
async function loginPlayer2Direct() {
	const emailInput = document.getElementById('player2Email') as HTMLInputElement;
	const passwordInput = document.getElementById('player2Password') as HTMLInputElement;
	const statusDiv = document.getElementById('loginStatus');
	if (!emailInput || !passwordInput || !statusDiv)
		return;
	const email = emailInput.value.trim();
	const password = passwordInput.value;
	if (!email || !password) {
		statusDiv.innerHTML = '<span class="text-red-400" data-i18n="game.enterEmailAndPassword">Please enter email and password</span>';
		return;
	}
	statusDiv.innerHTML = '<span class="text-yellow-400" data-i18n="game.logginIn">Logging in...</span>';
	const user = await loginPlayer(email, password);
	if (user) {
		verifiedPlayer2 = user;
		statusDiv.innerHTML = '<span class="text-green-400" data-i18n="game.player2Verified">✓ Player 2 verified!</span>';
		setTimeout(() => {
			backToPlayer2Setup();
		}, 1000);
	}
	else {
		statusDiv.innerHTML = '<span class="text-red-400" data-i18n="game.invalidCredentials">✗ Invalid credentials</span>';
	}
}
async function backToPlayer2Setup() {
	const currentUser = await getCurrentUser();
	if (currentUser) {
		showPlayer2Setup(currentUser);
	}
}
// ===== GAME START CONFIRMATION =====
async function confirmGuestVsGuest() {
	const player1 = createGuestPlayer('Guest');
	const player2 = createGuestPlayer('Guest');
	startPongWithPlayers(player1, player2);
}
async function confirmPlayer2Setup() {
	const currentUser = await getCurrentUser();
	if (!currentUser)
		return;
	const player1 = createRegisteredPlayer(currentUser);
	let player2;
	if (verifiedPlayer2) {
		// Verified registered player
		player2 = createRegisteredPlayer(verifiedPlayer2);
	}
	else {
		// Not verified - always use Guest
		player2 = createGuestPlayer('Guest');
	}
	startPongWithPlayers(player1, player2);
}
function startPongWithPlayers(player1: any, player2: any) {
	// Store players and show game options modal
	pendingGamePlayers = { player1, player2 };
	showGameOptionsModal();
}

function showGameOptionsModal() {
	showModal(`
    <div class="card text-center space-y-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="game.options">Game Options</h2>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-3 font-bold" data-i18n="game.background">Background</label>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label class="flex flex-col items-center cursor-pointer group">
            <input type="radio" name="background" value="default" checked data-background="default" class="hidden">
            <div class="w-48 h-32 rounded border-2 border-gray-600 group-has-[:checked]:border-yellow-400 group-has-[:checked]:border-4 bg-black flex items-center justify-center text-white text-xs font-bold mb-2 transition-all duration-200 pointer-events-none"></div>
            <span class="text-white text-sm" data-i18n="game.background1">Default</span>
          </label>
          
          <label class="flex flex-col items-center cursor-pointer group">
            <input type="radio" name="background" value="space" data-background="space" class="hidden">
            <div class="w-48 h-32 rounded border-2 border-gray-600 group-has-[:checked]:border-yellow-400 group-has-[:checked]:border-4 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center relative overflow-hidden mb-2 transition-all duration-200 pointer-events-none">
              <div class="absolute w-1 h-1 bg-white rounded-full pointer-events-none" style="top: 20%; left: 20%;"></div>
              <div class="absolute w-0.5 h-0.5 bg-white rounded-full pointer-events-none" style="top: 40%; right: 30%;"></div>
              <div class="absolute w-1 h-1 bg-white rounded-full pointer-events-none" style="bottom: 25%; left: 35%;"></div>
              <div class="absolute w-0.5 h-0.5 bg-white rounded-full pointer-events-none" style="bottom: 15%; right: 20%;"></div>
            </div>
            <span class="text-white text-sm" data-i18n="game.background2">Space</span>
          </label>
          
          <label class="flex flex-col items-center cursor-pointer group">
            <input type="radio" name="background" value="ocean" data-background="ocean" class="hidden">
            <div class="w-48 h-32 rounded border-2 border-gray-600 group-has-[:checked]:border-yellow-400 group-has-[:checked]:border-4 bg-gradient-to-b from-blue-900 to-blue-950 flex items-center justify-center relative overflow-hidden mb-2 transition-all duration-200 pointer-events-none">
              <div class="absolute inset-0 opacity-30 pointer-events-none" style="background: repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);"></div>
            </div>
            <span class="text-white text-sm" data-i18n="game.background3">Ocean</span>
          </label>
          
          <label class="flex flex-col items-center cursor-pointer group">
            <input type="radio" name="background" value="neon" data-background="neon" class="hidden">
            <div class="w-48 h-32 rounded border-2 border-gray-600 group-has-[:checked]:border-yellow-400 group-has-[:checked]:border-4 bg-gradient-to-br from-purple-900 via-gray-900 to-cyan-900 flex items-center justify-center relative overflow-hidden mb-2 transition-all duration-200 pointer-events-none">
              <div class="absolute inset-0 opacity-50 pointer-events-none" style="background: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,255,255,0.1) 5px, rgba(0,255,255,0.1) 10px);"></div>
            </div>
            <span class="text-white text-sm" data-i18n="game.background4">Neon</span>
          </label>
        </div>
      </div>

      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-3 font-bold" data-i18n="game.dificulty">Difficulty</label>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="difficultyOptions">
          <label class="flex flex-col items-center cursor-pointer group p-4 rounded-lg border-2 border-gray-600 transition-all duration-200 bg-gradient-to-b from-green-900 to-green-700 difficulty-label">
            <input type="radio" name="difficulty" value="easy" data-difficulty="easy" class="hidden">
            <div class="text-3xl mb-2">👶</div>
            <span class="text-green-200 font-bold text-lg">Easy</span>
            <span class="text-xs text-green-100 mt-1" data-i18n="game.dificulty1">Relaxed</span>
          </label>
          <label class="flex flex-col items-center cursor-pointer group p-4 rounded-lg border-2 border-gray-600 transition-all duration-200 bg-gradient-to-b from-yellow-900 to-yellow-700 difficulty-label">
            <input type="radio" name="difficulty" value="medium" checked data-difficulty="medium" class="hidden">
            <div class="text-3xl mb-2">😎</div>
            <span class="text-yellow-200 font-bold text-lg">Medium</span>
            <span class="text-xs text-yellow-100 mt-1" data-i18n="game.dificulty2">Balanced</span>
          </label>
          <label class="flex flex-col items-center cursor-pointer group p-4 rounded-lg border-2 border-gray-600 transition-all duration-200 bg-gradient-to-b from-red-900 to-red-700 difficulty-label">
            <input type="radio" name="difficulty" value="hard" data-difficulty="hard" class="hidden">
            <div class="text-3xl mb-2">😈</div>
            <span class="text-red-200 font-bold text-lg">Hard</span>
            <span class="text-xs text-red-100 mt-1" data-i18n="game.dificulty3">Challenging</span>
          </label>
        </div>
      </div

      <div class="flex gap-4 mt-6">
        <button onclick="window.gameUI.cancelGameOptions()" class="btn btn-gray flex-1" data-i18n="game.cancel">Cancel</button>
        <button onclick="window.gameUI.confirmGameOptions()" class="btn btn-green flex-1" data-i18n="game.accept">Accept</button>
      </div>
    </div>
  `);

	// Apply translations immediately
	applyTranslations();

	// Attach event listeners after modal is created
	setTimeout(() => {
		const backgroundInputs = document.querySelectorAll('input[name="background"]');
		const difficultyInputs = document.querySelectorAll('input[name="difficulty"]');
		const difficultyLabels = document.querySelectorAll('.difficulty-label');

		// Visual feedback for selected difficulty
		function updateDifficultySelection() {
			difficultyLabels.forEach((label) => {
				const input = label.querySelector('input[name="difficulty"]') as HTMLInputElement;
				if (input && input.checked) {
					label.classList.add('ring-4', 'ring-yellow-400', 'border-yellow-400');
				} else {
					label.classList.remove('ring-4', 'ring-yellow-400', 'border-yellow-400');
				}
			});
		}

		// Add click listeners to labels for better UX
		difficultyLabels.forEach((label) => {
			label.addEventListener('click', () => {
				const input = label.querySelector('input[name="difficulty"]') as HTMLInputElement;
				if (input) {
					input.checked = true;
					gameOptions.difficulty = input.value;
					updateDifficultySelection();
					console.log('Difficulty changed to:', input.value);
				}
			});
		});

		backgroundInputs.forEach(input => {
			input.addEventListener('change', (e: any) => {
				gameOptions.background = e.target.value;
				console.log('Background changed to:', e.target.value);
			});
		});

		difficultyInputs.forEach(input => {
			input.addEventListener('change', (e: any) => {
				gameOptions.difficulty = e.target.value;
				updateDifficultySelection();
				console.log('Difficulty changed to:', e.target.value);
			});
		});

		// Initial highlight
		updateDifficultySelection();
	}, 0);
}

function updateGameOption(option: string, value: string) {
	gameOptions = {
		...gameOptions,
		[option]: value
	};
}

function confirmGameOptions() {
	if (!pendingGamePlayers) return;

	const { player1, player2 } = pendingGamePlayers;

	// Start session
	startGameSession({
		player1,
		player2,
		gameType: 'pong',
		isAI: false,
		startTime: Date.now()
	});

	// Setup game end handler
	setupPongGameEndHandler();

	// Hide modal and start game
	hideModal();
	navigate('game');
	initPongGame({
		player1,
		player2,
		isAI: false,
		gameOptions: gameOptions
	});
}

function cancelGameOptions() {
	pendingGamePlayers = null;
	gameOptions = {
		background: 'default',
		difficulty: 'medium'
	};
	hideModal();
	navigate('games');
}
// ===== GAME END HANDLING =====
function setupPongGameEndHandler() {
	setOnGameEnd(async (result) => {
		// Show winner overlay
		showWinnerOverlay(result.winner.name, async () => {
			// Save match after overlay
			const saveResult = await endGameSession(result.player1Score, result.player2Score);
			if (saveResult.success && !saveResult.skipped) {
				console.log('Match saved with ID:', saveResult.matchId);
			}
			else if (saveResult.skipped) {
				console.log('Match not saved: guest vs guest');
			}
			else {
				console.warn('Failed to save match');
			}
			// Navigate back to games
			navigate('games');
		});
	});
}
// ===== DIFFICULTY SELECTION =====
function showDifficultySelect() {
	showModal(`
    <div class="card text-center space-y-4">
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="game.selectDifficulty">Select Difficulty</h2>
      <button onclick="window.gameUI.startPongAI(2)" class="btn btn-green w-full" data-i18n="game.easy">Easy</button>
      <button onclick="window.gameUI.startPongAI(3)" class="btn btn-yellow w-full" data-i18n="game.medium">Medium</button>
      <button onclick="window.gameUI.startPongAI(4)" class="btn btn-red w-full" data-i18n="game.hard">Hard</button>
      <button onclick="window.gameUI.hideModal()" class="btn btn-gray w-full" data-i18n="game.cancel">Cancel</button>
    </div>
  `);
  applyTranslations();
}
// ===== TIC-TAC-TOE =====
function startTicTacToe() {
	showModal(`
		<div class="card text-center space-y-4">
			<h2 class="text-2xl font-bold text-yellow-400" data-i18n="game.ttt">Tic-Tac-Toe</h2>
			<p class="text-gray-400" data-i18n="game.gameMode">Choose game mode</p>
			
			<div class="space-y-2">
				<button onclick="window.gameUI.startTicTacToePvP()" class="btn btn-green w-full" data-i18n="game.playerVSplayer">Player vs Player</button>
				<button onclick="window.gameUI.showTicTacToeDifficulty()" class="btn btn-yellow w-full" data-i18n="game.playerVSAI">Player vs AI</button>
			</div>
			
			<button onclick="window.gameUI.hideModal()" class="btn btn-gray w-full" data-i18n="game.cancel">Cancel</button>
		</div>
	`);
	applyTranslations();
}
async function startTicTacToePvP() {
	hideModal();
	await setupTicTacToe(false);
}
function showTicTacToeDifficulty() {
	showModal(`
		<div class="card text-center space-y-4">
			<h2 class="text-2xl font-bold text-yellow-400" data-i18n="game.selectAIdifficulty">Select AI Difficulty</h2>
			
			<div class="space-y-2">
				<button onclick="window.gameUI.startTicTacToeAI(2)" class="btn btn-green w-full" data-i18n="game.easy">Easy</button>
				<button onclick="window.gameUI.startTicTacToeAI(3)" class="btn btn-yellow w-full" data-i18n="game.medium">Medium</button>
				<button onclick="window.gameUI.startTicTacToeAI(4)" class="btn btn-red w-full" data-i18n="game.hard">Hard</button>
			</div>
			
			<button onclick="window.gameUI.hideModal()" class="btn btn-gray w-full" data-i18n="game.cancel">Cancel</button>
		</div>
	`);
	applyTranslations();
}
async function startTicTacToeAI(difficulty: number) {
	hideModal();
	await setupTicTacToe(true, difficulty);
}
// ===== UTILITY FUNCTIONS =====
function applyTranslations() {
	if (window.languageManager?.isReady()) {
		window.languageManager.applyTranslations();
	}
}
function focusInput(id: string) {
	setTimeout(() => {
		const input = document.getElementById(id) as HTMLInputElement;
		input?.focus();
	}, 100);
}
function focusFirstInput() {
	setTimeout(() => {
		const input = document.querySelector('input:not([disabled])') as HTMLInputElement;
		input?.focus();
	}, 100);
}
// ===== GLOBAL EXPORTS =====
(window as any).gameUI = {
	// Main flows
	startPongPvP,
	startPongAI,
	showDifficultySelect,
	startTicTacToe,
	startTicTacToePvP,
	showTicTacToeDifficulty,
	startTicTacToeAI,
	// Modal controls
	hideModal,
	// Player setup
	showPlayer2VerifyModal,
	loginPlayer2Direct,
	clearPlayer2Verification,
	confirmGuestVsGuest,
	confirmPlayer2Setup,
	backToPlayer2Setup,
	// Game options
	updateGameOption,
	confirmGameOptions,
	cancelGameOptions
};