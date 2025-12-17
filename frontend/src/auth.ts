import { api, getToken, setToken, clearToken, showResult, getHeaders } from './api.js';
import { navigate } from './router.js';

export function initAuth(): void {
  updateAuthBtn();
}

export function updateAuthBtn(): void {
  const btn = document.getElementById('authBtn');
  if (!btn) return;
  
  if (getToken()) {
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
      headers: getHeaders(false),
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      setToken(data.token);
      updateAuthBtn();
      navigate('home');
    }
    showResult('loginResult', data, !data.token);
  } catch (e: any) {
    showResult('loginResult', e.message, true);
  }
}

export async function register(): Promise<void> {
  const username = (document.getElementById('regUsername') as HTMLInputElement).value;
  const email = (document.getElementById('regEmail') as HTMLInputElement).value;
  const password = (document.getElementById('regPassword') as HTMLInputElement).value;

  try {
    const data = await api<any>('/api/auth/register', {
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
  } catch (e: any) {
    showResult('registerResult', e.message, true);
  }
}

export function logout(): void {
  clearToken();
  updateAuthBtn();
  navigate('home');
}

// Global
(window as any).login = login;
(window as any).register = register;
(window as any).logout = logout;