import { verify2FALogin } from '../twofa.js';
import { navigate } from '../router.js';
import { setToken } from '../api.js';
import { updateAuthBtn } from '../auth.js';

export function renderTwoFAVerify(): string {
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

        <div id="verifyMessage" class="hidden mt-4"></div>
      </div>
    </div>
  `;
}

function initVerify(): void {
  const form = document.getElementById('verify2FAForm');
  const tokenInput = document.getElementById('tokenInput') as HTMLInputElement;

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await verifyToken();
    });
  }

  if (tokenInput) {
    tokenInput.focus();
    tokenInput.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      input.value = input.value.replace(/\D/g, '');
    });
  }

  window.languageManager?.applyTranslations();
}

async function verifyToken(): Promise<void> {
  const tokenInput = document.getElementById('tokenInput') as HTMLInputElement;
  const token = tokenInput?.value.trim();

  if (!token || !/^\d{6}$/.test(token)) {
    showMessage('Please enter a valid 6-digit code', 'error');
    return;
  }

  const tempToken = localStorage.getItem('temp_2fa_token');
  if (!tempToken) {
    showMessage('Session expired. Please login again.', 'error');
    setTimeout(() => navigate('auth'), 2000);
    return;
  }

  try {
    showMessage('Verifying...', 'info');
    const result = await verify2FALogin(token, tempToken);

    if (result.success && result.token) {
      localStorage.removeItem('temp_2fa_token');
      setToken(result.token);
      showMessage('Verification successful! Redirecting...', 'success');
      updateAuthBtn();
      setTimeout(() => {
        navigate('profile');
      }, 1000);
    } else {
      showMessage('Invalid code. Please try again.', 'error');
      tokenInput.value = '';
      tokenInput.focus();
    }
  } catch (error) {
    console.error('Verification error:', error);
    showMessage('Connection error. Please try again.', 'error');
  }
}

function showMessage(message: string, type: 'success' | 'error' | 'info'): void {
  const messageDiv = document.getElementById('verifyMessage');
  if (!messageDiv) return;

  const colors = {
    success: 'bg-green-900 text-green-200 border-green-600',
    error: 'bg-red-900 text-red-200 border-red-600',
    info: 'bg-blue-900 text-blue-200 border-blue-600'
  };

  messageDiv.className = `p-3 rounded border ${colors[type]}`;
  messageDiv.textContent = message;
  messageDiv.classList.remove('hidden');
}
