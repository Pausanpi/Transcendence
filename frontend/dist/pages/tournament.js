export function renderTournament() {
    return `
    <h2 class="text-4xl font-bold text-center text-yellow-400 mb-8">Tournament</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="setupPongTournament(false)">
        <div class="text-6xl mb-4">🏓</div>
        <h3 class="text-xl font-bold">Pong</h3>
        <p class="text-gray-400">Human Players Only</p>
      </div>
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="setupPongTournament(true)">
        <div class="text-6xl mb-4">🤖</div>
        <h3 class="text-xl font-bold">Pong</h3>
        <p class="text-gray-400">Human Players and Computers</p>
      </div>
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="startTicTacToeTournament()">
        <div class="text-6xl mb-4">⭕</div>
        <h3 class="text-xl font-bold">Tic-Tac-Toe</h3>
        <p class="text-gray-400">Human Players</p>
      </div>
    </div>
  `;
}
