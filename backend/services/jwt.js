import jwt from 'jsonwebtoken';
import vaultClient from './vault-client.js';

class JWTService {
	constructor() {
		this.secret = null;
		this.secretLoaded = false;
		this.loadingPromise = null;
		this.loadSecret();
	}
	async loadSecret() {
		if (this.loadingPromise) {
			return this.loadingPromise;
		}
		this.loadingPromise = (async () => {
			try {
				this.secret = process.env.JWT_SECRET;
				if (!this.secret) {
					const secret = await vaultClient.getSecret('jwt/secret');
					if (secret && secret.jwt_secret) {
						this.secret = secret.jwt_secret;
					}
				} else {
				}
				if (!this.secret) {
					this.secret = 'dev-fallback-secret-' + Math.random().toString(36).substring(2);
					console.warn('Using temporary development JWT secrets');
				}
				this.secretLoaded = true;
				if (!process.env.JWT_SECRET) {
					try {
						await vaultClient.setSecret('jwt/secret', { jwt_secret: this.secret });
					} catch (vaultError) {
					}
				}
			} catch (error) {
				console.error('Error loading JWT secret:', error);
				this.secret = process.env.JWT_SECRET || 'emergency-secret-' + Date.now();
				this.secretLoaded = true;
			} finally {
				this.loadingPromise = null;
			}
		})();
		return this.loadingPromise;
	}
	async ensureSecretLoaded() {
		if (this.secretLoaded && this.secret) {
			return true;
		}
		if (this.loadingPromise) {
			await this.loadingPromise;
			return !!this.secret;
		}
		await this.loadSecret();
		return !!this.secret;
	}
	async loadSecret() {
		if (this.loadingPromise) {
			return this.loadingPromise;
		}
		this.loadingPromise = (async () => {
			try {
				this.secret = process.env.JWT_SECRET;
				if (!this.secret) {
					const secret = await vaultClient.getSecret('jwt/secret');
					if (secret && secret.jwt_secret) {
						this.secret = secret.jwt_secret;
					}
				} else {
				}
				if (!this.secret) {
					this.secret = 'dev-fallback-secret-' + Math.random().toString(36).substring(2);
					console.warn('Using temporary development JWT secret');
					if (!process.env.JWT_SECRET) {
						try {
							await vaultClient.setSecret('jwt/secret', { jwt_secret: this.secret });
						} catch (vaultError) {
						}
					}
				}
				this.secretLoaded = true;
			} catch (error) {
				console.error('Error loading JWT secret:', error);
				this.secret = process.env.JWT_SECRET || 'emergency-secret-' + Date.now();
				this.secretLoaded = true;
			} finally {
				this.loadingPromise = null;
			}
		})();
		return this.loadingPromise;
	}
	async verifyToken(token) {
		try {
			if (!this.isValidTokenFormat(token)) {
				console.error('Invalid token format');
				return null;
			}
			const secretReady = await this.ensureSecretLoaded();
			if (!secretReady || !this.secret) {
				console.error('JWT secret not available for verification');
				return null;
			}
			const decoded = jwt.verify(token, this.secret, {
				issuer: 'web-app',
				audience: 'user',
				ignoreExpiration: false
			});
			return decoded;
		} catch (error) {
			console.error('JWT verification error:', error.message);
			console.error('Error details:', error);
			return null;
		}
	}
	isValidTokenFormat(token) {
		if (!token || typeof token !== 'string') {
			return false;
		}
		const parts = token.split('.');
		if (parts.length !== 3) {
			return false;
		}
		try {
			parts.forEach(part => {
				Buffer.from(part, 'base64').toString('utf-8');
			});
			return true;
		} catch {
			return false;
		}
	}
	async generateToken(payload, options = {}) {
		try {
			const secretReady = await this.ensureSecretLoaded();
			if (!secretReady) {
				throw new Error('JWT secret not available');
			}
			const tokenPayload = {
				...payload,
				iat: Math.floor(Date.now() / 1000),
			};
			const defaultOptions = {
				expiresIn: options.expiresIn || '7d',
				issuer: 'web-app',
				audience: 'user'
			};
			const jwtOptions = { ...defaultOptions, ...options };
			const token = jwt.sign(tokenPayload, this.secret, jwtOptions);
			return token;
		} catch (error) {
			console.error('Error generating JWT token:', error);
			throw error;
		}
	}
	decodeToken(token) {
		try {
			if (!this.isValidTokenFormat(token)) {
				return null;
			}
			return jwt.decode(token);
		} catch (error) {
			console.error('Error decoding token:', error.message);
			return null;
		}
	}
	async inspectToken(token) {
		if (!this.isValidTokenFormat(token)) {
			return { valid: false, reason: 'Invalid format' };
		}
		const decoded = this.decodeToken(token);
		if (!decoded) {
			return { valid: false, reason: 'Could not be decoded' };
		}
		return {
			valid: true,
			header: decoded.header,
			payload: decoded,
			expires: decoded.exp ? new Date(decoded.exp * 1000) : null,
			issued: decoded.iat ? new Date(decoded.iat * 1000) : null
		};
	}
}

export default new JWTService();
