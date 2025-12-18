import { renderHome } from './pages/home.js';
import { renderGames } from './pages/games.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAuth } from './pages/auth.js';
import { renderProfile } from './pages/profile.js';
import { renderGame } from './pages/game.js';
import { renderGdpr } from './pages/gdpr.js';
import { updateAuthBtn } from './auth.js';
import { renderTwoFAVerify } from './pages/twofaverify.js';

const routes: Record<string, () => string> = {
  home: renderHome,
  games: renderGames,
  dashboard: renderDashboard,
  auth: renderAuth,
  profile: renderProfile,
  game: renderGame,
  gdpr: renderGdpr,
  twofaverify: renderTwoFAVerify,
};

let currentPage = 'home';


export function navigate(page: string): void {
  const app = document.getElementById('app')!;
  const render = routes[page];
  if (render) {
    app.innerHTML = render();

    if (window.languageManager?.isReady()) {
      window.languageManager.applyTranslations();
    }

    currentPage = page;
    updateNav();
    document.getElementById('navbar')?.classList.remove('hidden');

    if (typeof window.updateAuthBtn === 'function') {
      window.updateAuthBtn();
    }

    window.dispatchEvent(new CustomEvent('pagechange', { detail: page }));
  }
}

function updateNav(): void {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-nav') === currentPage);
  });
}



function renderRoute() {
	// pintar HTML
	window.languageManager.applyTranslations();
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
(window as any).updateAuthBtn = updateAuthBtn;
