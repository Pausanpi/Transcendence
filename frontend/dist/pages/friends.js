import { api } from '../api.js';
import { isLoggedIn } from '../gameService.js';
import { loadAvatar } from '../imageUtils.js';
let currentTab = 'friends';
export function renderFriends() {
    if (!isLoggedIn()) {
        return `
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-cyan-400 mb-8" data-i18n="friends.title">👫 Friends</h2>
        <div class="card text-center">
          <div class="text-6xl mb-6">🔒</div>
          <p class="text-red-400 text-xl mb-6" data-i18n="auth.authenticationRequired">Authentication required</p>
          <button onclick="navigate('auth')" class="btn btn-blue" data-i18n="auth.login">Login</button>
        </div>
      </div>
    `;
    }
    setTimeout(() => loadTab('friends'), 100);
    return `
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-center text-cyan-400 mb-8" data-i18n="friends.title">👫 Friends</h2>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6">
        <button id="tabFriends" onclick="switchFriendsTab('friends')"
                class="btn btn-blue flex-1" data-i18n="friends.myFriends">
          👥 My Friends
        </button>
        <button id="tabRequests" onclick="switchFriendsTab('requests')"
                class="btn btn-gray flex-1 relative" data-i18n="friends.requests">
          📬 Requests
          <span id="requestsBadge" class="hidden absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"></span>
        </button>
        <button id="tabSent" onclick="switchFriendsTab('sent')"
                class="btn btn-gray flex-1" data-i18n="friends.sent">
          📤 Sent
        </button>
      </div>

      <!-- Content -->
      <div id="friendsContent" class="space-y-4">
        <div class="card animate-pulse">
          <div class="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>

      <!-- Player Profile Modal -->
      <div id="playerModal" class="modal hidden">
        <div class="modal-content card max-w-3xl max-h-[90vh] overflow-y-auto">
          <div id="playerModalContent"></div>
          <div class="flex gap-4 mt-6">
            <button onclick="closePlayerModal()" class="btn btn-gray flex-1" data-i18n="common.close">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
async function loadTab(tab) {
    currentTab = tab;
    updateTabStyles();
    const container = document.getElementById('friendsContent');
    if (!container)
        return;
    container.innerHTML = `
    <div class="card animate-pulse">
      <div class="h-16 bg-gray-700 rounded"></div>
    </div>
  `;
    try {
        if (tab === 'friends') {
            await loadFriends(container);
        }
        else if (tab === 'requests') {
            await loadRequests(container);
        }
        else if (tab === 'sent') {
            await loadSentRequests(container);
        }
    }
    catch (error) {
        console.error('Error loading tab:', error);
        container.innerHTML = `
      <div class="card text-center text-red-400">
        <p data-i18n="friends.loadError">Failed to load. Please try again.</p>
      </div>
    `;
        window.languageManager?.applyTranslations();
    }
    window.languageManager?.applyTranslations();
    await updateRequestsBadge();
}
function updateTabStyles() {
    const tabs = ['Friends', 'Requests', 'Sent'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab${t}`);
        if (btn) {
            if (t.toLowerCase() === currentTab) {
                btn.classList.remove('btn-gray');
                btn.classList.add('btn-blue');
            }
            else {
                btn.classList.remove('btn-blue');
                btn.classList.add('btn-gray');
            }
        }
    });
}
async function loadFriends(container) {
    const response = await api('/api/database/friends/me');
    if (response.success && response.friends && response.friends.length > 0) {
        // Render immediately for speed
        container.innerHTML = response.friends.map(friend => renderFriendCard(friend)).join('');
        window.languageManager?.applyTranslations();
        // Load avatars progressively in background
        response.friends.forEach(async (friend) => {
            try {
                const avatarUrl = await loadAvatar(friend.avatar);
                const imgElement = container.querySelector(`[data-friend-id="${friend.id}"] img`);
                if (imgElement && avatarUrl) {
                    imgElement.src = avatarUrl;
                }
            }
            catch (error) {
                console.error(`Failed to load avatar for friend ${friend.id}:`, error);
            }
        });
    }
    else {
        container.innerHTML = `
      <div class="card text-center">
        <p class="text-gray-400 mb-4" data-i18n="friends.noFriends">You don't have any friends yet.</p>
        <a href="#players" class="btn btn-blue" data-i18n="friends.findPlayers">🔍 Find Players</a>
      </div>
    `;
        window.languageManager?.applyTranslations();
    }
}
async function loadRequests(container) {
    const response = await api('/api/database/friends/me/requests');
    if (response.success && response.requests && response.requests.length > 0) {
        // Render immediately for speed
        container.innerHTML = response.requests.map(request => renderRequestCard(request)).join('');
        window.languageManager?.applyTranslations();
        // Load avatars progressively in background
        response.requests.forEach(async (request) => {
            try {
                const avatarUrl = await loadAvatar(request.avatar);
                const imgElement = container.querySelector(`[data-request-id="${request.id}"] img`);
                if (imgElement && avatarUrl) {
                    imgElement.src = avatarUrl;
                }
            }
            catch (error) {
                console.error(`Failed to load avatar for request ${request.id}:`, error);
            }
        });
    }
    else {
        container.innerHTML = `
      <div class="card text-center text-gray-400">
        <p data-i18n="friends.noRequests">No pending friend requests.</p>
      </div>
    `;
        window.languageManager?.applyTranslations();
    }
}
async function loadSentRequests(container) {
    const response = await api('/api/database/friends/me/sent');
    if (response.success && response.requests && response.requests.length > 0) {
        // Render immediately for speed
        container.innerHTML = response.requests.map(request => renderSentCard(request)).join('');
        window.languageManager?.applyTranslations();
        // Load avatars progressively in background
        response.requests.forEach(async (request) => {
            try {
                const avatarUrl = await loadAvatar(request.avatar);
                const imgElement = container.querySelector(`[data-sent-id="${request.id}"] img`);
                if (imgElement && avatarUrl) {
                    imgElement.src = avatarUrl;
                }
            }
            catch (error) {
                console.error(`Failed to load avatar for sent request ${request.id}:`, error);
            }
        });
    }
    else {
        container.innerHTML = `
      <div class="card text-center text-gray-400">
        <p data-i18n="friends.noSent">No pending sent requests.</p>
      </div>
    `;
        window.languageManager?.applyTranslations();
    }
}
function renderFriendCard(friend) {
    const statusColor = friend.online_status === 'online' ? 'bg-green-400' : 'bg-gray-400';
    const statusTextKey = friend.online_status === 'online' ? 'players.status.online' : 'players.status.offline';
    const statusTextDefault = friend.online_status === 'online' ? 'Online' : 'Offline';
    return `
    <div class="card flex items-center gap-4" data-friend-id="${friend.id}">
      <div class="relative">
        <img class="w-14 h-14 rounded-full border-2 border-gray-600 object-cover"
             src="/default-avatar.png"
             alt="${friend.username}"
             onerror="this.src='/default-avatar.png'" />
        <span class="absolute bottom-0 right-0 w-3 h-3 ${statusColor} rounded-full border-2 border-gray-800"></span>
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-bold text-yellow-400">${friend.username}</h3>
        <p class="text-sm ${friend.online_status === 'online' ? 'text-green-400' : 'text-gray-400'}">
          ● <span data-i18n="${statusTextKey}">${statusTextDefault}</span>
        </p>
      </div>
      <div class="flex gap-2">
        <button onclick="viewPlayer('${friend.friend_user_id}')"
                class="btn btn-blue btn-sm" data-i18n="friends.viewProfile">
          👤 Profile
        </button>
        <button onclick="removeFriend(${friend.id}, '${friend.username}')"
                class="btn btn-red btn-sm" data-i18n="friends.remove">
          ✖
        </button>
      </div>
    </div>
  `;
}
function renderRequestCard(request) {
    return `
    <div class="card flex items-center gap-4" data-request-id="${request.id}">
      <img class="w-14 h-14 rounded-full border-2 border-gray-600 object-cover"
           src="/default-avatar.png"
           alt="${request.username}"
           onerror="this.src='/default-avatar.png'}" />
      <div class="flex-1">
        <h3 class="text-lg font-bold text-yellow-400">${request.username}</h3>
        <p class="text-sm text-gray-400" data-i18n="friends.wantsToBeYourFriend">wants to be your friend</p>
      </div>
      <div class="flex gap-2">
        <button onclick="acceptRequest(${request.id})"
                class="btn btn-green btn-sm" data-i18n="friends.accept">
          ✓ Accept
        </button>
        <button onclick="rejectRequest(${request.id})"
                class="btn btn-red btn-sm" data-i18n="friends.reject">
          ✗ Reject
        </button>
      </div>
    </div>
  `;
}
function renderSentCard(request) {
    return `
    <div class="card flex items-center gap-4" data-sent-id="${request.id}">
      <img class="w-14 h-14 rounded-full border-2 border-gray-600 object-cover"
           src="/default-avatar.png"
           alt="${request.username}"
           onerror="this.src='/default-avatar.png'" />
      <div class="flex-1">
        <h3 class="text-lg font-bold text-yellow-400">${request.username}</h3>
        <p class="text-sm text-gray-400" data-i18n="friends.pendingRequest">Request pending...</p>
      </div>
      <button onclick="cancelRequest(${request.id})"
              class="btn btn-gray btn-sm" data-i18n="friends.cancel">
        ✗ Cancel
      </button>
    </div>
  `;
}
async function updateRequestsBadge() {
    if (!isLoggedIn()) {
        const badge = document.getElementById('requestsBadge');
        if (badge) {
            badge.classList.add('hidden');
        }
        return;
    }
    try {
        const response = await api('/api/database/friends/me/requests');
        const badge = document.getElementById('requestsBadge');
        if (badge && response.success && response.requests) {
            const count = response.requests.length;
            if (count > 0) {
                badge.textContent = count.toString();
                badge.classList.remove('hidden');
            }
            else {
                badge.classList.add('hidden');
            }
        }
    }
    catch (error) {
        console.error('Error updating badge:', error);
    }
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
            const avatarUrl = await loadAvatar(player.avatar);
            content.innerHTML = `
        <!-- Player Header -->
        <div class="text-center mb-6">
          <img class="w-24 h-24 rounded-full border-4 border-yellow-400 mx-auto object-cover"
               src="${avatarUrl}"
               alt="${player.username}"
               onerror="this.src='/default-avatar.png'" />
          <h3 class="text-2xl font-bold text-yellow-400 mt-4">${player.display_name || player.username}</h3>
          <p class="text-gray-400">@${player.username}</p>
          <p class="text-sm ${player.online_status === 'online' ? 'text-green-400' : 'text-gray-400'} mt-1">
            ● <span data-i18n="players.status.${player.online_status}">${player.online_status || 'offline'}</span>
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
            window.languageManager?.applyTranslations();
        }
    }
    catch (error) {
        console.error('Error loading player profile:', error);
        let isAuthError = false;
        if (error && error.message === 'auth.authenticationRequired') {
            isAuthError = true;
        }
        let message = isAuthError
            ? '<p class="text-red-400 text-center" data-i18n="players.authRequired">Authentication required</p>'
            : '<p class="text-red-400 text-center" data-i18n="friends.loadErrorProfile">Failed to load player profile</p>';
        content.innerHTML = message;
        window.languageManager?.applyTranslations();
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
        const resultIcon = match.won ? '🏆' : '💔';
        const resultKey = match.won ? 'players.victory' : 'players.defeat';
        const resultDefault = match.won ? 'Victory' : 'Defeat';
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
                  <span class="font-bold ${match.won ? 'text-green-400' : 'text-red-400'}" data-i18n="${resultKey}">${resultDefault}</span>
                  ${match.tournamentId ? `<span class="text-xs bg-purple-600 px-2 py-0.5 rounded" data-i18n="players.tournament">Tournament</span>` : ''}
                </div>
                <div class="text-sm text-gray-400">
                  <span data-i18n="players.vs">vs</span> <span>${match.opponent.name ? match.opponent.name : '<span data-i18n="players.unknown">Unknown</span>'}</span>
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
async function acceptRequest(requestId) {
    if (!isLoggedIn()) {
        showToast('auth.authenticationRequired', 'error');
        return;
    }
    try {
        const response = await api(`/api/database/friends/${requestId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'accepted' })
        });
        if (response.success) {
            showToast('friends.requestAccepted', 'success');
            loadTab(currentTab);
        }
        else {
            showToast('friends.error', 'error');
        }
    }
    catch (error) {
        console.error('Error accepting request:', error);
        showToast('friends.error', 'error');
    }
}
async function rejectRequest(requestId) {
    if (!isLoggedIn()) {
        showToast('auth.authenticationRequired', 'error');
        return;
    }
    try {
        const response = await api(`/api/database/friends/${requestId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'rejected' })
        });
        if (response.success) {
            showToast('friends.requestRejected', 'success');
            loadTab(currentTab);
        }
        else {
            showToast('friends.error', 'error');
        }
    }
    catch (error) {
        console.error('Error rejecting request:', error);
        showToast('friends.error', 'error');
    }
}
async function cancelRequest(requestId) {
    if (!isLoggedIn()) {
        showToast('auth.authenticationRequired', 'error');
        return;
    }
    try {
        const response = await api(`/api/database/friends/${requestId}`, {
            method: 'DELETE',
            body: JSON.stringify({ _dummy: true })
        });
        if (response.success) {
            showToast('friends.requestCancelled', 'success');
            loadTab(currentTab);
        }
        else {
            showToast('friends.error', 'error');
        }
    }
    catch (error) {
        console.error('Error cancelling request:', error);
        showToast('friends.error', 'error');
    }
}
async function removeFriend(friendshipId, username) {
    if (!isLoggedIn()) {
        showToast('auth.authenticationRequired', 'error');
        return;
    }
    const translated = window.languageManager?.t('friends.confirmRemove');
    const confirmMessage = translated !== null && translated !== undefined
        ? translated.replace('{{username}}', username)
        : `Remove ${username} from friends?`;
    if (!confirm(confirmMessage))
        return;
    try {
        const response = await api(`/api/database/friends/${friendshipId}`, {
            method: 'DELETE',
            body: JSON.stringify({ _dummy: true })
        });
        if (response.success) {
            showToast('friends.friendRemoved', 'success');
            loadTab(currentTab);
        }
        else {
            showToast('friends.error', 'error');
        }
    }
    catch (error) {
        console.error('Error removing friend:', error);
        showToast('friends.error', 'error');
    }
}
function showToast(messageKey, type) {
    const translated = window.languageManager?.t(messageKey);
    const message = translated !== null && translated !== undefined ? translated : messageKey;
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
function switchFriendsTab(tab) {
    if (!isLoggedIn()) {
        showToast('auth.authenticationRequired', 'error');
        return;
    }
    loadTab(tab);
}
window.switchFriendsTab = switchFriendsTab;
window.acceptRequest = acceptRequest;
window.rejectRequest = rejectRequest;
window.cancelRequest = cancelRequest;
window.removeFriend = removeFriend;
window.viewPlayer = viewPlayer;
window.closePlayerModal = closePlayerModal;
