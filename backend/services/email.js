
class EmailService {
	constructor() {
		this.enabled = process.env.EMAIL_ENABLED === 'true';
	}
	async send2FASetupEmail(email, username) {
		if (!this.enabled) return false;
		return true;
	}
	async sendBackupCodesEmail(email, backupCodes) {
		if (!this.enabled) return false;
		return true;
	}
}

export default new EmailService();
