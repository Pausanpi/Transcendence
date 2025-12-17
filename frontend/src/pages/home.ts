export function renderHome(): string {
  return `
    <div class="text-center py-20">
      <h1 class="text-7xl font-extrabold text-yellow-400 mb-8">TRANSCENDENCE</h1>
      <p class="text-xl text-gray-400 mb-12">The ultimate Pong experience</p>
      <div class="flex justify-center gap-4">
        <button onclick="navigate('games')" class="btn btn-yellow px-8 py-4 text-xl">🎮 Play</button>
        <button onclick="navigate('dashboard')" class="btn btn-gray px-8 py-4 text-xl">📊 Dashboard</button>
      </div>
    </div>
  `;
}