export async function authenticateUser(url, formData) {
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(Object.fromEntries(formData))
		});

		const result = await response.json();

		if (!response.ok) {
			let errorMessage = result.error || 'messages.connectionError';
			showMessage(errorMessage, 'error');
			return;
		}

		if (result.requires2FA) {
			window.location.href = '/auth/2fa-required';
			return;
		}

		if (result.success) {
			window.location.href = '/auth/profile';
		} else {
			showMessage(result.error, 'error');
		}
	} catch (error) {
		console.error('Request failed:', error);
		showMessage('messages.connectionError', 'error');
	}
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
}

export function showTab(tabName) {
	document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
	document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

	document.querySelector(`.auth-tab[onclick="showTab('${tabName}')"]`).classList.add('active');
	document.getElementById(`${tabName}-form`).classList.add('active');
}
