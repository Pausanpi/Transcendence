import { api } from '../api.js';
export function renderDashboard() {
    setTimeout(checkServices, 100);
    return `
    <h2 class="text-3xl font-bold text-center text-cyan-400 mb-8">📊 Dashboard</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="text-xl font-bold mb-4">Services</h3>
        <div id="services" class="space-y-3"></div>
        <button onclick="checkServices()" class="btn btn-blue mt-4">🔄 Refresh</button>
      </div>
      <div class="card">
        <h3 class="text-xl font-bold mb-4">API Test</h3>
        <input id="apiUrl" placeholder="/api/auth/status" class="input mb-3" />
        <button onclick="testApi()" class="btn btn-green w-full">Send GET</button>
        <pre id="apiResult" class="result mt-3 overflow-auto max-h-60"></pre>
      </div>

	  <div class="card">
	  <button onclick="window.open('https://localhost:8445', '_blank')" class="btn btn-blue mt-4" title="Open Grafana Dashboard">
                        📊 Grafana
                    </button>


<button onclick="window.open('https://localhost:8444', '_blank')"
                            class="btn btn-blue mt-4" title="Open HashiCorp Vault">
                        🔐 Vault
                    </button>
<a target="_blank" href="decode.html" class="btn btn-yellow mt-4">TOOL GEN TOPT</a>
		</div>
    </div>
  `;
}
const services = [
    { name: 'Gateway', url: '/api/gateway/health' },
    { name: 'Auth', url: '/api/auth/health' },
    { name: 'Users', url: '/api/users/health' },
    { name: 'Database', url: '/api/database/health' },
    { name: 'I18n', url: '/api/i18n/health' },
];

export async function checkServices() {
    const container = document.getElementById('services');
    if (!container)
        return;
    container.innerHTML = services.map(s => `
    <div class="flex items-center gap-3">
      <div class="status-dot status-loading" id="dot-${s.name}"></div>
      <span>${s.name}</span>
      <span id="status-${s.name}" class="text-gray-400">...</span>
    </div>
  `).join('');
    for (const s of services) {
        try {
            const data = await api(s.url);
            const status = data.status || data.message || 'UNKNOWN';
            const isOk = status === 'OK' || status === 'ok' || status === 'healthy';
            setStatus(s.name, isOk, status);
        }
        catch (error) {
            const errorMsg = error.message || 'DOWN';
            setStatus(s.name, false, errorMsg);
        }
    }
}
function setStatus(name, ok, text) {
    const dot = document.getElementById(`dot-${name}`);
    const status = document.getElementById(`status-${name}`);
    if (dot)
        dot.className = `status-dot ${ok ? 'status-ok' : 'status-error'}`;
    if (status)
        status.textContent = text;
}
export async function testApi() {
    const url = document.getElementById('apiUrl').value;
    const result = document.getElementById('apiResult');
    if (!result)
        return;
    try {
        const data = await api(url);
        result.textContent = JSON.stringify(data, null, 2);
    }
    catch (e) {
        result.textContent = 'Error: ' + e.message;
    }
}
window.checkServices = checkServices;
window.testApi = testApi;
