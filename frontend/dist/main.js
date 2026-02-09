import { initRouter } from './router.js';
import { initAuth } from './auth.js';
import './i18n.js';
import './gdpr.js';
import './pong.js';
import './tictactoe.js';
import './gameService.js';
import { showGlobalMessage } from './auth.js';
import { navigate } from './router.js';
document.addEventListener('DOMContentLoaded', async () => {
    initRouter();
    initAuth();
    if (window.languageManager) {
        await window.languageManager.init();
        window.languageManager.applyTranslations();
    }
    setTimeout(() => {
        if (typeof window.updateAuthBtn === 'function') {
            window.updateAuthBtn();
        }
    }, 200);
});
window.addEventListener('auth-expired', (e) => {
    if (typeof showGlobalMessage === 'function') {
        showGlobalMessage(e.detail, 'error');
    }
    setTimeout(() => {
        navigate('auth');
    }, 2500);
});
