import { api, getToken } from './api.js';
import { navigate } from './router.js';

export class TwoFAManager {
  private status: boolean = false;
  private currentBackupCodes: string[] = [];
  private setupToken: string = '';

  async init(): Promise<void> {
    await this.load2FAStatus();
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    document.getElementById('enable2FABtn')?.addEventListener('click', () => this.setup2FA());
    document.getElementById('disable2FABtn')?.addEventListener('click', () => this.showDisableModal());
    document.getElementById('generateBackupCodesBtn')?.addEventListener('click', () => this.generateBackupCodes());
    document.getElementById('verifyCodeBtn')?.addEventListener('click', () => this.verify2FA());
    document.getElementById('refreshQRBtn')?.addEventListener('click', () => this.setup2FA());
    document.getElementById('confirmDisableBtn')?.addEventListener('click', () => this.disable2FA());
    document.getElementById('cancelSetupBtn')?.addEventListener('click', () => this.hideSetupModal());
    document.getElementById('cancelDisableBtn')?.addEventListener('click', () => this.hideDisableModal());
    document.getElementById('copyAllCodesBtn')?.addEventListener('click', () => this.copyBackupCodes());
    document.getElementById('downloadCodesBtn')?.addEventListener('click', () => this.downloadBackupCodes());
    document.getElementById('closeBackupCodesBtn')?.addEventListener('click', () => this.hideBackupCodesModal());

    document.getElementById('verificationCode')?.addEventListener('keypress', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') this.verify2FA();
    });

    document.getElementById('disableVerificationCode')?.addEventListener('keypress', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') this.disable2FA();
    });
  }

  async load2FAStatus(): Promise<void> {
    try {
      const data = await api<any>('/api/auth/profile');
      this.status = Boolean(data.user.twoFactorEnabled);
      this.updateUI();
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    }
  }

  updateUI(): void {
    const statusValue = document.getElementById('statusValue');
    const enableSection = document.getElementById('enableSection');
    const disableSection = document.getElementById('disableSection');

    if (statusValue) {
      const enabledText = window.languageManager?.t('common.enabled') || 'Enabled';
      const disabledText = window.languageManager?.t('common.disabled') || 'Disabled';
      statusValue.textContent = this.status ? enabledText : disabledText;
      statusValue.className = `text-lg font-bold ${this.status ? 'text-green-400' : 'text-yellow-400'}`;
    }

    if (enableSection) {
      enableSection.style.display = this.status ? 'none' : 'block';
    }

    if (disableSection) {
      disableSection.style.display = this.status ? 'block' : 'none';
    }
  }

  async setup2FA(): Promise<void> {
    try {
  const result = await api<any>('/api/2fa/setup', {
    method: 'POST',
    body: JSON.stringify({})
});

      if (result.success) {
        this.setupToken = result.setupToken;
        this.showSetupModal(result.secret, result.qrCode);
      } else {
        this.showError(result.error || 'Failed to setup 2FA');
      }
    } catch (error: any) {
      console.error('Error setting up 2FA:', error);
      this.showError(error.message || 'Connection error');
    }
  }

  private showSetupModal(secret: string, qrCode: string): void {
    const modal = document.getElementById('setupModal');
    if (!modal) return;

    const secretText = document.getElementById('secretText');
    const qrImage = document.getElementById('qrCodeImage') as HTMLImageElement;
    const verificationCode = document.getElementById('verificationCode') as HTMLInputElement;

    if (secretText) secretText.textContent = secret;
    if (qrImage) {
      qrImage.src = qrCode;
      qrImage.style.display = 'block';
    }
    if (verificationCode) {
      verificationCode.value = '';
      verificationCode.focus();
    }

    modal.classList.remove('hidden');
  }

  private hideSetupModal(): void {
    document.getElementById('setupModal')?.classList.add('hidden');
  }

  async verify2FA(): Promise<void> {
    const codeInput = document.getElementById('verificationCode') as HTMLInputElement;
    const code = codeInput?.value.trim();

    if (!code || !/^\d{6}$/.test(code)) {
      this.showError('Please enter a valid 6-digit code');
      return;
    }

    try {
      const result = await api<any>('/api/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({
          token: code,
          setupToken: this.setupToken
        })
      });

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

        window.dispatchEvent(new CustomEvent('2faStatusChanged'));
      } else {
        this.showError(result.error || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      this.showError(error.message || 'Connection error');
    }
  }

  private showDisableModal(): void {
    const modal = document.getElementById('disableModal');
    const input = document.getElementById('disableVerificationCode') as HTMLInputElement;
    if (modal) modal.classList.remove('hidden');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  private hideDisableModal(): void {
    document.getElementById('disableModal')?.classList.add('hidden');
  }

  async disable2FA(): Promise<void> {
    const codeInput = document.getElementById('disableVerificationCode') as HTMLInputElement;
    const code = codeInput?.value.trim();

    if (!code || !/^\d{6}$/.test(code)) {
      this.showError('Please enter a valid 6-digit code');
      return;
    }

    try {
      const result = await api<any>('/api/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ token: code })
      });

      if (result.success) {
        this.showSuccess('2FA disabled successfully');
        this.hideDisableModal();
        this.status = false;
        this.updateUI();
        window.dispatchEvent(new CustomEvent('2faStatusChanged'));
      } else {
        this.showError(result.error || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      this.showError(error.message || 'Connection error');
    }
  }

  async generateBackupCodes(): Promise<void> {
    try {
      const result = await api<any>('/api/2fa/backup-codes/generate', {
        method: 'POST'
      });

      if (result.success) {
        this.currentBackupCodes = result.codes;
        this.showBackupCodesModal(result.codes);
        this.showSuccess('New backup codes generated successfully');
      } else {
        this.showError(result.error || 'Failed to generate backup codes');
      }
    } catch (error: any) {
      console.error('Error generating backup codes:', error);
      this.showError(error.message || 'Connection error');
    }
  }

  private showBackupCodesModal(codes: string[]): void {
    const modal = document.getElementById('backupCodesModal');
    const codesList = document.getElementById('backupCodesList');
    if (!modal || !codesList) return;

    this.currentBackupCodes = codes;
    codesList.innerHTML = codes.map(code =>
      `<div class="p-3 bg-gray-800 rounded font-mono text-center text-lg">${code}</div>`
    ).join('');

    modal.classList.remove('hidden');
  }

  private hideBackupCodesModal(): void {
    document.getElementById('backupCodesModal')?.classList.add('hidden');
  }

  private copyBackupCodes(): void {
    const codesText = this.currentBackupCodes.join('\n');
    navigator.clipboard.writeText(codesText).then(() => {
      const copyBtn = document.getElementById('copyAllCodesBtn');
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      }
      this.showSuccess('Backup codes copied to clipboard!');
    }).catch(() => {
      this.showError('Failed to copy codes to clipboard');
    });
  }

  private downloadBackupCodes(): void {
    const codesText = `BACKUP CODES - ${new Date().toLocaleDateString()}\n\n` +
      `Save these codes in a secure place. Each code can be used only once.\n\n` +
      this.currentBackupCodes.join('\n') +
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

  private showMessage(message: string, type: 'success' | 'error'): void {
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white z-50`;

    const translatedMessage = window.languageManager?.t(message) || message;
    messageDiv.textContent = translatedMessage;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  private showSuccess(message: string): void {
    this.showMessage(message, 'success');
  }

  private showError(message: string): void {
    this.showMessage(message, 'error');
  }
}

export async function verify2FALogin(token: string, tempToken: string): Promise<{ success: boolean; token?: string }> {
  try {
    const result = await api<any>('/api/2fa/verify-login', {
      method: 'POST',
      body: JSON.stringify({ token, tempToken })
    });

    return result;
  } catch (error) {
    console.error('Error verifying 2FA login:', error);
    return { success: false };
  }
}
