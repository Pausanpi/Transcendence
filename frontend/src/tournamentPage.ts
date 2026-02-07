import { loadTournament } from "./tournamentEngine.js";
import { startCurrentMatch } from "./tournamentController.js";

// Exponer la función globalmente para onclick
(window as any).startCurrentMatch = startCurrentMatch;

export function renderTournamentPage(): string {
  const tournament = loadTournament();
  if (!tournament) return "<p>No tournament found</p>";

  let html = `
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-center text-yellow-400 mb-8">🏆 Pong Tournament</h1>
  `;

  tournament.rounds.forEach((round, r) => {
    const isCurrentRound = r === tournament.currentRoundIndex;
    html += `
      <div class="mb-8">
        <h2 class="text-2xl font-bold mb-4 ${isCurrentRound ? 'text-yellow-400' : 'text-gray-400'}">
          Round ${r + 1} ${isCurrentRound ? '(Current)' : ''}
        </h2>
        <div class="grid gap-4">
    `;
    
    round.matches.forEach((match, m) => {
      const isCurrentMatch = isCurrentRound && m === tournament.currentMatchIndex;
      const matchStatus = match.winner 
        ? `<span class="text-green-400">✓ Winner: ${match.winner.name}</span>`
        : isCurrentMatch 
          ? `<span class="text-yellow-400">⏳ Next Match</span>`
          : `<span class="text-gray-400">Pending</span>`;
      
      html += `
        <div class="card ${isCurrentMatch ? 'ring-2 ring-yellow-400' : ''}">
          <div class="flex justify-between items-center">
            <div class="flex-1">
              <div class="text-lg">${match.player1.name}</div>
              <div class="text-gray-400 text-sm">vs</div>
              <div class="text-lg">${match.player2.name}</div>
            </div>
            <div class="text-right">
              ${matchStatus}
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });

  html += `
      <div class="text-center mt-8">
        <button onclick="startCurrentMatch()" class="btn btn-green text-xl px-8 py-4">
          ▶️ Play Next Match
        </button>
      </div>
    </div>
  `;
  
  return html;
}

(window as any).renderTournamentPage = renderTournamentPage;