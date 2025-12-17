export async function getAuthToken() {
	try {
		const response = await fetch('/auth/profile-data', {
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' }
		});
		if (response.ok) {
			const data = await response.json();
			return data.jwtToken;
		}
	} catch (error) {
		console.error('Error obteniendo token:', error);
	}
	return null;
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

export async function loadUserData() {
	try {
		showMessage(window.languageManager.getTranslation('common.loading'), 'success');
		const response = await fetch('/gdpr/user-data', {
			credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		});
		if (response.status === 504) {
			throw new Error('GATEWAY_TIMEOUT');
		}
		if (!response.ok) {
			const errorText = await response.text();
			let errorData;
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { error: errorText };
			}
			throw new Error(errorData.error || `HTTP error ${response.status}`);
		}
		const result = await response.json();
		if (result.success) {
			displayUserData(result.data);
			showMessage(window.languageManager.getTranslation('gdpr.dataLoaded'), 'success');
		} else {
			throw new Error(result.error);
		}
	} catch (error) {
		console.error('Error loading user data:', error);
		let errorKey = 'messages.connectionError';
		if (error.message.includes('GATEWAY_TIMEOUT')) {
			errorKey = 'messages.gatewayTimeout';
		} else if (error.message.includes('USER_NOT_FOUND')) {
			errorKey = 'messages.userNotFound';
		}
		showMessage(window.languageManager.getTranslation(errorKey), 'error');
	}
}

export async function exportUserData() {
	try {
		showMessage(window.languageManager.getTranslation('gdpr.exportInProgress'), 'success');
		const response = await fetch('/gdpr/export-data', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Accept': 'application/json'
			}
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'HTTP error');
		}
		const result = await response.json();
		if (result.success) {
			const dataStr = JSON.stringify(result.data, null, 2);
			const dataBlob = new Blob([dataStr], { type: 'application/json' });
			const url = URL.createObjectURL(dataBlob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			showMessage(window.languageManager.getTranslation('messages.dataExported'), 'success');
		} else {
			throw new Error(result.error);
		}
	} catch (error) {
		console.error('Error exporting data:', error);
		showMessage(window.languageManager.getTranslation('gdpr.exportError'), 'error');
	}
}

export async function anonymizeUserData() {
	try {
		showMessage(window.languageManager.getTranslation('gdpr.anonymizingData'), 'success');
		const response = await fetch('/gdpr/anonymize', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Accept': 'application/json'
			}
		});
		const result = await response.json();
		if (result.success) {
			showMessage(window.languageManager.getTranslation('messages.dataAnonymized'), 'success');
			hideAnonymizeConfirmation();
			setTimeout(() => {
				window.location.href = '/auth/logout';
			}, 3000);
		} else {
			showMessage(window.languageManager.getTranslation(result.error), 'error');
		}
	} catch (error) {
		console.error('Error anonymizing data:', error);
		showMessage(window.languageManager.getTranslation('messages.connectionError'), 'error');
	}
}

export async function loadUserConsent() {
	try {
		const response = await fetch('/gdpr/user-consent', {
			credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) return null;

		const result = await response.json();
		if (!result.success || !result.consent) return null;

		document.getElementById('dataProcessing').checked = result.consent.dataProcessing === 1 || result.consent.dataProcessing === true;
		document.getElementById('marketingEmails').checked = result.consent.marketingEmails === 1 || result.consent.marketingEmails === true;
		document.getElementById('analytics').checked = result.consent.analytics === 1 || result.consent.analytics === true;


		return result.consent;
	} catch (error) {
		console.error('Error loading user consent:', error);
		return null;
	}
}


export async function setupConsentForm() {
	await loadUserConsent();
	const consentForm = document.getElementById('consentForm');
	if (consentForm) {
		consentForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			const consentData = {
				dataProcessing: document.getElementById('dataProcessing').checked,
				marketingEmails: document.getElementById('marketingEmails').checked,
				analytics: document.getElementById('analytics').checked
			};
			try {
				const response = await fetch('/gdpr/update-consent', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(consentData)
				});
				const result = await response.json();
				if (result.success) {
					showMessage(window.languageManager.getTranslation('messages.preferencesUpdated'), 'success');
				} else {
					showMessage(window.languageManager.getTranslation(result.error), 'error');
				}
			} catch (error) {
				console.error('Error updating consent:', error);
				showMessage(window.languageManager.getTranslation('messages.connectionError'), 'error');
			}
		});
	}
	const confirmAnonymizeBtn = document.getElementById('confirmAnonymizeBtn');
	if (confirmAnonymizeBtn) {
		confirmAnonymizeBtn.addEventListener('click', anonymizeUserData);
	}
	const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
	const deleteConfirmationInput = document.getElementById('deleteConfirmationInput');
	if (confirmDeleteBtn && deleteConfirmationInput) {
		deleteConfirmationInput.addEventListener('input', function () {
			const confirmationText = window.languageManager.getCurrentLanguage() === 'es' ?
				'ELIMINAR MI CUENTA' : 'DELETE MY ACCOUNT';
			confirmDeleteBtn.disabled = this.value !== confirmationText;
		});
		confirmDeleteBtn.addEventListener('click', function () {
			const confirmationText = window.languageManager.getCurrentLanguage() === 'es' ?
				'ELIMINAR MI CUENTA' : 'DELETE MY ACCOUNT';
			if (deleteConfirmationInput.value === confirmationText) {
				deleteAccount(confirmationText);
			}
		});
	}
}

export function showAnonymizeConfirmation() {
	const modal = document.getElementById('anonymizeModal');
	modal.style.display = 'flex';
}

export function hideAnonymizeConfirmation() {
	document.getElementById('anonymizeModal').style.display = 'none';
}


export function showDeleteConfirmation() {
	const modal = document.getElementById('deleteModal');
	const input = document.getElementById('deleteConfirmationInput');
	const button = document.getElementById('confirmDeleteBtn');
	const confirmationText = window.languageManager.getCurrentLanguage() === 'es' ?
		'ELIMINAR MI CUENTA' : 'DELETE MY ACCOUNT';
	input.placeholder = confirmationText;
	input.value = '';
	button.disabled = true;
	modal.style.display = 'flex';
	input.focus();
}

export function hideDeleteConfirmation() {
	document.getElementById('deleteModal').style.display = 'none';
}

export async function deleteAccount(confirmationText) {
	try {
		showMessage(window.languageManager.getTranslation('gdpr.deletingAccount'), 'success');
		const response = await fetch('/gdpr/delete-account', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ confirmation: confirmationText })
		});
		const result = await response.json();
		if (result.success) {
			showMessage(window.languageManager.getTranslation('messages.accountDeleted'), 'success');
			setTimeout(() => {
				window.location.href = '/auth/logout';
			}, 2000);
		} else {
			showMessage(window.languageManager.getTranslation(result.error), 'error');
		}
	} catch (error) {
		console.error('Error deleting account:', error);
		showMessage(window.languageManager.getTranslation('messages.connectionError'), 'error');
	}
}

export function displayUserData(data) {
	const summaryDiv = document.getElementById('userDataSummary');
	if (data && data.dataSummary) {
		summaryDiv.innerHTML = `
            <div class="data-grid">
                <div class="data-item">
                    <span data-i18n="gdpr.sessions"></span>
                    <span>${data.dataSummary.activity.sessionCount}</span>
                </div>
                <div class="data-item">
                    <span data-i18n="gdpr.accountCreated"></span>
                    <span>${new Date(data.dataSummary.activity.accountCreated).toLocaleDateString()}</span>
                </div>
                <div class="data-item">
                    <span data-i18n="gdpr.lastUpdated"></span>
                    <span>${new Date(data.dataSummary.activity.lastUpdated).toLocaleDateString()}</span>
                </div>
            </div>
        `;
		if (window.languageManager && window.languageManager.applyTranslations) {
			window.languageManager.applyTranslations();
		}
	}
}

window.setupConsentForm = setupConsentForm;
window.showAnonymizeConfirmation = showAnonymizeConfirmation;
window.hideAnonymizeConfirmation = hideAnonymizeConfirmation;
window.anonymizeUserData = anonymizeUserData;
window.showDeleteConfirmation = showDeleteConfirmation;
window.hideDeleteConfirmation = hideDeleteConfirmation;
window.deleteAccount = deleteAccount;
window.exportUserData = exportUserData;
window.showMessage = showMessage;
window.loadUserConsent = loadUserConsent;
