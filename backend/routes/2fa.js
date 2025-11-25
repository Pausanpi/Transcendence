import { authenticateJWT } from '../middleware/auth.js';
import { findUserById, updateUser } from '../models/User.js';
import emailService from '../services/email.js';
import jwtService from '../services/jwt.js';
import twoFactorService from '../services/twoFactor.js';
export default async function twoFARoutes(fastify, options) {
	fastify.get('/management', async (request, reply) => {
		if (!request.isAuthenticated()) return reply.redirect('/');
		const user = await findUserById(request.user.id);
		if (user && user.twoFactorEnabled && !request.session.twoFactorVerified) {
			request.session.pending2FAUserId = user.id;
			return reply.redirect('/auth/2fa-required');
		}
		return reply.sendFile('auth/2fa-management.html');
	});
	fastify.post('/setup', { preHandler: authenticateJWT }, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user) return reply.status(404).send({ error: 'messages.userNotFound', code: 'USER_NOT_FOUND' });
			if (user.twoFactorEnabled) return reply.status(400).send({ error: '2fa.alreadyEnabled', code: '2FA_ALREADY_ENABLED' });
			const secretData = twoFactorService.generateSecret(user);
			const qrCode = await twoFactorService.generateQRCode(secretData.otpauth_url);
			request.session.pendingTwoFactor = {
				secret: secretData.secret,
				createdAt: Date.now()
			};
			return {
				success: true,
				secret: secretData.secret,
				qrCode,
				message: '2fa.scanQRMessage',
				expiresIn: 5 * 60 * 1000,
				sessionInfo: {
					sessionId: request.session.sessionId,
					secretSaved: !!request.session.pendingTwoFactor?.secret
				}
			};
		} catch (error) {
			fastify.log.error('2fa.setup error', error);
			return reply.status(500).send({ error: 'common.internalError', code: 'SETUP_ERROR' });
		}
	});
	fastify.post('/refresh-qr', { preHandler: authenticateJWT }, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user) return reply.status(404).send({ error: 'messages.userNotFound', code: 'USER_NOT_FOUND' });
			if (user.twoFactorEnabled) return reply.status(400).send({ error: '2fa.alreadyEnabled', code: '2FA_ALREADY_ENABLED' });
			let pending = request.session.pendingTwoFactor;
			const now = Date.now();
			if (!pending || (now - (pending.createdAt || 0)) > 5 * 60 * 1000) {
				const secretData = twoFactorService.generateSecret(user);
				pending = { secret: secretData.secret, createdAt: now };
				request.session.pendingTwoFactor = pending;
			}
			const otpauthUrl = `otpauth://totp/OAuthApp:${encodeURIComponent(user.email || user.username)}?secret=${pending.secret}&issuer=${encodeURIComponent('OAuthApp')}&algorithm=SHA1&digits=6&period=30`;
			const qrCode = await twoFactorService.generateQRCode(otpauthUrl);
			return {
				success: true,
				secret: pending.secret,
				qrCode,
				message: '2fa.qrRefreshed',
				expiresIn: Math.max(0, 5 * 60 * 1000 - (now - pending.createdAt || 0))
			};
		} catch (error) {
			fastify.log.error('2fa.refresh-qr error', error);
			return reply.status(500).send({ error: 'common.internalError', code: 'QR_REFRESH_ERROR' });
		}
	});
	fastify.post('/verify', { preHandler: authenticateJWT }, async (request, reply) => {
		try {
			const { token } = request.body;
			if (!token) return reply.status(400).send({ error: '2fa.tokenRequired', code: 'TOKEN_REQUIRED' });
			if (!/^\d{6}$/.test(String(token).trim())) return reply.status(400).send({ error: 'messages.sixDigitsRequired', code: 'INVALID_TOKEN_FORMAT' });
			const user = await findUserById(request.user.id);
			if (!user) return reply.status(404).send({ error: 'messages.userNotFound', code: 'USER_NOT_FOUND' });
			const pending = request.session.pendingTwoFactor;
			if (!pending || !pending.secret) {
				return reply.status(400).send({
					error: '2fa.setupExpired',
					code: 'SETUP_NOT_STARTED'
				});
			}
			const verified = twoFactorService.verifyToken(pending.secret, token, 1);
			if (!verified) {
				return reply.status(400).send({
					error: 'messages.invalid2FAToken',
					code: 'INVALID_2FA_TOKEN'
				});
			}
			const backupCodes = twoFactorService.generateBackupCodes();
			await updateUser(user.id, {
				twoFactorEnabled: true,
				twoFactorSecret: pending.secret,
				backupCodes,
				usedBackupCodes: []
			});
			delete request.session.pendingTwoFactor;
			try { await emailService.sendBackupCodesEmail(user.email, backupCodes); } catch (e) { fastify.log.warn('backup email failed', e); }
			return { success: true, backupCodes, message: 'messages.2FASetupSuccess' };
		} catch (error) {
			fastify.log.error('2fa.verify error', error);
			return reply.status(500).send({ error: 'common.internalError', code: 'VERIFICATION_ERROR' });
		}
	});
	fastify.post('/verify-login', async (request, reply) => {
		try {
			const { token, userId, isBackupCode } = request.body;
			const targetUserId = request.session.pending2FAUserId || userId;
			if (!token || !targetUserId) return reply.status(400).send({ error: '2fa.tokenUserIdRequired', code: 'TOKEN_USERID_REQUIRED' });
			const user = await findUserById(targetUserId);
			if (!user) return reply.status(404).send({ error: 'messages.userNotFound', code: 'USER_NOT_FOUND' });
			if (!user.twoFactorEnabled || !user.twoFactorSecret) {
				return reply.status(400).send({ error: '2fa.notEnabled', code: '2FA_NOT_ENABLED' });
			}
			let isValid = false;
			let usedBackupCode = false;
			let remainingBackupCodes = 0;
			if (isBackupCode) {
				if (Array.isArray(user.backupCodes) && user.backupCodes.includes(token)) {
					isValid = true;
					usedBackupCode = true;
					const updatedBackupCodes = user.backupCodes.filter(c => c !== token);
					const updatedUsed = (user.usedBackupCodes || []).concat([token]);
					await updateUser(user.id, { backupCodes: updatedBackupCodes, usedBackupCodes: updatedUsed });
					remainingBackupCodes = updatedBackupCodes.length;
				}
			} else {
				isValid = twoFactorService.verifyToken(user.twoFactorSecret, token, 1);
				if (!isValid && Array.isArray(user.backupCodes) && user.backupCodes.includes(token)) {
					isValid = true;
					usedBackupCode = true;
					const updatedBackupCodes = user.backupCodes.filter(c => c !== token);
					const updatedUsed = (user.usedBackupCodes || []).concat([token]);
					await updateUser(user.id, { backupCodes: updatedBackupCodes, usedBackupCodes: updatedUsed });
					remainingBackupCodes = updatedBackupCodes.length;
				}
			}
			if (!isValid) {
				return reply.status(400).send({ error: 'messages.invalid2FAToken', code: 'INVALID_2FA_TOKEN' });
			}
			await request.logIn(user);
			request.session.twoFactorVerified = true;
			request.session.twoFactorVerifiedAt = new Date();
			const jwtToken = await jwtService.generateToken({
				id: user.id,
				username: user.username,
				email: user.email,
				twoFactorEnabled: true,
				twoFactorVerified: true
			});
			request.session.jwtToken = jwtToken;
			delete request.session.pending2FAUserId;
			return {
				success: true,
				token: jwtToken,
				usedBackupCode,
				remainingBackupCodes,
				message: '2fa.verificationSuccess'
			};
		} catch (error) {
			fastify.log.error('2fa.verify-login error', error);
			return reply.status(500).send({ error: 'common.internalError', code: 'VERIFY_LOGIN_ERROR' });
		}
	});
	fastify.post('/disable', { preHandler: authenticateJWT }, async (request, reply) => {
		try {
			const { token } = request.body;
			if (!token) return reply.status(400).send({ error: '2fa.tokenRequired', code: 'TOKEN_REQUIRED' });
			if (!/^\d{6}$/.test(String(token).trim())) return reply.status(400).send({ error: 'messages.sixDigitsRequired', code: 'INVALID_TOKEN_FORMAT' });

			const user = await findUserById(request.user.id);
			if (!user) return reply.status(404).send({ error: 'messages.userNotFound', code: 'USER_NOT_FOUND' });

			if (!user.twoFactorEnabled) {
				return reply.status(400).send({ error: '2fa.notEnabled', code: '2FA_NOT_ENABLED' });
			}

			const verified = twoFactorService.verifyToken(user.twoFactorSecret, token, 1);
			if (!verified) {
				return reply.status(400).send({ error: 'messages.invalid2FAToken', code: 'INVALID_2FA_TOKEN' });
			}

			await updateUser(user.id, {
				twoFactorEnabled: false,
				twoFactorSecret: null,
				backupCodes: [],
				usedBackupCodes: []
			});

			return { success: true, message: 'messages.2FADisabled' };
		} catch (error) {
			fastify.log.error('2fa.disable error', error);
			return reply.status(500).send({ error: 'common.internalError', code: 'DISABLE_ERROR' });
		}
	});
	fastify.post('/generate-backup-codes', { preHandler: authenticateJWT }, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user) return reply.status(404).send({ error: 'messages.userNotFound', code: 'USER_NOT_FOUND' });

			if (!user.twoFactorEnabled) {
				return reply.status(400).send({ error: '2fa.notEnabled', code: '2FA_NOT_ENABLED' });
			}

			const backupCodes = twoFactorService.generateBackupCodes();
			await updateUser(user.id, { backupCodes });

			try {
				await emailService.sendBackupCodesEmail(user.email, backupCodes);
			} catch (e) {
				fastify.log.warn('backup email failed', e);
			}

			return { success: true, backupCodes, message: 'messages.backupCodesGenerated' };
		} catch (error) {
			fastify.log.error('2fa.generate-backup-codes error', error);
			return reply.status(500).send({ error: 'common.internalError', code: 'BACKUP_CODES_ERROR' });
		}
	});
}
