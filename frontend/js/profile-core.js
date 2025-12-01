export async function loadUserProfile() {
	try {
		const response = await fetch('/auth/profile-data', { credentials: 'include' });
		if (response.ok) {
			const userData = await response.json();
			displayUserData(userData);
		} else {
			window.location.href = '/';
		}
	} catch (error) {
		console.error('Error loading profile:', error);
		showErrorMessage('messages.connectionError');
	}
}

export function displayUserData(userData) {
	document.getElementById('username').textContent = userData.username;
	document.getElementById('userUsername').textContent = userData.username;
	document.getElementById('userEmail').textContent = userData.email || window.languageManager.getTranslation('profile.notAvailable');
	document.getElementById('userId').textContent = userData.id;

	const is2FAEnabled = Boolean(userData.twoFactorEnabled);
	update2FAStatusDisplay(is2FAEnabled);

	document.getElementById('userAvatar').src = userData.avatar || 'default-avatar.png';
	document.getElementById('jwtToken').textContent = userData.jwtToken || (window.languageManager.getTranslation('profile.notAvailable') || 'Not available');

	update2FAButton(is2FAEnabled);

	updateAdminPanelVisibility(userData);
}

export function update2FAStatusDisplay(is2FAEnabled) {
	const enabledText = window.languageManager.getTranslation('common.enabled');
	const disabledText = window.languageManager.getTranslation('common.disabled');
	const statusElement = document.getElementById('user2FAStatus');

	if (statusElement) {
		statusElement.textContent = is2FAEnabled ? enabledText : disabledText;
		statusElement.className = is2FAEnabled ? 'status-enabled' : 'status-disabled';
	}
}

export function update2FAButton(is2FAEnabled) {
	const btn2FA = document.getElementById('2faBtn');
	if (btn2FA) {
		const configureText = window.languageManager.getTranslation('profile.configure2FA');
		const manageText = window.languageManager.getTranslation('profile.manage2FA');
		btn2FA.textContent = is2FAEnabled ? manageText : configureText;
		btn2FA.href = is2FAEnabled ? '/2fa/management' : '/2fa/management';
	}
}

export function updateAdminPanelVisibility(userData) {
	const adminPanel = document.querySelector('[href="/admin/users"]');
	if (adminPanel) {
		adminPanel.style.display = 'inline-block';
	}
}

export function applyTranslationsToProfile() {
	const statusElement = document.getElementById('user2FAStatus');
	if (statusElement) {
		const isCurrentlyEnabled = statusElement.textContent === window.languageManager.getTranslation('common.enabled') ||
			statusElement.classList.contains('status-enabled');
		update2FAStatusDisplay(isCurrentlyEnabled);
	}

	update2FAButton(document.getElementById('user2FAStatus')?.textContent === window.languageManager.getTranslation('common.enabled'));

	const elementsToTranslate = [
		{ id: 'username', prefix: '' },
		{ id: 'userUsername', prefix: '' },
		{ id: 'userEmail', prefix: '' },
		{ id: 'userId', prefix: '' }
	];

	elementsToTranslate.forEach(item => {
		const element = document.getElementById(item.id);
		if (element && element.textContent) {
			const currentText = element.textContent;
			const translated = window.languageManager.getTranslation(currentText);
			if (translated !== currentText) {
				element.textContent = item.prefix + translated;
			}
		}
	});
}

export function showErrorMessage(messageKey) {
	const message = window.languageManager.getTranslation(messageKey);
	const messageDiv = document.createElement('div');
	messageDiv.className = 'message error';
	messageDiv.textContent = message;
	messageDiv.style.margin = '10px 0';
	messageDiv.style.padding = '10px';
	messageDiv.style.backgroundColor = '#f8d7da';
	messageDiv.style.color = '#721c24';
	messageDiv.style.border = '1px solid #f5c6cb';
	messageDiv.style.borderRadius = '4px';

	const container = document.querySelector('.container');
	if (container) {
		container.insertBefore(messageDiv, container.firstChild);
		setTimeout(() => {
			if (messageDiv.parentNode) {
				messageDiv.parentNode.removeChild(messageDiv);
			}
		}, 5000);
	}
}

export async function refreshProfileStatus() {
	try {
		const response = await fetch('/auth/profile-data', { credentials: 'include' });
		if (response.ok) {
			const userData = await response.json();
			displayUserData(userData);
			return true;
		}
	} catch (error) {
		console.error('Error refreshing profile:', error);
	}
	return false;
}

window.applyTranslationsToProfile = applyTranslationsToProfile;
window.refreshProfileStatus = refreshProfileStatus;

window.addEventListener('translationsApplied', function () {
	applyTranslationsToProfile();
});

window.addEventListener('2faStatusChanged', async function () {
	await refreshProfileStatus();
});

document.addEventListener('visibilitychange', function () {
	if (!document.hidden) {
		refreshProfileStatus();
	}
});
