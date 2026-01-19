import axios from 'axios';
import https from 'node:https';

class VaultService {
  constructor() {
    this.vaultAddr = 'https://vault:8200';
    this.vaultToken = process.env.VAULT_TOKEN;

    if (!this.vaultToken) throw new Error('VAULT_TOKEN is required');

	this.axiosInstance = axios.create({
	baseURL: this.vaultAddr + '/v1/',
	headers: {
		'X-Vault-Token': this.vaultToken,
		'Content-Type': 'application/json',
	},
	httpsAgent: new https.Agent({ rejectUnauthorized: false }), // ignora certificado autofirmado
	timeout: 5000,
	});

  }

async _request(path, options = {}) {
  try {
    const resp = await this.axiosInstance.request({
      url: path,
      method: options.method || 'GET',
      data: options.body ?? undefined,
    });
    return resp.data;
  } catch (err) {
    if (err.response) {
      throw new Error(`Vault ${err.response.status}: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}


  async getSecret(path) {
    const data = await this._request(`secret/data/${path}`);
    return data?.data?.data ?? null;
  }

  async getJWTSecret() {
    const app = await this.getSecret('app');
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

export default new VaultService();
