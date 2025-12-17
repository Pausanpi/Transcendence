export function getToken() {
    return localStorage.getItem('token');
}
export function setToken(token) {
    localStorage.setItem('token', token);
}
export function clearToken() {
    localStorage.removeItem('token');
}
export function getHeaders(auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (auth && token)
        headers['Authorization'] = `Bearer ${token}`;
    return headers;
}
export async function api(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { ...getHeaders(), ...options.headers }
    });
    return res.json();
}
export function showResult(id, data, isError = false) {
    const el = document.getElementById(id);
    if (!el)
        return;
    el.classList.remove('hidden', 'success', 'error');
    el.classList.add('result', isError ? 'error' : 'success');
    el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}
