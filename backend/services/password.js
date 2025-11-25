import bcrypt from 'bcrypt';

class PasswordService {
	constructor() {
		this.saltRounds = 12;
	}
	async hashPassword(password) {
		try {
			if (!password || typeof password !== 'string') {
				throw new Error('Password must be a non-empty string');
			}
			if (password.length < 8) {
				throw new Error('Password must be at least 8 characters long');
			}
			const salt = await bcrypt.genSalt(this.saltRounds);
			const hashedPassword = await bcrypt.hash(password, salt);
			return hashedPassword;
		} catch (error) {
			console.error('Error hashing password:', error);
			throw error;
		}
	}
	async verifyPassword(password, hashedPassword) {
		try {
			if (!password || !hashedPassword) {
				return false;
			}
			return await bcrypt.compare(password, hashedPassword);
		} catch (error) {
			console.error('Error verifying password:', error);
			return false;
		}
	}
	validatePasswordStrength(password) {
		const minLength = 8;
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumbers = /\d/.test(password);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		const issues = [];

		if (password.length < minLength) {
			issues.push('validation.passwordMinLength');
		}
		if (!hasUpperCase) {
			issues.push('validation.passwordUppercase');
		}
		if (!hasLowerCase) {
			issues.push('validation.passwordLowercase');
		}
		if (!hasNumbers) {
			issues.push('validation.passwordNumber');
		}
		if (!hasSpecialChar) {
			issues.push('validation.passwordSpecialChar');
		}

		return {
			isValid: issues.length === 0,
			issues
		};
	}
}

export default new PasswordService();
