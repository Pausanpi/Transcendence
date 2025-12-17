import { initRouter } from './router.js';
import { initAuth } from './auth.js';
import './pong.js';
import './tictactoe.js';
import { LanguageManager } from './i18n.js';
document.addEventListener('DOMContentLoaded', async () => {
    window.languageManager = new LanguageManager();
    await window.languageManager.init();
    initRouter();
    initAuth();
    window.languageManager.applyTranslations();
    window.languageManager.renderLanguageSelector('.container');
});
