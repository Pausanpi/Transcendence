import { api, getToken } from '../api.js';
import { TwoFAManager } from '../twofa.js';
import { removeAuthToken } from '../api.js';
export function renderProfile() {
    setTimeout(initTwoFA, 100);
    setTimeout(loadProfile, 100);
    return `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="card">
        <h3 class="text-2xl font-bold mb-4" data-i18n="profile.title">Profile</h3>
        <div id="profileInfo" class="space-y-2">
          <div class="animate-pulse">
            <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>


<div class="grid grid-cols-2 gap-4 mt-4">
          <input id="displayName" placeholder="Display Name (Nickname)" class="input" data-i18n-placeholder="profile.displayName" />
          <input id="avatar" placeholder="Avatar URL" class="input" data-i18n-placeholder="profile.avatarUrl" />
        </div>
        <button onclick="updateProfile()" class="btn btn-blue mt-4" data-i18n="profile.update">Update</button>
        <button onclick="navigate('gdpr')" class="btn btn-gray mt-2" data-i18n="profile.privacyData">🔒 Privacy & Data</button>
       <button id="enable2FABtn" class="btn btn-blue" data-i18n="2fa.setup2FA">
        </button>
        <div id="profileResult" class="hidden"></div>

      <div id="disableSection" class="card" style="display: none;">
        <div class="flex gap-4">
          <button id="disable2FABtn" class="btn btn-red" data-i18n="2fa.disable2FA">
          </button>
          <button id="generateBackupCodesBtn" class="btn btn-yellow" data-i18n="2fa.generateBackupCodes">
          </button>
        </div>
      </div>
    </div>

    <div id="setupModal" class="modal hidden">
      <div class="modal-content card max-w-lg">
        <h3 class="text-2xl font-bold mb-4" data-i18n="2fa.setupTitle">Setup 2FA</h3>
        <div class="mb-6 text-center">
          <p class="mb-4" data-i18n="2fa.scanQR">Scan this QR code with your authenticator app:</p>
          <img id="qrCodeImage" src="" alt="QR Code" class="mx-auto mb-4 bg-white p-4 rounded">
          <p class="text-sm text-gray-400"><strong data-i18n="2fa.secret">Secret:</strong> <span id="secretText" class="font-mono"></span></p>
          <button id="refreshQRBtn" class="btn btn-gray mt-2" data-i18n="2fa.refreshQR">🔄 Refresh QR</button>
        </div>
        <div class="mb-4">
          <label class="block mb-2" data-i18n="2fa.enterCode">Enter 6-digit code:</label>
          <input type="text" id="verificationCode" maxlength="6" placeholder="000000"
                 class="input text-center text-2xl font-mono tracking-widest">
        </div>
        <div class="flex gap-4">
          <button id="verifyCodeBtn" class="btn btn-blue flex-1" data-i18n="2fa.verifyActivate">
            ✓ Verify & Activate
          </button>
          <button id="cancelSetupBtn" class="btn btn-gray flex-1" data-i18n="common.cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <div id="disableModal" class="modal hidden">
      <div class="modal-content card max-w-lg">
        <h3 class="text-2xl font-bold mb-4 text-red-400" data-i18n="2fa.disableTitle">Disable 2FA</h3>
        <p class="mb-4" data-i18n="2fa.enterCodeToDisable">Enter your 6-digit code to disable 2FA:</p>
        <input type="text" id="disableVerificationCode" maxlength="6" placeholder="000000"
               class="input text-center text-2xl font-mono tracking-widest mb-4">
        <div class="flex gap-4">
          <button id="confirmDisableBtn" class="btn btn-red flex-1" data-i18n="2fa.disableButton">
            Disable 2FA
          </button>
          <button id="cancelDisableBtn" class="btn btn-gray flex-1" data-i18n="common.cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <div id="backupCodesModal" class="modal hidden">
      <div class="modal-content card max-w-2xl">
        <h3 class="text-2xl font-bold mb-4 text-yellow-400" data-i18n="2fa.backupCodesAlert">⚠️ Save Your Backup Codes</h3>
        <p class="mb-4" data-i18n="2fa.newBackupCodes">Store these codes safely. Each can be used only once:</p>
        <div id="backupCodesList" class="grid grid-cols-2 gap-3 mb-6"></div>
        <div class="flex gap-4">
          <button id="copyAllCodesBtn" class="btn btn-blue flex-1">
          Copy all
          </button>
          <button id="downloadCodesBtn" class="btn btn-yellow flex-1">
          Download
          </button>
          <button id="closeBackupCodesBtn" class="btn btn-gray flex-1" data-i18n="common.confirm">
            I've Saved Them
          </button>
        </div>
      </div>
    </div>

      </div>

    </div>
  `;
}
async function initTwoFA() {
    const manager = new TwoFAManager();
    await manager.init();
    window.languageManager?.applyTranslations();
    window.twoFAManager = manager;
}
async function loadProfile() {
    const token = getToken();
    if (!token) {
        const infoDiv = document.getElementById('profileInfo');
        if (infoDiv) {
            infoDiv.innerHTML = '<p class="text-red-400" data-i18n="auth.authenticationRequired">Please login</p>';
            window.languageManager?.applyTranslations();
        }
        return;
    }
    try {
        const response = await api('/api/auth/profile-data');
        const infoDiv = document.getElementById('profileInfo');
        if (infoDiv) {
            if (response.success && response.user) {
                infoDiv.innerHTML = `
        <p><img width='200px' height='200px'  src=${response.user.avatar || '/default-avatar.png'} />
          <p><strong data-i18n="profile.displayName">Nickname:</strong> ${response.user.displayName || 'N/A'}</p>
          <p><strong data-i18n="profile.username">Username:</strong> ${response.user.username || 'N/A'}</p>
          <p><strong data-i18n="profile.email">Email:</strong> ${response.user.email || 'N/A'}</p>
          <p><strong data-i18n="profile.id">ID:</strong> ${response.user.id || 'N/A'}</p>
          <p><strong data-i18n="profile.2fa">2FA:</strong> <span class="${response.user.twoFactorEnabled ? 'text-green-400' : 'text-yellow-400'}">${response.user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span></p>
        `;
            }
            else {
                infoDiv.innerHTML = '<p class="text-red-400" data-i18n="profile.failedToLoad">Failed to load profile</p>';
            }
            window.languageManager?.applyTranslations();
        }
    }
    catch (error) {
        console.error('Error loading profile:', error);
        const infoDiv = document.getElementById('profileInfo');
        if (infoDiv) {
            infoDiv.innerHTML = '<p class="text-red-400" data-i18n="profile.failedToLoad">Failed to load profile</p>';
            window.languageManager?.applyTranslations();
        }
    }
}
async function updateProfile() {
    const displayName = document.getElementById('displayName').value;
    const avatar = document.getElementById('avatar').value;
    try {
        const data = await api('/api/auth/profile-data', {
            method: 'PUT',
            body: JSON.stringify({ displayName, avatar })
        });
        const resultDiv = document.getElementById('profileResult');
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.className = 'mt-4 p-3 rounded bg-green-900 text-green-200';
            resultDiv.textContent = 'Profile updated successfully';
        }
        loadProfile();
    }
    catch (error) {
        const resultDiv = document.getElementById('profileResult');
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.className = 'mt-4 p-3 rounded bg-red-900 text-red-200';
            resultDiv.textContent = 'Failed to update profile';
        }
    }
}
async function anonymize() {
    if (!confirm('Are you sure you want to anonymize your account?'))
        return;
    const confirmPassword = document.getElementById('confirmPwd').value;
    try {
        const data = await api('/api/users/gdpr/anonymize', {
            method: 'POST',
            body: JSON.stringify({ confirmPassword })
        });
        const resultDiv = document.getElementById('dangerResult');
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.className = 'mt-4 p-3 rounded bg-green-900 text-green-200';
            resultDiv.textContent = 'Account anonymized successfully';
        }
    }
    catch (error) {
        const resultDiv = document.getElementById('dangerResult');
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.className = 'mt-4 p-3 rounded bg-red-900 text-red-200';
            resultDiv.textContent = 'Failed to anonymize account';
        }
    }
}
async function deleteAcc() {
    if (!confirm('DELETE account permanently? This cannot be undone!'))
        return;
    const confirmPassword = document.getElementById('confirmPwd').value;
    try {
        const data = await api('/api/users/gdpr/delete', {
            method: 'DELETE',
            body: JSON.stringify({ confirmPassword })
        });
        const resultDiv = document.getElementById('dangerResult');
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.className = 'mt-4 p-3 rounded bg-green-900 text-green-200';
            resultDiv.textContent = 'Account deleted successfully';
        }
        setTimeout(() => {
            removeAuthToken();
            window.location.href = '/';
        }, 2000);
    }
    catch (error) {
        const resultDiv = document.getElementById('dangerResult');
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.className = 'mt-4 p-3 rounded bg-red-900 text-red-200';
            resultDiv.textContent = 'Failed to delete account';
        }
    }
}
window.updateProfile = updateProfile;
window.anonymize = anonymize;
window.deleteAcc = deleteAcc;
