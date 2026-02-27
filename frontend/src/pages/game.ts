export function renderGame(): string {
  return `
    <div class="flex flex-col items-center w-full">
      <button onclick="navigate('games')" class="btn btn-gray mb-4">← Back</button>
      <div class="w-full flex justify-center">
        <canvas id="gameCanvas" class="border-4 border-gray-700 rounded-xl bg-black max-w-full"></canvas>
      </div>
    </div>
  `;
}