import { api, getToken, setToken, clearToken, showResult, getHeaders } from './api.js';
import { navigate } from './router.js';
export function initAuth() {
    updateAuthBtn();
}
export function updateAuthBtn() {
    const btn = document.getElementById('authBtn');
    if (!btn)
        return;
    if (getToken()) {
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
        const data = await api('/auth/login', {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            setToken(data.token);
            updateAuthBtn();
            navigate('home');
        }
        showResult('loginResult', data, !data.token);
    }
    catch (e) {
        showResult('loginResult', e.message, true);
    }
}
export async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    try {
        const data = await api('/auth/register', {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({ username, email, password })
        });
        if (data.token) {
            setToken(data.token);
            updateAuthBtn();
            navigate('home');
        }
        showResult('registerResult', data, !data.token);
    }
    catch (e) {
        showResult('registerResult', e.message, true);
    }
}
export function logout() {
    clearToken();
    updateAuthBtn();
    navigate('home');
}
// Global
window.login = login;
window.register = register;
window.logout = logout;
