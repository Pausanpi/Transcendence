import axios from 'axios';

class VaultClient {
	constructor() {
		this.vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
		this.vaultToken = process.env.VAULT_TOKEN;
		this.client = axios.create({
			baseURL: this.vaultAddr,
			headers: { 'X-Vault-Token': this.vaultToken },
			timeout: 1000,
		});
	}

	async getSecret(path) {
		try {
			const response = await this.client.get(`/v1/secret/data/${path}`);
			return response.data.data?.data || null;
		} catch (error) {
			return null;
		}
	}

	async setSecret(path, data) {
		try {
			await this.client.post(`/v1/secret/data/${path}`, { data });
			return true;
		} catch (error) {
			return false;
		}
	}
}

export default new VaultClient();
