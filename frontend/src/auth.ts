import { api, setToken, clearToken, getToken } from './api.js';
import { navigate } from './router.js';
import { clearUserCache } from './gameService.js';

export function initAuth(): void {
  updateAuthBtn();
}

export function updateAuthBtn(): void {
  const btn = document.getElementById('authBtn');
  if (!btn) return;

  const token = getToken();
  if (token) {
    btn.textContent = 'Logout';
    btn.onclick = logout;
  } else {
    btn.textContent = 'Login';
    btn.onclick = () => navigate('auth');
  }
}

export async function login(): Promise<void> {
  const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
  const password = (document.getElementById('loginPassword') as HTMLInputElement).value;

  try {
    const data = await api<any>('/api/auth/login', {
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
  } catch (error: any) {
    showResult('loginResult', error.message, true);
  }
}

export async function register(): Promise<void> {
  const username = (document.getElementById('regUsername') as HTMLInputElement).value;
  const email = (document.getElementById('regEmail') as HTMLInputElement).value;
  const password = (document.getElementById('regPassword') as HTMLInputElement).value;

  try {
    const data = await api<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    setToken(data.token);
    updateAuthBtn();
    navigate('profile');
    showResult('registerResult', 'messages.registrationSuccess', false);
  } catch (error: any) {
    showResult('registerResult', error.message, true);
  }
}

export function logout(): void {
  clearToken();
  clearUserCache();
  updateAuthBtn();
  navigate('home');
}

function showResult(id: string, message: string, isError: boolean): void {
  const el = document.getElementById(id);
  if (!el) return;

  el.classList.remove('hidden', 'success', 'error');
  el.classList.add('result', isError ? 'error' : 'success');
  el.innerHTML = `<span data-i18n="${message}"></span>`;
  window.languageManager?.applyTranslations();
}

(window as any).login = login;
(window as any).register = register;
(window as any).logout = logout;
(window as any).updateAuthBtn = updateAuthBtn;
