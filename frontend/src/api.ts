export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
}

/*
export function getHeaders(auth = true): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}*/


export function getHeaders(auth = true): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken() || getCookie('auth_jwt');
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
	credentials: 'include'
  });
  return res.json();
}

export function showResult(id: string, data: any, isError = false): void {
	const el = document.getElementById(id);
	if (!el) return;

	el.classList.remove('hidden', 'success', 'error');
	el.classList.add('result', isError ? 'error' : 'success');

	if (data && typeof data === 'object' && typeof data.error === 'string') {
		el.innerHTML = `<span data-i18n="${data.error}"></span>`;
		window.languageManager?.applyTranslations();
		return;
	}

	if (typeof data === 'string') {
		el.textContent = data;
		return;
	}

	el.textContent = JSON.stringify(data, null, 2);
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}
