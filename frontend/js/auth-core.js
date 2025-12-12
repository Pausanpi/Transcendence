
export async function authenticateUser(url, formData) {
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(Object.fromEntries(formData))
		});

		if (!response.ok) {
			if (response.status === 504) {
				throw new Error('Gateway timeout. Please try again.');
			}
			const errorText = await response.text();
			console.error('Error response:', errorText);
			showMessage('messages.connectionError', 'error');
			return;
		}

		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			const text = await response.text();
			console.error('Non-JSON response:', text.substring(0, 100));
			showMessage('messages.connectionError', 'error');
			return;
		}

		const result = await response.json();

		if (result.requires2FA) {
			window.location.href = '/auth/2fa-required';
			return;
		}

		if (result.success && !result.requires2FA) {

			if (result.token) {
				document.cookie = `auth_jwt=${result.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
			}

			if (result.redirect) {
				window.location.href = result.redirect;
			} else {
				window.location.href = '/auth/profile';
			}
			return;
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
