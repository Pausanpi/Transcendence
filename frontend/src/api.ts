const API_BASE = '';

// Fallback in-memory storage for private browsing mode
let memoryStorage: { [key: string]: string } = {};

// Check if storage is available
function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Use sessionStorage if available, fallback to memory
const useSessionStorage = isStorageAvailable('sessionStorage');

function getToken(): string | null {
  if (useSessionStorage) {
    return sessionStorage.getItem('auth_token');
  }
  return memoryStorage['auth_token'] || null;
}

function setToken(token: string): void {
  if (useSessionStorage) {
    sessionStorage.setItem('auth_token', token);
  } else {
    memoryStorage['auth_token'] = token;
  }
}

function clearToken(): void {
  if (useSessionStorage) {
    sessionStorage.removeItem('auth_token');
  } else {
    delete memoryStorage['auth_token'];
  }
}

function removeAuthToken(): void {
  clearToken();
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {};

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...getHeaders(),
      ...options.headers
    }
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401 && data?.error === 'auth.invalidToken') {
    removeAuthToken();

    window.dispatchEvent(
      new CustomEvent('auth-expired', {
        detail: 'Your session has expired. Please login again.'
      })
    );

    throw new Error('auth.invalidToken');
  }

  if (!response.ok) {
    throw new Error(data?.error || 'common.requestFailed');
  }

  return data as T;
}

export { api, getToken, setToken, clearToken, removeAuthToken };