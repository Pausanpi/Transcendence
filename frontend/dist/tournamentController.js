import { navigate } from "./router.js";
import { loadTournament, saveTournament, getCurrentMatch, setMatchWinner, advanceTournament, getChampion } from "./tournamentEngine.js";
import { startGameSession } from "./gameService.js";
import { initPongGame, setOnGameEnd, showWinnerOverlay } from "./pong.js";
export function startCurrentMatch() {
    const tournament = loadTournament();
    if (!tournament)
        return;
    const match = getCurrentMatch(tournament);
    if (!match)
        return;
    console.log("Starting match:", match.player1.name, "vs", match.player2.name);
    startGameSession({
        player1: match.player1,
        player2: match.player2,
        gameType: 'pong',
        isAI: match.player2.id === "AI",
        difficulty: match.player2.id === "AI" ? 3 : undefined,
        startTime: Date.now(),
        tournamentId: null // opcional: crear ID del torneo
    });
    setOnGameEnd((result) => {
        showWinnerOverlay(result.winner.name, () => {
            // Almacenar el ganador del torneo
            finishMatch(result.winner);
        });
    });
    navigate("game");
    setTimeout(() => {
        initPongGame({
            player1: match.player1,
            player2: match.player2,
            isAI: match.player2.id === "AI",
            difficulty: match.player2.id === "AI" ? 3 : undefined
        });
    }, 100);
}
export function finishMatch(winner) {
    const tournament = loadTournament();
    if (!tournament)
        return;
    setMatchWinner(tournament, winner);
    advanceTournament(tournament);
    saveTournament(tournament);
    const champion = getChampion(tournament);
    if (champion) {
        showChampion(champion);
    }
    else {
        navigate("tournament_game");
    }
}
function showChampion(player) {
    alert(`🏆 Tournament Champion: ${player.name}`);
    sessionStorage.removeItem("pongTournament");
    navigate("home");
}
