import { api } from './api.js';
export async function loadUserData() {
    try {
        const data = await api('/api/gdpr/user-data');
        if (data.success) {
            return data.data;
        }
        else {
            throw new Error(data.error);
        }
    }
    catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}
export async function exportUserData() {
    try {
        const result = await api('/api/gdpr/export-data', {
            method: 'POST',
	        body: JSON.stringify('')
        });
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
            showGDPRMessage('messages.dataExported', 'success');
        }
        else {
            throw new Error(result.error);
        }
    }
    catch (error) {
        console.error('Error exporting data:', error);
        showGDPRMessage('gdpr.exportError', 'error');
    }
}
export async function anonymizeUserData() {
    try {
        const result = await api('/api/gdpr/anonymize', {
            method: 'POST',
            body: JSON.stringify('')
        });
        if (result.success) {
            showGDPRMessage('messages.dataAnonymized', 'success');
            setTimeout(() => {
                localStorage.removeItem('auth_token');
                window.location.href = '/';
            }, 3000);
        }
        else {
            showGDPRMessage(result.error, 'error');
        }
    }
    catch (error) {
        console.error('Error anonymizing data:', error);
        showGDPRMessage('messages.connectionError', 'error');
    }
}
export async function deleteAccount(confirmationText) {
    try {
        const result = await api('/api/gdpr/delete-account', {
            method: 'POST',
            body: JSON.stringify({ confirmation: confirmationText })
        });
        if (result.success) {
            showGDPRMessage('messages.accountDeleted', 'success');
            setTimeout(() => {
                localStorage.removeItem('auth_token');
                window.location.href = '/';
            }, 2000);
        }
        else {
            showGDPRMessage(result.error, 'error');
        }
    }
    catch (error) {
        console.error('Error deleting account:', error);
        showGDPRMessage('messages.connectionError', 'error');
    }
}
export async function loadUserConsent() {
    try {
        const data = await api('/api/gdpr/user-consent');
        if (data.success) {
            return data.consent;
        }
        return null;
    }
    catch (error) {
        console.error('Error loading user consent:', error);
        return null;
    }
}
export async function updateConsent(consentData) {
    try {
        const result = await api('/api/gdpr/update-consent', {
            method: 'POST',
            body: JSON.stringify(consentData)
        });
        if (result.success) {
            showGDPRMessage('messages.preferencesUpdated', 'success');
            return true;
        }
        else {
            showGDPRMessage(result.error, 'error');
            return false;
        }
    }
    catch (error) {
        console.error('Error updating consent:', error);
        showGDPRMessage('messages.connectionError', 'error');
        return false;
    }
}
function showGDPRMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white z-50`;
    const translatedMessage = window.languageManager?.t(message) || message;
    messageDiv.textContent = translatedMessage;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}
window.exportUserData = exportUserData;
window.anonymizeUserData = anonymizeUserData;
window.deleteAccount = deleteAccount;
