const API_BASE = '';
function getToken() {
    return localStorage.getItem('auth_token');
}
function setToken(token) {
    localStorage.setItem('auth_token', token);
}
function clearToken() {
    localStorage.removeItem('auth_token');
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
    // 🔴 TOKEN INVÁLIDO / EXPIRADO
    if (response.status === 401 && data?.error === 'auth.invalidToken') {
        removeAuthToken();
        // Evento global para mostrar popup + redirect
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
