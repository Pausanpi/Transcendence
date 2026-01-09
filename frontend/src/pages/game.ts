export function renderGame(): string {
  return `
    <div class="flex flex-col items-center">
      <button onclick="navigate('games')" class="btn btn-gray mb-4">← Back</button>
      <canvas id="gameCanvas" class="border-4 border-gray-700 rounded-xl bg-black"></canvas>
    </div>
  `;
}