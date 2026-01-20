import axios from 'axios';

async function waitForVault(retries = 10, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      await axios.get('http://vault:8200/v1/sys/health');
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Vault not reachable');
}

class VaultService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'http://vault:8200/v1/',
      headers: {
        'X-Vault-Token': 'root',
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  }

  async init() {
    await waitForVault();
  }

  async _request(path, options = {}) {
    const resp = await this.axiosInstance.request({
      url: path,
      method: options.method || 'GET',
      data: options.body ?? undefined,
    });
    return resp.data;
  }

  async getSecret(path) {
    const data = await this._request(`secret/data/${path}`);
    return data?.data?.data ?? null;
  }

  async getJWTSecret() {
    const app = await this.getSecret('jwt/config');
    return app?.jwt_secret ?? null;
  }

  async getSessionSecret() {
    const session = await this.getSecret('session/config');
    return session?.secret ?? null;
  }

  async getOAuthSecret(service) {
    return this.getSecret(`oauth/${service}`);
  }
}

const vaultService = new VaultService();
await vaultService.init();

export default vaultService;
