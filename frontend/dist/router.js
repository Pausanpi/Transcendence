import { renderHome } from './pages/home.js';
import { renderGames } from './pages/games.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAuth } from './pages/auth.js';
import { renderProfile } from './pages/profile.js';
import { renderGame } from './pages/game.js';
import { renderTournament } from './pages/tournament.js';
import { renderTournamentPage } from './tournamentPage.js';
import { renderGdpr } from './pages/gdpr.js';
import { updateAuthBtn } from './auth.js';
import { renderTwoFAVerify } from './pages/twofaverify.js';
import { renderPlayers } from './pages/players.js';
import { renderFriends } from './pages/friends.js';
import { renderTestPage } from './pages/testpage.js';
const routes = {
    home: renderHome,
    games: renderGames,
    dashboard: renderDashboard,
    auth: renderAuth,
    profile: renderProfile,
    game: renderGame,
    tournament: renderTournament,
    tournament_game: renderTournamentPage,
    gdpr: renderGdpr,
    twofaverify: renderTwoFAVerify,
    players: renderPlayers,
    friends: renderFriends,
    testpage: renderTestPage,
};
let currentPage = 'home';
export function navigate(page) {
    const app = document.getElementById('app');
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
        // Para el torneo:
        if (page === 'tournament_game') {
            renderTournamentPage();
        }
        window.dispatchEvent(new CustomEvent('pagechange', { detail: page }));
    }
}
function updateNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-nav') === currentPage);
    });
}
function renderRoute() {
    window.languageManager.applyTranslations();
}
export function initRouter() {
    document.querySelectorAll('[data-nav]').forEach(el => {
        el.addEventListener('click', () => {
            navigate(el.getAttribute('data-nav'));
        });
    });
    navigate('home');
}
window.navigate = navigate;
window.updateAuthBtn = updateAuthBtn;
