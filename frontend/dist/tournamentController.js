import { navigate } from "./router.js";
import { loadTournament, saveTournament, getCurrentMatch, setMatchWinner, advanceTournament, getChampion } from "./tournamentEngine.js";
export function startCurrentMatch() {
    const tournament = loadTournament();
    if (!tournament)
        return;
    const match = getCurrentMatch(tournament);
    if (!match)
        return;
    sessionStorage.setItem("currentMatch", JSON.stringify(match));
    navigate("game");
}
export function finishMatch(winner) {
    const tournament = loadTournament();
    if (!tournament)
        return;
    setMatchWinner(tournament, winner);
    advanceTournament(tournament);
    saveTournament(tournament);
    const champion = getChampion(tournament);
    champion ? showChampion(champion) : navigate("tournament_game");
}
function showChampion(player) {
    alert(`🏆 Tournament Champion: ${player.name}`);
    sessionStorage.removeItem("pongTournament");
    navigate("/");
}
