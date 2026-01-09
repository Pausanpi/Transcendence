const API_BASE = '';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

function clearToken(): void {
  localStorage.removeItem('auth_token');
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'common.requestFailed');
  }

  return response.json();
}

function removeAuthToken(): void {
  clearToken();
}

export { api, getToken, setToken, clearToken, removeAuthToken };
