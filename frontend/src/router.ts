import { renderHome } from './pages/home.js';
import { renderGames } from './pages/games.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAuth } from './pages/auth.js';
import { renderProfile } from './pages/profile.js';
import { renderGame } from './pages/game.js';

const routes: Record<string, () => string> = {
  home: renderHome,
  games: renderGames,
  dashboard: renderDashboard,
  auth: renderAuth,
  profile: renderProfile,
  game: renderGame,
};

let currentPage = 'home';

export function navigate(page: string): void {
  const app = document.getElementById('app')!;
  const render = routes[page];
  
  if (render) {
    app.innerHTML = render();
    currentPage = page;
    updateNav();
    document.getElementById('navbar')?.classList.remove('hidden');
    
    // Dispatch event for page init
    window.dispatchEvent(new CustomEvent('pagechange', { detail: page }));
  }
}

function updateNav(): void {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-nav') === currentPage);
  });
}

export function initRouter(): void {
  // Nav click handlers
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      navigate(el.getAttribute('data-nav')!);
    });
  });

  // Start at home
  navigate('home');
}

// Make navigate global
(window as any).navigate = navigate;