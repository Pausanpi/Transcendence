import jwt from 'jsonwebtoken';
import vaultClient from './vault-client.js';

class JWTService {
	constructor() {
		this.secret = null;
		this.secretLoaded = false;
		this.loadSecret();
	}

	async loadSecret() {
		try {
			this.secret = process.env.JWT_SECRET;
			if (!this.secret && vaultClient) {
				const secret = await vaultClient.getSecret('jwt/secret');
				if (secret && secret.jwt_secret) {
					this.secret = secret.jwt_secret;
				}
			}
			if (!this.secret) {
				this.secret = 'dev-fallback-secret-' + Math.random().toString(36).substring(2);
			}
			this.secretLoaded = true;
		} catch (err) {
			this.secret = process.env.JWT_SECRET || 'emergency-secret-' + Date.now();
			this.secretLoaded = true;
		}
	}

	async ensureSecretLoaded() {
		if (!this.secretLoaded) {
			await this.loadSecret();
		}
		return !!this.secret;
	}

	isValidTokenFormat(token) {
		if (!token || typeof token !== 'string') return false;
		const parts = token.split('.');
		return parts.length === 3;
	}

async generateToken(payload = {}, options = {}) {
    const ok = await this.ensureSecretLoaded();
    if (!ok) throw new Error('JWT secret not available');

    const tokenPayload = { ...payload };
    const jwtOptions = {
        expiresIn: options.expiresIn || '7d',
        issuer: options.issuer || 'auth-service',
        audience: options.audience || 'user'
    };

    return jwt.sign(tokenPayload, this.secret, jwtOptions);
}

async verifyToken(token) {
    if (!this.isValidTokenFormat(token)) return null;
    const ok = await this.ensureSecretLoaded();
    if (!ok) return null;

    try {
        return jwt.verify(token, this.secret, {
            issuer: 'auth-service',
            audience: 'user'
        });
    } catch (error) {
        return null;
    }
}

	decodeToken(token) {
		if (!this.isValidTokenFormat(token)) return null;
		return jwt.decode(token);
	}
}

export default new JWTService();
