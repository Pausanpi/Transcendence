import { navigate } from './router.js';
import { getCurrentUser } from './gameService.js';
import { createTournament, saveTournament } from "./tournamentEngine.js";
const USERS_TOUR_NUM = 8;
// Store player slot configurations
const playerSlots = new Map();
// Toggle player type between registered and guest
function togglePlayerType(index, type) {
    const guestInput = document.getElementById(`guest-input-${index}`);
    const registeredInput = document.getElementById(`registered-input-${index}`);
    const guestRadio = document.getElementById(`radio-guest-${index}`);
    const registeredRadio = document.getElementById(`radio-registered-${index}`);
    if (type === 'guest') {
        guestInput?.classList.remove('hidden');
        registeredInput?.classList.add('hidden');
        if (guestRadio)
            guestRadio.checked = true;
    }
    else {
        guestInput?.classList.add('hidden');
        registeredInput?.classList.remove('hidden');
        if (registeredRadio)
            registeredRadio.checked = true;
    }
    playerSlots.set(index, { type, value: '' });
}
// Generate HTML for a player slot
function generatePlayerSlotHTML(index, defaultType = 'guest', defaultName = '') {
    const isGuest = defaultType === 'guest';
    return `
    <div class="border border-gray-600 rounded-lg p-3">
      <label class="block text-sm text-gray-400 mb-2">Player ${index + 1}</label>
      
      <!-- Type selector -->
      <div class="flex gap-4 mb-2">
        <label class="flex items-center cursor-pointer">
          <input 
            type="radio" 
            name="type-${index}" 
            id="radio-guest-${index}"
            value="guest" 
            ${isGuest ? 'checked' : ''}
            onchange="window.tournamentUI.togglePlayerType(${index}, 'guest')"
            class="mr-1"
          />
          <span class="text-sm">🎮 Invitado</span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input 
            type="radio" 
            name="type-${index}" 
            id="radio-registered-${index}"
            value="registered"
            ${!isGuest ? 'checked' : ''}
            onchange="window.tournamentUI.togglePlayerType(${index}, 'registered')"
            class="mr-1"
          />
          <span class="text-sm">👤 Registrado</span>
        </label>
      </div>
      
      <!-- Guest input -->
      <div id="guest-input-${index}" ${!isGuest ? 'class="hidden"' : ''}>
        <input
          type="text"
          id="player-guest-${index}"
          placeholder="Nombre del invitado"
          value="${isGuest ? defaultName : ''}"
          class="w-full p-2 rounded bg-gray-700 text-white"
        />
      </div>
      
      <!-- Registered input -->
      <div id="registered-input-${index}" ${isGuest ? 'class="hidden"' : ''}>
        <input
          type="text"
          id="player-registered-${index}"
          placeholder="Nombre de usuario registrado"
          value="${!isGuest ? defaultName : ''}"
          class="w-full p-2 rounded bg-gray-700 text-white"
        />
        <p class="text-xs text-gray-500 mt-1">Ingresa el nombre de usuario exacto</p>
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
}
// ===== TOURNAMENT SETUP =====
export async function setupPongTournament(ai, diff = 3) {
    const currentUser = await getCurrentUser();
    showTournamentSetupModal(currentUser, ai, diff);
}
async function showTournamentSetupModal(currentUser, ai, diff) {
    // Clear previous slots
    playerSlots.clear();
    let html = `
    <div class="card text-center space-y-4 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400">🏆 Tournament Setup</h2>
      <p class="text-sm text-gray-400">${ai ? 'Human players + AI' : 'Human players only'}</p>
      
      <div class="grid grid-cols-2 gap-4 text-left">
  `;
    // Determinar cuántos slots humanos necesitamos
    const endIndex = ai ? USERS_TOUR_NUM - 1 : USERS_TOUR_NUM;
    // Generar todos los slots humanos
    for (let i = 0; i < endIndex; i++) {
        // Si es el primer slot y hay usuario logueado, pre-rellenarlo como registrado
        if (i === 0 && currentUser) {
            html += generatePlayerSlotHTML(i, 'registered', currentUser.username);
            playerSlots.set(i, { type: 'registered', value: currentUser.username });
        }
        else {
            html += generatePlayerSlotHTML(i, 'guest', '');
            playerSlots.set(i, { type: 'guest', value: '' });
        }
    }
    // AI player si aplica
    if (ai) {
        html += `
      <div class="border border-gray-600 rounded-lg p-3">
        <label class="block text-sm text-gray-400 mb-2">Player ${USERS_TOUR_NUM}</label>
        <input
          type="text"
          value="AI (Difficulty ${diff})"
          disabled
          class="w-full p-2 rounded bg-gray-600 cursor-not-allowed text-white"
        />
        <p class="text-xs text-yellow-400 mt-1">🤖 AI Player</p>
      </div>
    `;
    }
    html += `
      </div>
      
      <div id="tournamentSetupStatus" class="text-sm"></div>
      
      <div class="flex gap-4 mt-6">
        <button onclick="window.tournamentUI.hideTournamentModal()" class="btn btn-gray flex-1">Cancel</button>
        <button onclick="window.tournamentUI.confirmTournamentSetup(${ai}, ${diff})" class="btn btn-green flex-1">Start Tournament</button>
      </div>
    </div>
  `;
    showModal(html);
    // Focus primer input apropiado
    setTimeout(() => {
        // Si el primer slot está pre-rellenado con usuario actual, enfocarse en el segundo
        const firstInputId = currentUser ? 'player-guest-1' : 'player-guest-0';
        const firstInput = document.getElementById(firstInputId);
        firstInput?.focus();
    }, 100);
}
async function confirmTournamentSetup(ai, diff) {
    const players = [];
    const statusDiv = document.getElementById('tournamentSetupStatus');
    // Determinar cuántos slots humanos necesitamos
    const endIndex = ai ? USERS_TOUR_NUM - 1 : USERS_TOUR_NUM;
    // Recopilar datos de todos los slots humanos
    for (let i = 0; i < endIndex; i++) {
        const slotConfig = playerSlots.get(i);
        if (!slotConfig) {
            if (statusDiv) {
                statusDiv.innerHTML = `<span class="text-red-400">⚠️ Error: Player slot ${i + 1} not configured</span>`;
            }
            return;
        }
        let playerName;
        let playerId;
        let isGuest;
        if (slotConfig.type === 'guest') {
            const input = document.getElementById(`player-guest-${i}`);
            playerName = input?.value.trim() || '';
            playerId = null;
            isGuest = true;
        }
        else {
            const input = document.getElementById(`player-registered-${i}`);
            playerName = input?.value.trim() || '';
            // En un sistema real, aquí buscarías el ID del usuario por nombre
            // Por ahora, usamos un ID simulado basado en el nombre
            playerId = playerName ? `user_${playerName.toLowerCase().replace(/\s+/g, '_')}` : null;
            isGuest = false;
        }
        if (!playerName) {
            if (statusDiv) {
                statusDiv.innerHTML = `<span class="text-red-400">⚠️ Please enter a name for Player ${i + 1}</span>`;
            }
            return;
        }
        // Check for duplicates
        if (players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
            if (statusDiv) {
                statusDiv.innerHTML = `<span class="text-red-400">⚠️ "${playerName}" is already used. Please use unique names.</span>`;
            }
            return;
        }
        players.push({
            id: playerId,
            name: playerName,
            isGuest: isGuest
        });
    }
    // Add AI player if applicable
    if (ai) {
        players.push({
            name: `AI (Difficulty ${diff})`,
            id: "AI",
            isGuest: false
        });
    }
    // Verify we have exactly 8 players
    if (players.length !== USERS_TOUR_NUM) {
        if (statusDiv) {
            statusDiv.innerHTML = `<span class="text-red-400">⚠️ Need exactly ${USERS_TOUR_NUM} players. Currently have ${players.length}.</span>`;
        }
        return;
    }
    // Create and save tournament
    const tournament = createTournament(players);
    saveTournament(tournament);
    // Hide modal and navigate
    hideModal();
    navigate("tournament_game");
}
function hideTournamentModal() {
    hideModal();
}
// ===== GLOBAL EXPORTS =====
window.tournamentUI = {
    setupPongTournament,
    confirmTournamentSetup,
    hideTournamentModal,
    togglePlayerType
};
/* Version funcional
import { navigate } from './router.js';

import {
    getCurrentUser,
    type Player
} from './gameService.js';

import {
    createTournament,
    saveTournament
} from "./tournamentEngine.js";

const USERS_TOUR_NUM = 8;

// ===== MODAL HELPERS =====

function showModal(html: string): void {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.innerHTML = html;
}

function hideModal(): void {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

// ===== TOURNAMENT SETUP =====

export async function setupPongTournament(ai: boolean, diff = 3): Promise<void> {
  const currentUser = await getCurrentUser();
  
  showTournamentSetupModal(currentUser, ai, diff);
}

async function showTournamentSetupModal(
  currentUser: any,
  ai: boolean,
  diff: number
): Promise<void> {
  
  let html = `
    <div class="card text-center space-y-4 max-w-2xl mx-auto">
      <h2 class="text-2xl font-bold text-yellow-400">🏆 Tournament Setup</h2>
      <p class="text-sm text-gray-400">${ai ? 'Human players + AI' : 'Human players only'}</p>
      
      <div class="grid grid-cols-2 gap-4 text-left">
  `;

  // Player 1 (current user if logged in)
  if (currentUser) {
    html += `
      <div>
        <label class="block text-sm text-gray-400 mb-1">Player 1</label>
        <input
          type="text"
          value="${currentUser.username}"
          disabled
          class="w-full p-3 rounded bg-gray-600 cursor-not-allowed text-white"
        />
        <p class="text-xs text-green-400 mt-1">✓ Logged in</p>
      </div>
    `;
  } else {
    html += `
      <div>
        <label class="block text-sm text-gray-400 mb-1">Player 1</label>
        <input
          type="text"
          id="player0"
          placeholder="Enter name"
          class="w-full p-3 rounded bg-gray-700 text-white"
        />
      </div>
    `;
  }

  // Players 2-7 (or 2-8 if no current user)
  const startIndex = currentUser ? 1 : 1;
  const endIndex = ai ? USERS_TOUR_NUM - 1 : USERS_TOUR_NUM;

  for (let i = startIndex; i < endIndex; i++) {
    html += `
      <div>
        <label class="block text-sm text-gray-400 mb-1">Player ${i + 1}</label>
        <input
          type="text"
          id="player${i}"
          placeholder="Enter name"
          class="w-full p-3 rounded bg-gray-700 text-white"
        />
      </div>
    `;
  }

  // AI player if applicable
  if (ai) {
    html += `
      <div>
        <label class="block text-sm text-gray-400 mb-1">Player ${USERS_TOUR_NUM}</label>
        <input
          type="text"
          value="AI (Difficulty ${diff})"
          disabled
          class="w-full p-3 rounded bg-gray-600 cursor-not-allowed text-white"
        />
        <p class="text-xs text-yellow-400 mt-1">🤖 AI Player</p>
      </div>
    `;
  }

  html += `
      </div>
      
      <div id="tournamentSetupStatus" class="text-sm"></div>
      
      <div class="flex gap-4 mt-6">
        <button onclick="window.tournamentUI.hideTournamentModal()" class="btn btn-gray flex-1">Cancel</button>
        <button onclick="window.tournamentUI.confirmTournamentSetup(${ai}, ${diff})" class="btn btn-green flex-1">Start Tournament</button>
      </div>
    </div>
  `;

  showModal(html);
  
  // Focus first input
  setTimeout(() => {
    const firstInput = document.getElementById(currentUser ? 'player1' : 'player0') as HTMLInputElement;
    firstInput?.focus();
  }, 100);
}

async function confirmTournamentSetup(ai: boolean, diff: number): Promise<void> {
  const currentUser = await getCurrentUser();
  const players: Player[] = [];
  const statusDiv = document.getElementById('tournamentSetupStatus');

  // Add current user if logged in
  if (currentUser) {
    players.push({
      name: currentUser.username,
      id: currentUser.id,
      isGuest: false
    });
  }

  // Collect player names from inputs
  const startIndex = currentUser ? 1 : 0;
  const endIndex = ai ? USERS_TOUR_NUM - 1 : USERS_TOUR_NUM;

  for (let i = startIndex; i < endIndex; i++) {
    const input = document.getElementById(`player${i}`) as HTMLInputElement;
    const name = input?.value.trim();

    if (!name) {
      if (statusDiv) {
        statusDiv.innerHTML = `<span class="text-red-400">⚠️ Please enter a name for Player ${i + 1}</span>`;
      }
      return;
    }

    // Check for duplicates
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      if (statusDiv) {
        statusDiv.innerHTML = `<span class="text-red-400">⚠️ "${name}" is already used. Please use unique names.</span>`;
      }
      return;
    }

    players.push({
      id: null,
      name: name,
      isGuest: true
    });
  }

  // Add AI player if applicable
  if (ai) {
    players.push({
      name: `AI (Difficulty ${diff})`,
      id: "AI",
      isGuest: false
    });
  }

  // Verify we have exactly 8 players
  if (players.length !== USERS_TOUR_NUM) {
    if (statusDiv) {
      statusDiv.innerHTML = `<span class="text-red-400">⚠️ Need exactly ${USERS_TOUR_NUM} players. Currently have ${players.length}.</span>`;
    }
    return;
  }

  // Create and save tournament
  const tournament = createTournament(players);
  saveTournament(tournament);

  // Hide modal and navigate
  hideModal();
  navigate("tournament_game");
}

function hideTournamentModal(): void {
  hideModal();
}

// ===== GLOBAL EXPORTS =====

(window as any).tournamentUI = {
  setupPongTournament,
  confirmTournamentSetup,
  hideTournamentModal
};
*/
/*
function askName(index: number): string | null {
    const name = prompt(`Name for player ${index + 1}`);
    return(name);
}

export async function setupPongTournament(ai: boolean, diff = 3): Promise<void> {
    const currentUser = await getCurrentUser();
    const players: Player[] = [];

    if (currentUser) {
      players.push({
        name: currentUser.username,
        id: currentUser.id,
        isGuest: false
      });
    }

    while (players.length < USERS_TOUR_NUM) {

      if (ai && players.length === USERS_TOUR_NUM - 1) {
        players.push({
          name: `AI (diff ${diff})`,
          id: "AI",
          isGuest: false
        });
        break;
      }

      const name = askName(players.length);

      if (!name || name.trim() === "") {
        alert("Invalid name");
        continue;
      }

      if (players.some(p => p.name === name.trim())) {
        alert("Duplicated name");
        continue;
      }

      players.push({
        id: null,
        name: name.trim(),
        isGuest: true
      });
    }

    const tournament = createTournament(players);
    saveTournament(tournament);

    navigate("tournament_game");
}*/ 
