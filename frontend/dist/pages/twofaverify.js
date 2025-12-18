import { verify2FALogin } from '../twofa.js';
import { navigate } from '../router.js';
import { updateAuthBtn } from '../auth.js';
export function renderTwoFAVerify() {
    setTimeout(initVerify, 100);
    return `
    <div class="max-w-md mx-auto">
      <div class="card text-center">
        <div class="text-6xl mb-6">🔐</div>
        <h2 class="text-3xl font-bold mb-4" data-i18n="2fa.verificationRequired">Two-Factor Authentication</h2>
        <p class="text-gray-400 mb-6" data-i18n="2fa.enterCodePrompt">Enter the 6-digit code from your authenticator app</p>

        <form id="verify2FAForm">
          <input type="text" id="tokenInput" maxlength="6" placeholder="000000"
                 class="input text-center text-3xl font-mono tracking-widest mb-4"
                 data-i18n-placeholder="2fa.sixDigitCode" autocomplete="off">
          <button type="submit" class="btn btn-blue w-full mb-4" data-i18n="2fa.verify">
            Verify
          </button>
        </form>

        <div class="border-t border-gray-700 pt-4">
          <p class="text-sm text-gray-400 mb-3" data-i18n="2fa.useBackupCode">Lost your device? Use a backup code</p>
          <button onclick="showBackupCodeForm()" class="btn btn-gray w-full" data-i18n="2fa.useBackupCodeBtn">
            Use Backup Code
          </button>
        </div>

        <div id="backupCodeForm" class="hidden mt-4 pt-4 border-t border-gray-700">
          <p class="text-sm text-gray-400 mb-3" data-i18n="2fa.enterBackupCode">Enter your backup code:</p>
          <input type="text" id="backupCodeInput" maxlength="9" placeholder="12345-678"
                 class="input text-center text-xl font-mono tracking-wider mb-4"
                 data-i18n-placeholder="2fa.backupCodePlaceholder" autocomplete="off">
          <div class="flex gap-2">
            <button onclick="verifyBackupCode()" class="btn btn-blue flex-1" data-i18n="2fa.verifyBackupCode">
              Verify Backup Code
            </button>
            <button onclick="hideBackupCodeForm()" class="btn btn-gray flex-1" data-i18n="common.cancel">
              Cancel
            </button>
          </div>
        </div>

        <div id="verifyMessage" class="hidden mt-4"></div>
      </div>
    </div>
  `;
}
function initVerify() {
    const form = document.getElementById('verify2FAForm');
    const tokenInput = document.getElementById('tokenInput');
    const backupInput = document.getElementById('backupCodeInput');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await verifyToken();
        });
    }
    if (tokenInput) {
        tokenInput.focus();
        tokenInput.addEventListener('input', (e) => {
            const input = e.target;
            input.value = input.value.replace(/\D/g, '');
        });
    }
    if (backupInput) {
        backupInput.addEventListener('input', (e) => {
            const input = e.target;
            let value = input.value.replace(/[^0-9]/g, '');
            if (value.length > 5) {
                value = value.substr(0, 5) + '-' + value.substr(5, 3);
            }
            input.value = value;
        });
    }
    window.languageManager?.applyTranslations();
}
async function verifyToken() {
    const tokenInput = document.getElementById('tokenInput');
    const token = tokenInput?.value.trim();
    if (!token || !/^\d{6}$/.test(token)) {
        showMessage('Please enter a valid 6-digit code', 'error');
        return;
    }
    try {
        showMessage('Verifying...', 'info');
        const success = await verify2FALogin(token, false);
        if (success) {
            showMessage('Verification successful! Redirecting...', 'success');
            updateAuthBtn();
            setTimeout(() => {
                navigate('profile');
            }, 1000);
        }
        else {
            showMessage('Invalid code. Please try again.', 'error');
            tokenInput.value = '';
            tokenInput.focus();
        }
    }
    catch (error) {
        console.error('Verification error:', error);
        showMessage('Connection error. Please try again.', 'error');
    }
}
async function verifyBackupCode() {
    const backupInput = document.getElementById('backupCodeInput');
    const code = backupInput?.value.trim().toUpperCase();
    if (!code || !/^\d{5}-\d{3}$/.test(code)) {
        showMessage('Invalid backup code format. Use: 12345-678', 'error');
        return;
    }
    try {
        showMessage('Verifying backup code...', 'info');
        const success = await verify2FALogin(code, true);
        if (success) {
            showMessage('Backup code accepted! Redirecting...', 'success');
            updateAuthBtn();
            setTimeout(() => {
                navigate('profile');
            }, 1000);
        }
        else {
            showMessage('Invalid or already used backup code.', 'error');
            backupInput.value = '';
            backupInput.focus();
        }
    }
    catch (error) {
        console.error('Verification error:', error);
        showMessage('Connection error. Please try again.', 'error');
    }
}
function showBackupCodeForm() {
    document.getElementById('backupCodeForm')?.classList.remove('hidden');
    document.getElementById('backupCodeInput')?.focus();
}
function hideBackupCodeForm() {
    document.getElementById('backupCodeForm')?.classList.add('hidden');
    document.getElementById('backupCodeInput').value = '';
}
function showMessage(message, type) {
    const messageDiv = document.getElementById('verifyMessage');
    if (!messageDiv)
        return;
    const colors = {
        success: 'bg-green-900 text-green-200 border-green-600',
        error: 'bg-red-900 text-red-200 border-red-600',
        info: 'bg-blue-900 text-blue-200 border-blue-600'
    };
    messageDiv.className = `p-3 rounded border ${colors[type]}`;
    messageDiv.textContent = message;
    messageDiv.classList.remove('hidden');
}
window.showBackupCodeForm = showBackupCodeForm;
window.hideBackupCodeForm = hideBackupCodeForm;
window.verifyBackupCode = verifyBackupCode;
