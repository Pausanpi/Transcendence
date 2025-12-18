export async function loadUserData() {
    try {
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
            }
            catch {
                errorData = { error: errorText };
            }
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
        else {
            throw new Error(result.error);
        }
    }
    catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}
export async function exportUserData() {
    try {
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
        const response = await fetch('/gdpr/anonymize', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        const result = await response.json();
        if (result.success) {
            showGDPRMessage('messages.dataAnonymized', 'success');
            setTimeout(() => {
                document.cookie = 'auth_jwt=; path=/; max-age=0';
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
        const response = await fetch('/gdpr/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ confirmation: confirmationText })
        });
        const result = await response.json();
        if (result.success) {
            showGDPRMessage('messages.accountDeleted', 'success');
            setTimeout(() => {
                document.cookie = 'auth_jwt=; path=/; max-age=0';
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
        const response = await fetch('/gdpr/user-consent', {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok)
            return null;
        const result = await response.json();
        if (!result.success || !result.consent)
            return null;
        return result.consent;
    }
    catch (error) {
        console.error('Error loading user consent:', error);
        return null;
    }
}
export async function updateConsent(consentData) {
    try {
        const response = await fetch('/gdpr/update-consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(consentData)
        });
        const result = await response.json();
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
