import { loadTournament } from "./tournamentEngine.js";
import { startCurrentMatch } from "./tournamentController.js";
export function renderTournamentPage() {
    const tournament = loadTournament();
    if (!tournament)
        return "<p>No tournament found</p>";
    //const app = document.getElementById("app");
    //if (!app) return "<p>FATAL ERROR</p>";
    let html = "<h1>Pong Tournament</h1>";
    tournament.rounds.forEach((round, r) => {
        html += `<h2>Round ${r + 1}</h2>`;
        round.matches.forEach(match => {
            html += `
        <div>
          ${match.player1.name} vs ${match.player2.name}
          ${match.winner ? `➡️ ${match.winner.name}` : ""}
        </div>`;
        });
    });
    html += `<button id="play">Play next match</button>`;
    // Añadir event listener después del render
    setTimeout(() => {
        document.getElementById("play")?.addEventListener("click", startCurrentMatch);
    }, 0);
    return html;
}
