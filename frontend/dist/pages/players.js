import { api } from '../api.js';
export function renderPlayers() {
    setTimeout(loadPlayers, 100);
    return `
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-center text-cyan-400 mb-8" data-i18n="players.title">👥 Players</h2>

      <div class="card mb-6">
        <div class="flex gap-4">
          <input id="playerSearch" type="text" placeholder="Search players..."
                 class="input flex-1" data-i18n-placeholder="players.searchPlaceholder" />
          <button onclick="searchPlayers()" class="btn btn-blue" data-i18n="players.search">🔍 Search</button>
        </div>
      </div>

      <div id="playersList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card animate-pulse">
          <div class="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>

      <!-- Player Profile Modal -->
      <div id="playerModal" class="modal hidden">
        <div class="modal-content card max-w-3xl max-h-[90vh] overflow-y-auto">
          <div id="playerModalContent"></div>
          <div class="flex gap-4 mt-6">
            <button id="addFriendBtn" class="btn btn-green flex-1" data-i18n="players.addFriend">
              ➕ Add Friend
            </button>
            <button onclick="closePlayerModal()" class="btn btn-gray flex-1" data-i18n="common.close">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
async function loadPlayers(search = '') {
    const container = document.getElementById('playersList');
    if (!container)
        return;
    try {
        const response = await api(`/api/database/players?search=${encodeURIComponent(search)}&limit=50`);
        if (response.success && response.users.length > 0) {
            container.innerHTML = response.users.map(player => renderPlayerCard(player)).join('');
        }
        else {
            container.innerHTML = `
        <div class="card col-span-2 text-center text-gray-400">
          <p data-i18n="players.noPlayersFound">No players found</p>
        </div>
      `;
        }
        window.languageManager?.applyTranslations();
    }
    catch (error) {
        console.error('Error loading players:', error);
        container.innerHTML = `
      <div class="card col-span-2 text-center text-red-400">
        <p data-i18n="players.loadError">Failed to load players</p>
      </div>
    `;
    }
}
function renderPlayerCard(player) {
    const statusColor = player.online_status === 'online' ? 'text-green-400' : 'text-gray-400';
    const statusDot = player.online_status === 'online' ? 'bg-green-400' : 'bg-gray-400';
    return `
    <div class="card hover:border-yellow-400 cursor-pointer transition-all"
         onclick="viewPlayer('${player.id}')">
      <div class="flex items-center gap-4">
        <div class="relative">
          <img class="w-16 h-16 rounded-full border-2 border-gray-600 object-cover"
               src="${player.avatar || '/avatars/default-avatar.png'}"
               alt="${player.username}"
               onerror="this.src='/avatars/default-avatar.png'" />
          <span class="absolute bottom-0 right-0 w-4 h-4 ${statusDot} rounded-full border-2 border-gray-800"></span>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-yellow-400">${player.display_name || player.username}</h3>
          <p class="text-sm text-gray-400">@${player.username}</p>
          <p class="text-xs ${statusColor} mt-1">● ${player.online_status || 'offline'}</p>
        </div>
      </div>
    </div>
  `;
}
async function viewPlayer(playerId) {
    const modal = document.getElementById('playerModal');
    const content = document.getElementById('playerModalContent');
    if (!modal || !content)
        return;
    // Show loading state
    content.innerHTML = `
    <div class="animate-pulse">
      <div class="h-32 bg-gray-700 rounded mb-4"></div>
      <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
      <div class="h-4 bg-gray-700 rounded w-1/2"></div>
    </div>
  `;
    modal.classList.remove('hidden');
    try {
        const response = await api(`/api/database/players/${playerId}`);
        if (response.success && response.user) {
            const player = response.user;
            content.innerHTML = `
        <!-- Player Header -->
        <div class="text-center mb-6">
          <img class="w-24 h-24 rounded-full border-4 border-yellow-400 mx-auto object-cover"
               src="${player.avatar || '/avatars/default-avatar.png'}"
               alt="${player.username}"
               onerror="this.src='/avatars/default-avatar.png'" />
          <h3 class="text-2xl font-bold text-yellow-400 mt-4">${player.display_name || player.username}</h3>
          <p class="text-gray-400">@${player.username}</p>
          <p class="text-sm ${player.online_status === 'online' ? 'text-green-400' : 'text-gray-400'} mt-1">
            ● ${player.online_status || 'offline'}
          </p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-4 gap-3 mb-6">
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-yellow-400">${player.stats.games_played}</p>
            <p class="text-xs text-gray-400" data-i18n="profile.gamesPlayed">Games</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-green-400">${player.stats.wins}</p>
            <p class="text-xs text-gray-400" data-i18n="profile.wins">Wins</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-red-400">${player.stats.losses}</p>
            <p class="text-xs text-gray-400" data-i18n="profile.losses">Losses</p>
          </div>
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-blue-400">${player.stats.win_rate}%</p>
            <p class="text-xs text-gray-400" data-i18n="profile.winRate">Win%</p>
          </div>
        </div>

        <!-- Match History -->
        <div class="mt-6">
          <h4 class="text-lg font-bold text-cyan-400 mb-3" data-i18n="profile.matchHistory">📜 Match History</h4>
          ${renderMatchHistory(player.match_history)}
        </div>
      `;
            // Store player ID for add friend button
            const addFriendBtn = document.getElementById('addFriendBtn');
            if (addFriendBtn) {
                addFriendBtn.setAttribute('data-player-id', playerId);
                addFriendBtn.onclick = () => addFriend(playerId);
            }
            window.languageManager?.applyTranslations();
        }
    }
    catch (error) {
        console.error('Error loading player profile:', error);
        content.innerHTML = `
      <p class="text-red-400 text-center" data-i18n="players.loadError">Failed to load player profile</p>
    `;
    }
}
function renderMatchHistory(matches) {
    if (matches.length === 0) {
        return `
      <div class="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
        <p data-i18n="profile.noMatchHistory">No matches played yet</p>
      </div>
    `;
    }
    return `
    <div class="space-y-2 max-h-96 overflow-y-auto">
      ${matches.map(match => {
        const resultColor = match.won ? 'bg-green-900/30 border-green-600' : 'bg-red-900/30 border-red-600';
        const resultText = match.won ? 'Victory' : 'Defeat';
        const resultIcon = match.won ? '🏆' : '💔';
        const date = new Date(match.playedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        return `
          <div class="border ${resultColor} rounded-lg p-3 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-lg">${resultIcon}</span>
                  <span class="font-bold ${match.won ? 'text-green-400' : 'text-red-400'}">${resultText}</span>
                  ${match.tournamentId ? '<span class="text-xs bg-purple-600 px-2 py-0.5 rounded">Tournament</span>' : ''}
                </div>
                <div class="text-sm text-gray-400">
                  <span>vs ${match.opponent.name || 'Unknown'}</span>
                  <span class="mx-2">•</span>
                  <span>${date}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold ${match.won ? 'text-green-400' : 'text-red-400'}">
                  ${match.playerScore} - ${match.opponentScore}
                </div>
                ${match.duration ? `<div class="text-xs text-gray-500">${formatDuration(match.duration)}</div>` : ''}
              </div>
            </div>
          </div>
        `;
    }).join('')}
    </div>
  `;
}
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
}
function closePlayerModal() {
    const modal = document.getElementById('playerModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}
async function addFriend(playerId) {
    const btn = document.getElementById('addFriendBtn');
    if (btn) {
        btn.setAttribute('disabled', 'true');
        btn.innerHTML = '⏳ Sending...';
    }
    try {
        // First check if already friends or request pending
        const checkResponse = await api(`/api/database/friends/me/check/${playerId}`);
        if (checkResponse.success && checkResponse.status !== 'none') {
            if (btn) {
                btn.removeAttribute('disabled');
                if (checkResponse.status === 'pending') {
                    btn.innerHTML = '⏳ Request Pending';
                    btn.classList.remove('btn-green');
                    btn.classList.add('btn-gray');
                }
                else if (checkResponse.status === 'accepted') {
                    btn.innerHTML = '✓ Already Friends';
                    btn.classList.remove('btn-green');
                    btn.classList.add('btn-gray');
                }
            }
            return;
        }
        // Send friend request
        const response = await api('/api/database/friends/me/add', {
            method: 'POST',
            body: JSON.stringify({ friend_id: playerId })
        });
        if (response.success) {
            if (btn) {
                btn.innerHTML = '✓ Request Sent!';
                btn.classList.remove('btn-green');
                btn.classList.add('btn-gray');
            }
            showToast('Friend request sent!', 'success');
        }
        else {
            if (btn) {
                btn.removeAttribute('disabled');
                btn.innerHTML = '➕ Add Friend';
            }
            showToast(response.error || 'Failed to send request', 'error');
        }
    }
    catch (error) {
        console.error('Error adding friend:', error);
        if (btn) {
            btn.removeAttribute('disabled');
            btn.innerHTML = '➕ Add Friend';
        }
        showToast('Failed to send friend request', 'error');
    }
}
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
function searchPlayers() {
    const searchInput = document.getElementById('playerSearch');
    if (searchInput) {
        loadPlayers(searchInput.value);
    }
}
window.viewPlayer = viewPlayer;
window.closePlayerModal = closePlayerModal;
window.searchPlayers = searchPlayers;
