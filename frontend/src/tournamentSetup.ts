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