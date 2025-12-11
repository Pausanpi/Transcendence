export async function authenticateUser(url, formData) {
	try {
		console.log('Authenticating user at:', url);
		
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include', 
			body: JSON.stringify(Object.fromEntries(formData))
		});
		
		console.log('Response status:', response.status);
		
		const result = await response.json();
		console.log('Response result:', result);
		
		if (!response.ok) {
			let errorMessage = result.error || 'messages.connectionError';
			showMessage(errorMessage, 'error');
			return;
		}
		
		if (result.requires2FA) {
			console.log('2FA required, redirecting...');
			window.location.href = '/auth/2fa-required';
			return;
		}
		
		if (result.success) {
			console.log('Login successful, redirecting to profile...');
		
			setTimeout(() => {
				window.location.href = '/auth/profile';
			}, 100);
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