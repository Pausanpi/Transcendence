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
}