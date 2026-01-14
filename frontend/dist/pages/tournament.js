export function renderTournament() {
  return `
    <h2 class="text-4xl font-bold text-center text-yellow-400 mb-8">Select Game</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="setupPongGame(false)">
        <div class="text-6xl mb-4">🏓</div>
        <h3 class="text-xl font-bold">Pong - PvP</h3>
        <p class="text-gray-400">Player vs Player</p>
      </div>
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="showDifficulty()">
        <div class="text-6xl mb-4">🤖</div>
        <h3 class="text-xl font-bold">Pong - AI</h3>
        <p class="text-gray-400">Player vs Computer</p>
      </div>
      <div class="card text-center cursor-pointer hover:ring-2 hover:ring-yellow-400" onclick="startTicTacToe()">
        <div class="text-6xl mb-4">⭕</div>
        <h3 class="text-xl font-bold">Tic-Tac-Toe</h3>
        <p class="text-gray-400">2 Players</p>
      </div>
    </div>
  `;
}