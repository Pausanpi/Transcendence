import { api } from '../api.js';
let currentTab = 'friends';
export function renderFriends() {
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
    const response = await api('/api/friends/me');
    if (response.success && response.friends && response.friends.length > 0) {
        container.innerHTML = response.friends.map(friend => renderFriendCard(friend)).join('');
    }
    else {
        container.innerHTML = `
      <div class="card text-center">
        <p class="text-gray-400 mb-4" data-i18n="friends.noFriends">You don't have any friends yet.</p>
        <a href="#players" class="btn btn-blue" data-i18n="friends.findPlayers">🔍 Find Players</a>
      </div>
    `;
    }
}
async function loadRequests(container) {
    const response = await api('/api/friends/me/requests');
    if (response.success && response.requests && response.requests.length > 0) {
        container.innerHTML = response.requests.map(request => renderRequestCard(request)).join('');
    }
    else {
        container.innerHTML = `
      <div class="card text-center text-gray-400">
        <p data-i18n="friends.noRequests">No pending friend requests.</p>
      </div>
    `;
    }
}
async function loadSentRequests(container) {
    const response = await api('/api/friends/me/sent');
    if (response.success && response.requests && response.requests.length > 0) {
        container.innerHTML = response.requests.map(request => renderSentCard(request)).join('');
    }
    else {
        container.innerHTML = `
      <div class="card text-center text-gray-400">
        <p data-i18n="friends.noSent">No pending sent requests.</p>
      </div>
    `;
    }
}
function renderFriendCard(friend) {
    const statusColor = friend.online_status === 'online' ? 'bg-green-400' : 'bg-gray-400';
    const statusText = friend.online_status === 'online' ? 'Online' : 'Offline';
    return `
    <div class="card flex items-center gap-4">
      <div class="relative">
        <img class="w-14 h-14 rounded-full border-2 border-gray-600 object-cover" 
             src="${friend.avatar || '/default-avatar.png'}" 
             alt="${friend.username}"
             onerror="this.src='/default-avatar.png'" />
        <span class="absolute bottom-0 right-0 w-3 h-3 ${statusColor} rounded-full border-2 border-gray-800"></span>
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-bold text-yellow-400">${friend.username}</h3>
        <p class="text-sm ${friend.online_status === 'online' ? 'text-green-400' : 'text-gray-400'}">
          ● ${statusText}
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
    <div class="card flex items-center gap-4">
      <img class="w-14 h-14 rounded-full border-2 border-gray-600 object-cover" 
           src="${request.avatar || '/default-avatar.png'}" 
           alt="${request.username}"
           onerror="this.src='/default-avatar.png'" />
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
    <div class="card flex items-center gap-4">
      <img class="w-14 h-14 rounded-full border-2 border-gray-600 object-cover" 
           src="${request.avatar || '/default-avatar.png'}" 
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
    try {
        const response = await api('/api/friends/me/requests');
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
async function acceptRequest(requestId) {
    try {
        const response = await api(`/api/friends/${requestId}`, {
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
    try {
        const response = await api(`/api/friends/${requestId}`, {
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
    try {
        const response = await api(`/api/friends/${requestId}`, {
            method: 'DELETE'
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
    if (!confirm(`Remove ${username} from friends?`))
        return;
    try {
        const response = await api(`/api/friends/${friendshipId}`, {
            method: 'DELETE'
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
    const message = window.languageManager?.t(messageKey) || messageKey;
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
function switchFriendsTab(tab) {
    loadTab(tab);
}
window.switchFriendsTab = switchFriendsTab;
window.acceptRequest = acceptRequest;
window.rejectRequest = rejectRequest;
window.cancelRequest = cancelRequest;
window.removeFriend = removeFriend;