import { navigate } from '../router.js';
import { getCurrentUser, createRegisteredPlayer, createGuestPlayer, createAIPlayer, startGameSession, endGameSession, loginPlayer } from '../gameService.js';
import { initPongGame, setOnGameEnd, showWinnerOverlay } from '../pong.js';
// ===== PLAYER SETUP STATE =====
let verifiedPlayer2 = null;
// ===== GAME SELECTION PAGE =====
export function renderGames() {
    return `
    <h2 class="text-4xl font-bold text-center text-yellow-400 mb-8">Select Game</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="window.gameUI.startPongPvP()">
        <div class="text-6xl mb-4">🏓</div>
        <h3 class="text-xl font-bold">Pong - PvP</h3>
        <p class="text-gray-400">Player vs Player</p>
      </div>
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="window.gameUI.showDifficultySelect()">
        <div class="text-6xl mb-4">🤖</div>
        <h3 class="text-xl font-bold">Pong - AI</h3>
        <p class="text-gray-400">Player vs Computer</p>
      </div>
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="window.gameUI.startTicTacToe()">
        <div class="text-6xl mb-4">⭕</div>
        <h3 class="text-xl font-bold">Tic-Tac-Toe</h3>
        <p class="text-gray-400">2 Players</p>
      </div>
    </div>
  `;
}
// ===== MODAL HELPERS =====
function showModal(html) {
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
async function startPongAI(difficulty) {
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
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="players.enterNames">Guest vs Guest</h2>
      <p class="text-sm text-gray-400">No players logged in - both will play as guests</p>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="players.player1Keys">Player 1 (W/S keys)</label>
        <input
          type="text"
          value="Guest"
          disabled
          class="w-full p-3 rounded bg-gray-600 cursor-not-allowed text-white"
        />
        <p class="text-xs text-gray-400 mt-1">Playing as guest</p>
      </div>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="players.player2Keys">Player 2 (↑/↓ keys)</label>
        <input
          type="text"
          value="Guest"
          disabled
          class="w-full p-3 rounded bg-gray-600 cursor-not-allowed text-white"
        />
        <p class="text-xs text-gray-400 mt-1">Playing as guest</p>
      </div>
      
      <div class="flex gap-4 mt-6">
        <button onclick="window.gameUI.hideModal()" class="btn btn-gray flex-1" data-i18n="common.cancel">Cancel</button>
        <button onclick="window.gameUI.confirmGuestVsGuest()" class="btn btn-green flex-1" data-i18n="players.startGame">Start Game</button>
      </div>
    </div>
  `);
    applyTranslations();
}
function showPlayer2Setup(currentUser) {
    const player1Name = currentUser.display_name || currentUser.username;
    const player2DisplayName = verifiedPlayer2
        ? (verifiedPlayer2.display_name || verifiedPlayer2.username)
        : 'Guest';
    const verifiedStatus = verifiedPlayer2
        ? `<p class="text-xs text-green-400 mt-1">✓ Verified player</p>`
        : `<p class="text-xs text-gray-400 mt-1">Playing as guest</p>`;
    const verifyButtonHtml = verifiedPlayer2
        ? '<button onclick="window.gameUI.clearPlayer2Verification()" class="btn btn-yellow mt-2" type="button">Change Player 2</button>'
        : '<button onclick="window.gameUI.showPlayer2VerifyModal()" class="btn btn-blue mt-2" type="button">Verify Player 2</button>';
    showModal(`
    <div class="card text-center space-y-4 max-w-md mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="players.enterNames">Player 2 Setup</h2>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="players.player1Keys">Player 1 (W/S keys)</label>
        <input
          type="text"
          value="${player1Name}"
          disabled
          class="w-full p-3 rounded bg-gray-600 cursor-not-allowed text-white"
        />
        <p class="text-xs text-green-400 mt-1">✓ Logged in as ${player1Name}</p>
      </div>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="players.player2Keys">Player 2 (↑/↓ keys)</label>
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
        <button onclick="window.gameUI.hideModal()" class="btn btn-gray flex-1" data-i18n="common.cancel">Cancel</button>
        <button onclick="window.gameUI.confirmPlayer2Setup()" class="btn btn-green flex-1" data-i18n="players.startGame">Start Game</button>
      </div>
    </div>
  `);
    applyTranslations();
}
function showPlayer2VerifyModal() {
    showModal(`
    <div class="card text-center space-y-4 max-w-md mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400">Verify Player 2</h2>
      <p class="text-gray-400">Player 2 must log in to verify their identity</p>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1">Email</label>
        <input
          type="email"
          id="player2Email"
          placeholder="email@example.com"
          class="w-full p-3 rounded bg-gray-700 text-white"
        />
      </div>
      
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1">Password</label>
        <input
          type="password"
          id="player2Password"
          placeholder="Password"
          class="w-full p-3 rounded bg-gray-700 text-white"
        />
      </div>
      
      <div id="loginStatus" class="text-sm"></div>
      
      <div class="flex gap-4 mt-6">
        <button onclick="window.gameUI.backToPlayer2Setup()" class="btn btn-gray flex-1">Back</button>
        <button onclick="window.gameUI.loginPlayer2Direct()" class="btn btn-green flex-1">Login</button>
      </div>
    </div>
  `);
    focusInput('player2Email');
}
async function loginPlayer2Direct() {
    const emailInput = document.getElementById('player2Email');
    const passwordInput = document.getElementById('player2Password');
    const statusDiv = document.getElementById('loginStatus');
    if (!emailInput || !passwordInput || !statusDiv)
        return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
        statusDiv.innerHTML = '<span class="text-red-400">Please enter email and password</span>';
        return;
    }
    statusDiv.innerHTML = '<span class="text-yellow-400">Logging in...</span>';
    const user = await loginPlayer(email, password);
    if (user) {
        verifiedPlayer2 = user;
        statusDiv.innerHTML = '<span class="text-green-400">✓ Player 2 verified!</span>';
        setTimeout(() => {
            backToPlayer2Setup();
        }, 1000);
    }
    else {
        statusDiv.innerHTML = '<span class="text-red-400">✗ Invalid credentials</span>';
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
function startPongWithPlayers(player1, player2) {
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
        isAI: false
    });
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
      <h2 class="text-2xl font-bold text-yellow-400">Select Difficulty</h2>
      <button onclick="window.gameUI.startPongAI(2)" class="btn btn-green w-full">Easy</button>
      <button onclick="window.gameUI.startPongAI(3)" class="btn btn-yellow w-full">Medium</button>
      <button onclick="window.gameUI.startPongAI(4)" class="btn btn-red w-full">Hard</button>
      <button onclick="window.gameUI.hideModal()" class="btn btn-gray w-full">Cancel</button>
    </div>
  `);
}
// ===== TIC-TAC-TOE PLACEHOLDER =====
function startTicTacToe() {
    console.log('Tic-Tac-Toe not implemented yet');
    // TODO: Implement similar flow to Pong
}
// ===== UTILITY FUNCTIONS =====
function applyTranslations() {
    if (window.languageManager?.isReady()) {
        window.languageManager.applyTranslations();
    }
}
function focusInput(id) {
    setTimeout(() => {
        const input = document.getElementById(id);
        input?.focus();
    }, 100);
}
function focusFirstInput() {
    setTimeout(() => {
        const input = document.querySelector('input:not([disabled])');
        input?.focus();
    }, 100);
}
// ===== GLOBAL EXPORTS =====
window.gameUI = {
    // Main flows
    startPongPvP,
    startPongAI,
    showDifficultySelect,
    startTicTacToe,
    // Modal controls
    hideModal,
    // Player setup
    showPlayer2VerifyModal,
    loginPlayer2Direct,
    clearPlayer2Verification,
    confirmGuestVsGuest,
    confirmPlayer2Setup,
    backToPlayer2Setup
};
