// Funciones compartidas entre game.ts y tic-tac-toe.ts

function hideMenu(): void {
  const menu = document.getElementById('menu') as HTMLElement;
  menu.classList.add('hidden');
}

function showCanvas(): void {
  const gameContainer = document.getElementById('gameContainer') as HTMLElement;
  gameContainer.classList.remove('hidden');
}

function hideCanvas(): void {
  const gameContainer = document.getElementById('gameContainer') as HTMLElement;
  gameContainer.classList.add('hidden');
}
