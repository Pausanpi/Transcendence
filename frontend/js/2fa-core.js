export function showBackupCodeInput() {
	document.getElementById('backupCodeSection').style.display = 'flex';
	document.getElementById('backupCode').focus();
}

export function hideBackupCodeInput() {
	document.getElementById('backupCodeSection').style.display = 'none';
	document.getElementById('backupCode').value = '';
}

export function showMessage(message, type) {
	const messageDiv = document.getElementById('message');
	let messageText = message;

	if (window.languageManager && typeof message === 'string') {
		const translated = window.languageManager.getTranslation(message);
		if (translated !== message) {
			messageText = translated;
		}
	}

	messageDiv.innerHTML = `<div class="message ${type}">${messageText}</div>`;

	if (type === 'success') {
		setTimeout(() => {
			messageDiv.innerHTML = '';
		}, 5000);
	}
}

export async function getUserId() {
	try {
		const response = await fetch('/auth/pending-2fa-user', {
			credentials: 'include'
		});
		if (response.ok) {
			const data = await response.json();
			return data.userId;
		}
	} catch (error) {
		console.error('Error obteniendo user ID pendiente:', error);
	}
	return null;
}

export async function verify2FAToken(isBackupCode = false) {
	const userId = await getUserId();
	if (!userId) {
		showMessage(
			window.languageManager.getTranslation('messages.userNotFound'),
			'error'
		);
		setTimeout(() => {
			window.location.href = '/';
		}, 2000);
		return;
	}

	let token;
	if (isBackupCode) {
		token = document.getElementById('backupCode').value.trim().toUpperCase();
	} else {
		token = document.getElementById('tokenInput').value.trim();
	}

	if (!token) {
		showMessage(window.languageManager.getTranslation('messages.enterCode'), 'error');
		return;
	}

	if (isBackupCode) {
		if (!/^\d{5}-\d{3}$/.test(token)) {
			showMessage(window.languageManager.getTranslation('messages.invalidBackupFormat'), 'error');
			return;
		}
	}

	try {
		showMessage(window.languageManager.getTranslation('messages.verifyingCode'), 'success');

		const response = await fetch('/2fa/verify-login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({
				token,
				userId,
				isBackupCode: isBackupCode
			})
		});

		const result = await response.json();

		if (result.success) {
			let message = window.languageManager.getTranslation('2fa.verificationSuccess');

			if (result.usedBackupCode) {
				message = window.languageManager.getTranslation('2fa.backupCodeSuccess', {
					remaining: result.remainingBackupCodes || window.languageManager.getTranslation('common.several')
				});
			}

			showMessage(message, 'success');

			setTimeout(() => {
				window.location.href = '/auth/profile';
			}, 1500);
		} else {
			let errorMessage = result.error || 'messages.invalid2FAToken';

			if (errorMessage.includes('time') || errorMessage.includes('sync')) {
				errorMessage = 'messages.timeSyncIssue';
			}

			showMessage(window.languageManager.getTranslation(errorMessage), 'error');

			if (isBackupCode) {
				document.getElementById('backupCode').value = '';
				document.getElementById('backupCode').focus();
			} else {
				document.getElementById('tokenInput').value = '';
				document.getElementById('tokenInput').focus();
			}
		}
	} catch (error) {
		console.error('Network error:', error);
		showMessage(
			window.languageManager.getTranslation('messages.connectionError'),
			'error'
		);
	}
}

export function formatBackupCode(input) {
	let value = input.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
	if (value.length > 5) {
		value = value.substr(0, 5) + '-' + value.substr(5, 3);
	}
	input.value = value;
}
export function validateBackupCode(input) {
	const value = input.value.trim().toUpperCase();
	if (value.length > 0 && !/^[A-Z0-9]{5}-[A-Z0-9]{3}$/i.test(value)) {
		input.setCustomValidity(window.languageManager.getTranslation('messages.invalidBackupFormat'));
	} else {
		input.setCustomValidity('');
	}
}

export function validate2FACode(input) {
	const value = input.value.trim();
	if (value.length > 0 && !/^\d{6}$/.test(value)) {
		input.setCustomValidity(window.languageManager.getTranslation('messages.sixDigitsRequired'));
	} else {
		input.setCustomValidity('');
	}
}

document.addEventListener('DOMContentLoaded', function () {
	const backupCodeInput = document.getElementById('backupCode');
	const tokenInput = document.getElementById('tokenInput');

	if (backupCodeInput) {
		backupCodeInput.addEventListener('input', (e) => {
			let value = e.target.value.replace(/[^0-9]/g, '');
			if (value.length > 5) {
				value = value.substr(0, 5) + '-' + value.substr(5, 3);
			}
			if (value.length > 9) {
				value = value.substr(0, 9);
			}
			e.target.value = value;
		});
	}
	if (tokenInput) {
		tokenInput.addEventListener('input', (e) => {
			validate2FACode(e.target);
		});

		tokenInput.addEventListener('blur', (e) => {
			validate2FACode(e.target);
		});

		tokenInput.focus();
	}

	const forms = ['2faForm', 'backupCodeForm'];
	forms.forEach(formId => {
		const form = document.getElementById(formId);
		if (form) {
			form.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					const isBackupCode = formId === 'backupCodeForm';
					verify2FAToken(isBackupCode);
				}
			});
		}
	});
	document.getElementById('backupCodeForm').addEventListener('submit', async (e) => {
		e.preventDefault();
		await verify2FAToken(true);
	});
});
