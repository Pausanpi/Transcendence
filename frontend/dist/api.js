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
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}
async function api(url, options = {}) {
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
function removeAuthToken() {
    clearToken();
}
export { api, getToken, setToken, clearToken, removeAuthToken };
