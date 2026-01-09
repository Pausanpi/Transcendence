class ValidationService {
	validateEmail(email) {
		if (!email || typeof email !== 'string') {
			return { isValid: false, error: 'validation.emailRequired' };
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return { isValid: false, error: 'validation.invalidEmailFormat' };
		}
		const tempEmailDomains = [
			'tempmail.com', 'guerrillamail.com', 'mailinator.com',
			'10minutemail.com', 'yopmail.com', 'throwaway.com'
		];
		const domain = email.split('@')[1].toLowerCase();
		if (tempEmailDomains.some(temp => domain.includes(temp))) {
			return { isValid: false, error: 'validation.temporaryEmailNotAllowed' };
		}
		return { isValid: true };
	}

	validateUsername(username) {
		if (!username || typeof username !== 'string') {
			return { isValid: false, error: 'validation.usernameRequired' };
		}
		if (username.length < 3 || username.length > 30) {
			return { isValid: false, error: 'validation.usernameLength' };
		}
		const usernameRegex = /^[a-zA-Z0-9_-]+$/;
		if (!usernameRegex.test(username)) {
			return { isValid: false, error: 'validation.usernameInvalidChars' };
		}
		const reservedUsernames = [
			'admin', 'administrator', 'root', 'system', 'support',
			'help', 'contact', 'api', 'oauth', 'auth'
		];
		if (reservedUsernames.includes(username.toLowerCase())) {
			return { isValid: false, error: 'validation.usernameReserved' };
		}
		return { isValid: true };
	}

	validate2FAToken(token) {
		if (!token || typeof token !== 'string') {
			return { isValid: false, error: '2FA token is required' };
		}
		const tokenRegex = /^[0-9]{6}$/;
		if (!tokenRegex.test(token)) {
			return { isValid: false, error: '2FA token must be 6 digits' };
		}
		return { isValid: true };
	}

	sanitizeHtml(input) {
		if (typeof input !== 'string') return input;
		return input
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;')
			.replace(/\//g, '&#x2F;');
	}
}

export default new ValidationService();
