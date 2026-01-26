import { api, setToken, clearToken, getToken } from './api.js';
import { navigate } from './router.js';
import { clearUserCache } from './gameService.js';
export function initAuth() {
    updateAuthBtn();
    checkOAuthError();
}
export function checkOAuthError() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    if (error === 'oauth_not_configured') {
        showResult('loginResult', 'auth.oauthNotConfigured', true);
        //const newUrl = window.location.pathname;
        //window.history.replaceState({}, document.title, newUrl);
    }
}
export function updateAuthBtn() {
    const btn = document.getElementById('authBtn');
    if (!btn)
        return;
    const token = getToken();
    if (token) {
        btn.textContent = 'Logout';
        btn.onclick = logout;
    }
    else {
        btn.textContent = 'Login';
        btn.onclick = () => navigate('auth');
    }
}
export async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const data = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data.requires2FA) {
            localStorage.setItem('temp_2fa_token', data.tempToken);
            navigate('twofaverify');
            return;
        }
        setToken(data.token);
        updateAuthBtn();
        navigate('profile');
    }
    catch (error) {
        showResult('loginResult', error.message, true);
    }
}
export async function register() {
    const username = document.getElementById('regUsername').value;
    const display_name = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    try {
        const data = await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, display_name, email, password })
        });
        setToken(data.token);
        updateAuthBtn();
        navigate('profile');
        showResult('registerResult', 'messages.registrationSuccess', false);
    }
    catch (error) {
        showResult('registerResult', error.message, true);
    }
}
export function logout() {
    clearToken();
    clearUserCache();
    updateAuthBtn();
    navigate('home');
}
export function showGlobalMessage(message, type = 'error', duration = 2500) {
    let container = document.getElementById('globalMessage');
    if (!container) {
        container = document.createElement('div');
        container.id = 'globalMessage';
        container.className =
            'fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded text-sm shadow-lg transition-opacity';
        document.body.appendChild(container);
    }
    container.className =
        `fixed top-50 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded text-sm shadow-lg ${type === 'error'
            ? 'bg-red-900 text-red-200'
            : 'bg-green-900 text-green-200'}`;
    container.textContent = message;
    container.style.opacity = '1';
    setTimeout(() => {
        container.style.opacity = '0';
        container.style.display = 'none';
    }, duration);
}
function showResult(id, message, isError) {
    const el = document.getElementById(id);
    if (!el)
        return;
    el.classList.remove('hidden', 'success', 'error');
    el.classList.add('result', isError ? 'error' : 'success');
    el.innerHTML = `<span data-i18n="${message}"></span>`;
    window.languageManager?.applyTranslations();
    if (isError) {
        setTimeout(() => {
            el.classList.add('hidden');
        }, 5000);
    }
}
window.login = login;
window.register = register;
window.logout = logout;
window.updateAuthBtn = updateAuthBtn;
window.showGlobalMessage = showGlobalMessage;
