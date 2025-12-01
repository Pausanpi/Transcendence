import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import db from '../config/sqlite.js';
import bcrypt from 'bcrypt';

class TwoFactorService {
	generateSecret(user) {
		const issuer = 'SecureApp';
		const accountName = (user.email || user.username).replace(/[^a-zA-Z0-9@.]/g, '');
		const secret = speakeasy.generateSecret({
			name: `${issuer}:${accountName}`,
			issuer: issuer,
			length: 20
		});
		return {
			secret: secret.base32,
			otpauth_url: secret.otpauth_url
		};
	}

	async generateQRCode(otpauthUrl) {
		try {
			return await QRCode.toDataURL(otpauthUrl);
		} catch (error) {
			console.error('Error generating QR code:', error);
			throw new Error('QR code generation failed');
		}
	}

	verifyToken(secret, token, window = 2) {
		try {
			if (!secret || !token) {
				return false;
			}
			return speakeasy.totp.verify({
				secret: secret,
				encoding: 'base32',
				token: token,
				window: window,
				step: 30
			});
		} catch (error) {
			console.error('Error verifying token:', error);
			return false;
		}
	}

	generateBackupCodes(count = 8) {
		const codes = [];
		for (let i = 0; i < count; i++) {
			const part1 = Math.floor(10000 + Math.random() * 90000).toString();
			const part2 = Math.floor(100 + Math.random() * 900).toString();
			codes.push(`${part1}-${part2}`);
		}
		return codes;
	}

	async saveBackupCodes(userId, codes) {
		try {
			await db.run('DELETE FROM backup_codes WHERE user_id = ?', [userId]);
			for (const code of codes) {
				const hashedCode = await bcrypt.hash(code, 10);
				await db.run(
					'INSERT INTO backup_codes (user_id, code_hash, used) VALUES (?, ?, 0)',
					[userId, hashedCode]
				);
			}
			return true;
		} catch (error) {
			console.error('Error saving backup codes:', error);
			return false;
		}
	}

	async verifyBackupCode(userId, code) {
		try {
			const rows = await db.all(
				'SELECT id, code_hash FROM backup_codes WHERE user_id = ? AND used = 0',
				[userId]
			);
			for (const row of rows) {
				const isValid = await bcrypt.compare(code, row.code_hash);
				if (isValid) {
					await db.run('UPDATE backup_codes SET used = 1 WHERE id = ?', [row.id]);
					return true;
				}
			}
			return false;
		} catch (error) {
			console.error('Error verifying backup code:', error);
			return false;
		}
	}

	async getRemainingBackupCodes(userId) {
		try {
			const rows = await db.all(
				'SELECT COUNT(*) as count FROM backup_codes WHERE user_id = ? AND used = 0',
				[userId]
			);
			return rows[0]?.count || 0;
		} catch (error) {
			return 0;
		}
	}

	async clearBackupCodes(userId) {
		try {
			await db.run('DELETE FROM backup_codes WHERE user_id = ?', [userId]);
			return true;
		} catch (error) {
			return false;
		}
	}

	async getBackupCodes(userId) {
		try {
			const rows = await db.all(
				'SELECT code_hash FROM backup_codes WHERE user_id = ? AND used = 0',
				[userId]
			);
			return rows.map(row => row.code_hash);
		} catch (error) {
			return [];
		}
	}
}

export default new TwoFactorService();
