import { navigate } from "./router.js";
import { loadTournament, saveTournament, getCurrentMatch, setMatchWinner, advanceTournament, getChampion, saveTournamentMatch, updateTournamentRound, completeTournamentInDB } from "./tournamentEngine.js";
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
        tournamentId: tournament.tournamentId || null
    });
    setOnGameEnd((result) => {
        showWinnerOverlay(result.winner.name, () => {
            // Guardar resultado y avanzar torneo
            finishMatch(result.winner, result.player1Score, result.player2Score);
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
export async function finishMatch(winner, player1Score, player2Score) {
    const tournament = loadTournament();
    if (!tournament)
        return;
    const match = getCurrentMatch(tournament);
    if (!match)
        return;
    // Guardar partida en la base de datos si hay tournamentId y al menos un jugador registrado
    if (tournament.tournamentId) {
        // Calcular duración de la partida desde la sesión de juego
        const session = await import('./gameService.js').then(m => m.getGameSession());
        const matchDuration = session
            ? Math.floor((Date.now() - session.startTime) / 1000)
            : null;
        await saveTournamentMatch(tournament.tournamentId, match.player1, match.player2, player1Score, player2Score, winner, matchDuration || undefined);
    }
    // Actualizar el torneo localmente
    setMatchWinner(tournament, winner);
    const previousRound = tournament.currentRoundIndex;
    advanceTournament(tournament);
    saveTournament(tournament);
    // Actualizar ronda en BD si cambió
    if (tournament.tournamentId && tournament.currentRoundIndex !== previousRound) {
        await updateTournamentRound(tournament.tournamentId, tournament.currentRoundIndex);
    }
    // Verificar si hay un campeón
    const champion = getChampion(tournament);
    if (champion) {
        // Completar torneo en BD
        if (tournament.tournamentId) {
            await completeTournamentInDB(tournament.tournamentId, champion, tournament.currentRoundIndex);
        }
        showChampion(champion);
    }
    else {
        navigate("tournament_game");
    }
}
function showChampionOverlay(championName, onComplete) {
    const el = document.getElementById('countdown');
    const txt = document.getElementById('countdownText');
    if (!el || !txt) {
        onComplete();
        return;
    }
    el.classList.remove('hidden');
    txt.innerHTML = `<div class="text-6xl font-bold text-yellow-400 mb-4">🏆 ${championName}</div><div class="text-4xl font-semibold text-yellow-300">Tournament Champion!</div>`;
    setTimeout(() => {
        el.classList.add('hidden');
        txt.className = 'text-9xl font-extrabold text-yellow-300';
        txt.innerHTML = '';
        onComplete();
    }, 4000);
}
function showChampion(player) {
    showChampionOverlay(player.name, () => {
        sessionStorage.removeItem("pongTournament");
        navigate("home");
    });
}
