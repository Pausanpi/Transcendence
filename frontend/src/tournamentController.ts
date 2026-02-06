import { navigate } from "./router.js";
import type { Player } from "./gameService.js";
import {
  loadTournament,
  saveTournament,
  getCurrentMatch,
  setMatchWinner,
  advanceTournament,
  getChampion
} from "./tournamentEngine.js";

export function startCurrentMatch(): void {
  const tournament = loadTournament();
  if (!tournament) return;

  const match = getCurrentMatch(tournament);
  if (!match) return;

  sessionStorage.setItem("currentMatch", JSON.stringify(match));
  navigate("/game");
}

export function finishMatch(winner: Player): void {
  const tournament = loadTournament();
  if (!tournament) return;

  setMatchWinner(tournament, winner);
  advanceTournament(tournament);
  saveTournament(tournament);

  const champion = getChampion(tournament);
  champion ? showChampion(champion) : navigate("/tournament");
}

function showChampion(player: Player): void {
  alert(`🏆 Tournament Champion: ${player.name}`);
  sessionStorage.removeItem("pongTournament");
  navigate("/");
}