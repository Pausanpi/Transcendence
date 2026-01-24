import { getCurrentUser } from '../gameService.js';
import { api } from '../api.js';
export function renderTestPage() {
    setTimeout(initTestPage, 100);
    return `
    <div class="max-w-2xl mx-auto mt-10 text-center space-y-6">
      <h2 class="text-3xl font-bold text-cyan-400 mb-8">Test Page</h2>
      <div class="card">
        <h3 class="text-xl font-bold mb-4" data-i18n="test.playGame">Test Game Setup</h3>
        <p class="text-gray-400 mb-6" data-i18n="test.playDescription">Test the player verification system</p>
        <button id="playTestBtn" class="btn btn-yellow px-8 py-4 text-xl" data-i18n="test.play">🎮 Play</button>
      </div>
    </div>
  `;
}
async function initTestPage() {
    document.getElementById('playTestBtn')?.addEventListener('click', startTestGame);
    if (window.languageManager?.isReady()) {
        window.languageManager.applyTranslations();
    }
}
async function startTestGame() {
    const currentUser = await getCurrentUser();
    showPlayerSetupModalTest(currentUser);
}
async function showPlayerSetupModalTest(currentUser) {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    const player1Default = currentUser ? currentUser.displayName || currentUser.username : '';
    const player1Disabled = currentUser ? 'disabled' : '';
    const player1Class = currentUser ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700';
    modal.innerHTML = `
    <div class="card text-center space-y-4 max-w-md mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="players.enterNames">Enter Player Names</h2>
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="players.player1Keys">Player 1 (W/S keys)</label>
        <input
          type="text"
          id="player1Name"
          value="${player1Default}"
          placeholder="Enter name..."
          ${player1Disabled}
          class="w-full p-3 rounded ${player1Class} text-white"
          maxlength="20"
        />
    ${currentUser ? `<p class="text-xs text-green-400 mt-1">✓ ${window.languageManager?.t('players.loggedInAs') || 'Logged in as'} ${player1Default}</p>` : `<p class="text-xs text-gray-500 mt-1">${window.languageManager?.t('players.guestPlaying') || 'Playing as guest'}</p>`}
      </div>
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="players.player2Keys">Player 2 (↑/↓ keys)</label>
        <input
          type="text"
          id="player2Name"
          placeholder="Enter name..."
          class="w-full p-3 rounded bg-gray-700 text-white"
          maxlength="20"
        />
        <div id="player2Status" class="mt-1 text-xs"></div>
      </div>
      <div class="flex gap-4 mt-6">
        <button onclick="hideModal()" class="btn btn-gray flex-1" data-i18n="common.cancel">Cancel</button>
        <button id="verifyPlayer2Btn" class="btn btn-blue flex-1" data-i18n="test.verifyPlayer">Verify Player 2</button>
      </div>
    </div>
  `;
    if (window.languageManager?.isReady()) {
        window.languageManager.applyTranslations();
    }
    document.getElementById('verifyPlayer2Btn').addEventListener('click', () => verifyPlayer2Test(currentUser));
    const player2Input = document.getElementById('player2Name');
    player2Input.addEventListener('input', () => {
        const statusDiv = document.getElementById('player2Status');
        if (statusDiv) {
            statusDiv.innerHTML = '';
            statusDiv.className = 'mt-1 text-xs';
        }
    });
    setTimeout(() => {
        const input = currentUser
            ? document.getElementById('player2Name')
            : document.getElementById('player1Name');
        input?.focus();
    }, 100);
}
async function verifyPlayer2Test(currentUser) {
    const player2Name = document.getElementById('player2Name').value.trim();
    const statusDiv = document.getElementById('player2Status');
    if (!player2Name) {
        if (statusDiv) {
            statusDiv.innerHTML = window.languageManager?.t('test.enterPlayerName') || 'Please enter a player name';
            statusDiv.className = 'mt-1 text-xs text-red-400';
        }
        return;
    }
    if (statusDiv) {
        statusDiv.innerHTML = window.languageManager?.t('test.checkingPlayer') || 'Checking player...';
        statusDiv.className = 'mt-1 text-xs text-yellow-400';
    }
    try {
        const playersResponse = await api(`/api/database/players?search=${encodeURIComponent(player2Name)}&limit=10`);
        if (playersResponse.success && playersResponse.users) {
            const player = playersResponse.users.find((u) => u.username === player2Name || u.display_name === player2Name);
            if (player) {
                showLoginModalTest(player, currentUser);
                return;
            }
        }
        if (statusDiv) {
            statusDiv.innerHTML = `<span class="text-red-400">✗ ${window.languageManager?.t('test.playerNotRegistered') || 'Player not registered'}</span>`;
            statusDiv.className = 'mt-1 text-xs';
        }
    }
    catch (error) {
        console.error('Error checking player:', error);
        if (statusDiv) {
            statusDiv.innerHTML = window.languageManager?.t('test.checkError') || 'Error checking player';
            statusDiv.className = 'mt-1 text-xs text-red-400';
        }
    }
}
function showLoginModalTest(player, currentUser) {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    modal.innerHTML = `
    <div class="card text-center space-y-4 max-w-md mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="test.verifyCredentials">Verify Player 2 Credentials</h2>
      <p class="text-gray-400" data-i18n="test.verifyCredentialsDesc">Please enter credentials for <span class="font-bold">${player.display_name || player.username}</span></p>

      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="auth.email">Email</label>
        <input
          type="email"
          id="player2Email"
          placeholder="email@example.com"
          class="w-full p-3 rounded bg-gray-700 text-white"
        />
      </div>

      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="auth.password">Password</label>
        <input
          type="password"
          id="player2Password"
          placeholder="Password"
          class="w-full p-3 rounded bg-gray-700 text-white"
        />
      </div>

      <div id="loginStatus" class="text-sm"></div>

      <div class="flex gap-4 mt-6">
        <button onclick="backToNamesModal()" class="btn btn-gray flex-1" data-i18n="common.back">Back</button>
        <button id="loginPlayer2Btn" class="btn btn-green flex-1" data-i18n="auth.login">Login</button>
      </div>
    </div>
  `;
    if (window.languageManager?.isReady()) {
        window.languageManager.applyTranslations();
    }
    document.getElementById('loginPlayer2Btn').addEventListener('click', () => loginPlayer2Test(player, currentUser));
    setTimeout(() => {
        document.getElementById('player2Email')?.focus();
    }, 100);
}
async function loginPlayer2Test(player, currentUser) {
    const email = document.getElementById('player2Email').value.trim();
    const password = document.getElementById('player2Password').value;
    const statusDiv = document.getElementById('loginStatus');
    if (!email || !password) {
        if (statusDiv) {
            statusDiv.innerHTML = window.languageManager?.t('test.enterCredentials') || 'Please enter email and password';
            statusDiv.className = 'text-red-400';
        }
        return;
    }
    if (statusDiv) {
        statusDiv.innerHTML = window.languageManager?.t('test.verifying') || 'Verifying...';
        statusDiv.className = 'text-yellow-400';
    }
    try {
        const loginResponse = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (loginResponse.success && !loginResponse.requires2FA) {
            showPlayer2Verified(player, currentUser);
        }
        else {
            if (statusDiv) {
                statusDiv.innerHTML = window.languageManager?.t('test.invalidCredentials') || 'Invalid credentials';
                statusDiv.className = 'text-red-400';
            }
        }
    }
    catch (error) {
        console.error('Login error:', error);
        if (statusDiv) {
            statusDiv.innerHTML = window.languageManager?.t('test.invalidCredentials') || 'Invalid credentials';
            statusDiv.className = 'text-red-400';
        }
    }
}
function showPlayer2Verified(player, currentUser) {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    const player1Default = currentUser ? currentUser.displayName || currentUser.username : '';
    const player1Disabled = currentUser ? 'disabled' : '';
    const player1Class = currentUser ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700';
    modal.innerHTML = `
    <div class="card text-center space-y-4 max-w-md mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400" data-i18n="players.enterNames">Enter Player Names</h2>
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="players.player1Keys">Player 1 (W/S keys)</label>
        <input
          type="text"
          id="player1Name"
          value="${player1Default}"
          placeholder="Enter name..."
          ${player1Disabled}
          class="w-full p-3 rounded ${player1Class} text-white"
          maxlength="20"
        />
    ${currentUser ? `<p class="text-xs text-green-400 mt-1">✓ ${window.languageManager?.t('players.loggedInAs') || 'Logged in as'} ${player1Default}</p>` : `<p class="text-xs text-gray-500 mt-1">${window.languageManager?.t('players.guestPlaying') || 'Playing as guest'}</p>`}
      </div>
      <div class="text-left">
        <label class="block text-sm text-gray-400 mb-1" data-i18n="players.player2Keys">Player 2 (↑/↓ keys)</label>
        <input
          type="text"
          id="player2NameVerified"
          value="${player.display_name || player.username}"
          class="w-full p-3 rounded bg-green-900 text-green-100 border border-green-600"
          readonly
        />
        <div class="mt-1 text-xs text-green-400">✓ ${window.languageManager?.t('test.playerVerified') || 'Player verified'}</div>
      </div>
      <div class="flex gap-4 mt-6">
        <button onclick="hideModal()" class="btn btn-gray flex-1" data-i18n="common.cancel">Cancel</button>
        <button onclick="startVerifiedGame()" class="btn btn-green flex-1" data-i18n="players.startGame">Start Game</button>
      </div>
    </div>
  `;
    if (window.languageManager?.isReady()) {
        window.languageManager.applyTranslations();
    }
    window.startVerifiedGame = () => startVerifiedGameTest(player, currentUser);
}
async function startVerifiedGameTest(player2, currentUser) {
    hideModal();
    alert(`${window.languageManager?.t('test.gameStarting') || 'Game starting with'} ${currentUser?.displayName || 'Player 1'} vs ${player2.display_name || player2.username}`);
}
function backToNamesModal() {
    const currentUser = getCurrentUser();
    showPlayerSetupModalTest(currentUser);
}
function hideModal() {
    document.getElementById('modal').classList.add('hidden');
}
window.hideModal = hideModal;
window.backToNamesModal = backToNamesModal;
