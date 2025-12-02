import axios from 'axios';

class VaultClient {
  constructor() {
    this.vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
    this.vaultToken = process.env.VAULT_TOKEN || 'devtoken123';
    this.client = axios.create({
      baseURL: this.vaultAddr,
      headers: {
        'X-Vault-Token': this.vaultToken,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/v1/sys/health');
      return response.status === 200;
    } catch (error) {
      console.warn('Vault health check failed:', error.message);
      return false;
    }
  }

  async getSecret(path) {
    try {
      const response = await this.client.get(`/v1/secret/data/${path}`);
      return response.data.data?.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn(`Secret not found: ${path}`);
      } else {
        console.error(`Error obtaining secret ${path}:`, error.message);
      }
      return null;
    }
  }

  async setSecret(path, data) {
    try {
      await this.client.post(`/v1/secret/data/${path}`, { data });
      return true;
    } catch (error) {
      console.error(`Error saving secret ${path}:`, error.message);
      return false;
    }
  }

  async deleteSecret(path) {
    try {
      await this.client.delete(`/v1/secret/metadata/${path}`);
      return true;
    } catch (error) {
      console.error(`Error deleting secret ${path}:`, error.message);
      return false;
    }
  }
}

export default new VaultClient();