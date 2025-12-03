export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
}

export function getHeaders(auth = true): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options.headers }
  });
  return res.json();
}

export function showResult(id: string, data: any, isError = false): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden', 'success', 'error');
  el.classList.add('result', isError ? 'error' : 'success');
  el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}