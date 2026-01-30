const API_BASE = '';
// Fallback in-memory storage for private browsing mode
let memoryStorage = {};
// Check if storage is available
function isStorageAvailable(type) {
    try {
        const storage = window[type];
        const test = '__storage_test__';
        storage.setItem(test, test);
        storage.removeItem(test);
        return true;
    }
    catch (e) {
        return false;
    }
}
// Use sessionStorage if available, fallback to memory
const useSessionStorage = isStorageAvailable('sessionStorage');
function getToken() {
    if (useSessionStorage) {
        return sessionStorage.getItem('auth_token');
    }
    return memoryStorage['auth_token'] || null;
}
function setToken(token) {
    if (useSessionStorage) {
        sessionStorage.setItem('auth_token', token);
    }
    else {
        memoryStorage['auth_token'] = token;
    }
}
function clearToken() {
    if (useSessionStorage) {
        sessionStorage.removeItem('auth_token');
    }
    else {
        delete memoryStorage['auth_token'];
    }
}
function removeAuthToken() {
    clearToken();
}
function getHeaders() {
    const headers = {};
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}
async function api(url, options = {}) {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...getHeaders(),
            ...options.headers
        }
    });
    let data = null;
    try {
        data = await response.json();
    }
    catch {
        data = {};
    }
    if (response.status === 401 && data?.error === 'auth.invalidToken') {
        removeAuthToken();
        window.dispatchEvent(new CustomEvent('auth-expired', {
            detail: 'Your session has expired. Please login again.'
        }));
        throw new Error('auth.invalidToken');
    }
    if (!response.ok) {
        throw new Error(data?.error || 'common.requestFailed');
    }
    return data;
}
export { api, getToken, setToken, clearToken, removeAuthToken };
