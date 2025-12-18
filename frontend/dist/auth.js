import { api, clearToken, showResult, getHeaders, getCookie } from './api.js';
import { navigate } from './router.js';
export function initAuth() {
    updateAuthBtn();
}
export function updateAuthBtn() {
    const btn = document.getElementById('authBtn');
    if (!btn)
        return;
    const token = getCookie('auth_jwt');
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
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            if (response.status === 504) {
                showResult('loginResult', 'messages.gatewayTimeout', true);
                return;
            }
            const errorData = await response.json();
            showResult('loginResult', errorData.error || 'messages.connectionError', true);
            return;
        }
        const data = await response.json();
        if (data.requires2FA) {
            navigate('twofaverify');
            return;
        }
        if (data.success) {
            if (data.token) {
                document.cookie = `auth_jwt=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
            }
            setTimeout(() => {
                updateAuthBtn();
                navigate('profile');
            }, 100);
            return;
        }
        showResult('loginResult', data.error || 'messages.loginFailed', true);
    }
    catch (error) {
        console.error('Login error:', error);
        showResult('loginResult', 'messages.connectionError', true);
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
        /*
        if (data.token) {
          setToken(data.token);
          updateAuthBtn();
          navigate('home');
        }*/
        if (data.token) {
            document.cookie = `auth_jwt=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
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
    document.cookie = 'auth_jwt=; path=/; max-age=0';
    updateAuthBtn();
    navigate('home');
}
// Global
window.login = login;
window.register = register;
window.logout = logout;
