export class TwoFAManager {
	constructor() {
		this.status = false;
		this.currentBackupCodes = [];
		this.init();
	}


	async init() {
		await this.load2FAStatus();
		this.attachEventListeners();
		this.hideSetupModal();
		this.hideDisableModal();
	}

	attachEventListeners() {
		document.getElementById('enable2FABtn')?.addEventListener('click', () => this.setup2FA());
		document.getElementById('disable2FABtn')?.addEventListener('click', () => this.showDisableModal());
		document.getElementById('generateBackupCodesBtn')?.addEventListener('click', () => this.generateBackupCodes());
		document.getElementById('verifyCodeBtn')?.addEventListener('click', () => this.verify2FA());
		document.getElementById('refreshQRBtn')?.addEventListener('click', () => this.refreshQR());
		document.getElementById('confirmDisableBtn')?.addEventListener('click', () => this.disable2FA());
		document.getElementById('cancelSetupBtn')?.addEventListener('click', () => this.hideSetupModal());
		document.getElementById('cancelDisableBtn')?.addEventListener('click', () => this.hideDisableModal());
		document.getElementById('copyAllCodesBtn')?.addEventListener('click', () => this.copyBackupCodes(this.currentBackupCodes));
		document.getElementById('downloadCodesBtn')?.addEventListener('click', () => this.downloadBackupCodes(this.currentBackupCodes));
		document.getElementById('closeBackupCodesBtn')?.addEventListener('click', () => this.hideBackupCodesModal());
		document.getElementById('verificationCode')?.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') this.verify2FA();
		});
		document.getElementById('disableVerificationCode')?.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') this.disable2FA();
		});
	}

	async load2FAStatus() {
		try {
			const response = await fetch('/auth/profile-data', {
				credentials: 'include'
			});

			if (response.ok) {
				const userData = await response.json();
				this.status = Boolean(userData.twoFactorEnabled);
				this.updateUI();
			} else {
				console.error('Failed to load profile data:', response.status);
				this.showError('Error loading 2FA status');
			}
		} catch (error) {
			console.error('Error loading 2FA status:', error);
			this.showError('Connection error');
		}
	}

	updateUI() {
		const statusValue = document.getElementById('statusValue');
		const enableSection = document.getElementById('enableSection');
		const disableSection = document.getElementById('disableSection');

		if (statusValue) {
			const enabledText = window.languageManager?.getTranslation('common.enabled') || 'Enabled';
			const disabledText = window.languageManager?.getTranslation('common.disabled') || 'Disabled';
			statusValue.textContent = this.status ? enabledText : disabledText;
			statusValue.className = this.status ? 'status-enabled' : 'status-disabled';
		}

		if (enableSection) {
			enableSection.style.display = this.status ? 'none' : 'flex';
		}

		if (disableSection) {
			disableSection.style.display = this.status ? 'flex' : 'none';
		}
	}

	async setup2FA() {
		try {
			const response = await fetch('/2fa/setup', {
				method: 'POST',
				credentials: 'include'
			});
			const result = await response.json();
			if (result.success) {
				this.showSetupModal(result.secret, result.qrCode);
			} else {
				this.showError(result.error || 'Failed to setup 2FA');
			}
		} catch (error) {
			console.error('Error setting up 2FA:', error);
			this.showError('Connection error');
		}
	}

	showSetupModal(secret, qrCode) {
		document.getElementById('secretText').textContent = secret;
		const qrImage = document.getElementById('qrCodeImage');
		if (qrCode) {
			qrImage.src = qrCode;
			qrImage.style.display = 'block';
		} else {
			qrImage.style.display = 'none';
		}
		qrImage.alt = 'QR Code for 2FA Setup';
		document.getElementById('setupModal').style.display = 'flex';
		document.getElementById('verificationCode').value = '';
		document.getElementById('verificationCode').focus();
	}

	hideSetupModal() {
		document.getElementById('setupModal').style.display = 'none';
	}

	async verify2FA() {
		const code = document.getElementById('verificationCode').value.trim();
		if (!/^\d{6}$/.test(code)) {
			this.showError('Please enter a valid 6-digit code');
			return;
		}

		try {
			const response = await fetch('/2fa/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ token: code })
			});
			const result = await response.json();
			if (result.success) {
				this.showSuccess('2FA enabled successfully!');
				this.hideSetupModal();
				this.status = true;
				this.updateUI();
				if (result.backupCodes && result.backupCodes.length > 0) {
					this.currentBackupCodes = result.backupCodes;
					setTimeout(() => {
						this.showBackupCodesModal(result.backupCodes);
					}, 500);
				}
			} else {
				this.showError(result.error || 'Invalid verification code');
			}
		} catch (error) {
			console.error('Error verifying 2FA:', error);
			this.showError('Connection error');
		}
	}

	async refreshQR() {
		try {
			const response = await fetch('/2fa/refresh-qr', {
				method: 'POST',
				credentials: 'include'
			});
			const result = await response.json();
			if (result.success) {
				document.getElementById('secretText').textContent = result.secret;
				const qrImage = document.getElementById('qrCodeImage');
				if (result.qrCode) {
					qrImage.src = result.qrCode;
					qrImage.style.display = 'block';
				}
				document.getElementById('verificationCode').value = '';
				document.getElementById('verificationCode').focus();
				this.showSuccess('QR code refreshed');
			} else {
				this.showError(result.error || 'Failed to refresh QR code');
			}
		} catch (error) {
			console.error('Error refreshing QR:', error);
			this.showError('Connection error');
		}
	}

	showDisableModal() {
		document.getElementById('disableModal').style.display = 'flex';
		document.getElementById('disableVerificationCode').value = '';
		document.getElementById('disableVerificationCode').focus();
	}

	hideDisableModal() {
		document.getElementById('disableModal').style.display = 'none';
	}

	async disable2FA() {
		const code = document.getElementById('disableVerificationCode').value.trim();
		if (!/^\d{6}$/.test(code)) {
			this.showError('Please enter a valid 6-digit code');
			return;
		}

		try {
			const response = await fetch('/2fa/disable', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ token: code })
			});
			const result = await response.json();
			if (result.success) {
				this.showSuccess('2FA disabled successfully');
				this.hideDisableModal();
				this.status = false;
				this.updateUI();
			} else {
				this.showError(result.error || 'Invalid verification code');
			}
		} catch (error) {
			console.error('Error disabling 2FA:', error);
			this.showError('Connection error');
		}
	}

	async generateBackupCodes() {
		try {
			const response = await fetch('/2fa/backup-codes/generate', {
				method: 'POST',
				credentials: 'include'
			});
			const result = await response.json();
			if (result.success) {
				this.currentBackupCodes = result.codes;
				this.showBackupCodesModal(result.codes);
				this.showSuccess('New backup codes generated successfully');
			} else {
				this.showError(result.error || 'Failed to generate backup codes');
			}
		} catch (error) {
			console.error('Error generating backup codes:', error);
			this.showError('Connection error');
		}
	}

	showBackupCodesModal(codes) {
		const codesList = document.getElementById('backupCodesList');
		const modal = document.getElementById('backupCodesModal');
		if (codesList && modal) {
			this.currentBackupCodes = codes;
			codesList.innerHTML = codes.map(code =>
				`<div class="backup-code-item">${code}</div>`
			).join('');
			modal.style.display = 'flex';
		}
	}

	hideBackupCodesModal() {
		document.getElementById('backupCodesModal').style.display = 'none';
	}

	copyBackupCodes(codes) {
		const codesText = codes.join('\n');
		navigator.clipboard.writeText(codesText).then(() => {
			const copyBtn = document.getElementById('copyAllCodesBtn');
			if (copyBtn) {
				const originalText = copyBtn.textContent;
				copyBtn.textContent = '✓ Copied!';
				copyBtn.style.backgroundColor = '#28a745';
				setTimeout(() => {
					copyBtn.textContent = originalText;
					copyBtn.style.backgroundColor = '';
				}, 2000);
			}
			this.showSuccess('Backup codes copied to clipboard!');
		}).catch(err => {
			console.error('Failed to copy codes:', err);
			this.showError('Failed to copy codes to clipboard');
		});
	}

	downloadBackupCodes(codes) {
		const codesText = `BACKUP CODES - ${new Date().toLocaleDateString()}\n\n` +
			`Save these codes in a secure place. Each code can be used only once.\n\n` +
			codes.join('\n') +
			`\n\nGenerated on: ${new Date().toISOString()}`;
		const blob = new Blob([codesText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		this.showSuccess('Backup codes downloaded successfully');
	}

	showMessage(message, type = 'info') {
		const messageDiv = document.createElement('div');
		messageDiv.className = `alert alert-${type}`;
		messageDiv.textContent = message;
		messageDiv.style.margin = '10px 0';
		messageDiv.style.padding = '10px';
		messageDiv.style.borderRadius = '4px';
		if (type === 'success') {
			messageDiv.style.backgroundColor = '#d4edda';
			messageDiv.style.color = '#155724';
			messageDiv.style.border = '1px solid #c3e6cb';
		} else if (type === 'error') {
			messageDiv.style.backgroundColor = '#f8d7da';
			messageDiv.style.color = '#721c24';
			messageDiv.style.border = '1px solid #f5c6cb';
		} else {
			messageDiv.style.backgroundColor = '#d1ecf1';
			messageDiv.style.color = '#0c5460';
			messageDiv.style.border = '1px solid #bee5eb';
		}

		const timeout = type === 'warning' ? 30000 : 5000;
		const container = document.querySelector('.container');
		if (container) {
			container.insertBefore(messageDiv, container.firstChild);
			setTimeout(() => {
				if (messageDiv.parentNode) {
					messageDiv.parentNode.removeChild(messageDiv);
				}
			}, timeout);
		}
		return messageDiv;
	}

	showSuccess(message) {
		this.showMessage(message, 'success');
	}

	showError(message) {
		this.showMessage(message, 'error');
	}
}

document.addEventListener('DOMContentLoaded', function () {
	window.twoFAManager = new TwoFAManager();
});
