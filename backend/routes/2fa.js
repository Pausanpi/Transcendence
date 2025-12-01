import twoFactorService from '../services/twoFactor.js';
import { authenticateJWT } from '../middleware/auth.js';
import { findUserById, updateUser } from '../models/User.js';
import jwtService from '../services/jwt.js';

export default async function twoFactorRoutes(fastify) {
	fastify.post('/verify-login', async (request, reply) => {
		try {
			const { token, userId, isBackupCode = false } = request.body;

			if (!token || !userId) {
				return reply.status(400).send({
					success: false,
					error: '2fa.tokenUserIdRequired'
				});
			}

			const user = await findUserById(userId);
			if (!user) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}

			if (!user.two_factor_enabled && !isBackupCode) {
				return reply.status(400).send({
					success: false,
					error: '2fa.notEnabled'
				});
			}

			let isValid = false;
			let usedBackupCode = false;
			let remainingBackupCodes = 0;

			if (isBackupCode) {
				isValid = await twoFactorService.verifyBackupCode(user.id, token);
				usedBackupCode = isValid;
				if (isValid) {
					remainingBackupCodes = await twoFactorService.getRemainingBackupCodes(user.id);
				}
			} else {
				isValid = twoFactorService.verifyToken(user.two_factor_secret, token);
			}

			if (isValid) {
				request.session.twoFactorVerified = true;
				request.session.pending2FAUserId = null;

				const jwtToken = await jwtService.generateToken({
					id: user.id,
					username: user.username,
					email: user.email,
					twoFactorEnabled: true
				});

				request.session.jwtToken = jwtToken;

				return {
					success: true,
					usedBackupCode,
					remainingBackupCodes
				};
			} else {
				return reply.status(400).send({
					success: false,
					error: 'messages.invalid2FAToken'
				});
			}
		} catch (error) {
			console.error('2FA verification error:', error);
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/setup', {
		preHandler: authenticateJWT
	}, async (request, reply) => {
		try {
			const user = request.user;
			if (!user) {
				return reply.status(401).send({
					success: false,
					error: 'messages.authError'
				});
			}

			const dbUser = await findUserById(user.id);
			if (!dbUser) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}

			if (dbUser.two_factor_enabled) {
				return reply.status(400).send({
					success: false,
					error: '2fa.alreadyEnabled'
				});
			}

			const { secret, otpauth_url } = twoFactorService.generateSecret(dbUser);
			const qrCode = await twoFactorService.generateQRCode(otpauth_url);

			request.session.pendingTwoFactor = {
				secret,
				userId: dbUser.id,
				createdAt: Date.now()
			};

			return {
				success: true,
				secret,
				qrCode
			};
		} catch (err) {
			console.error('2FA setup error:', err);
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.get('/management', async (request, reply) => {
		if (!request.isAuthenticated || !request.isAuthenticated()) {
			return reply.redirect('/');
		}
		return reply.sendFile('auth/2fa-management.html');
	});

	fastify.post('/verify', {
		preHandler: authenticateJWT
	}, async (request, reply) => {
		try {
			const user = request.user;
			const { token } = request.body;

			if (!user) {
				return reply.status(401).send({
					success: false,
					error: 'messages.authError'
				});
			}

			if (!token) {
				return reply.status(400).send({
					success: false,
					error: '2fa.tokenRequired'
				});
			}

			const sessionData = request.session?.pendingTwoFactor;
			if (!sessionData || sessionData.userId !== user.id) {
				return reply.status(400).send({
					success: false,
					error: '2fa.setupExpired'
				});
			}

			const isValid = twoFactorService.verifyToken(sessionData.secret, token);
			if (!isValid) {
				return reply.status(400).send({
					success: false,
					error: 'messages.invalid2FAToken'
				});
			}

			const dbUser = await findUserById(user.id);
			await updateUser(dbUser.id, {
				two_factor_enabled: true,
				two_factor_secret: sessionData.secret
			});

			const backupCodes = twoFactorService.generateBackupCodes();
			await twoFactorService.saveBackupCodes(dbUser.id, backupCodes);

			delete request.session.pendingTwoFactor;

			return {
				success: true,
				message: 'messages.2FASetupSuccess',
				backupCodes: backupCodes
			};
		} catch (err) {
			console.error('2FA verification error:', err);
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/disable', {
		preHandler: authenticateJWT
	}, async (request, reply) => {
		try {
			const user = request.user;
			const { token } = request.body;

			if (!user) {
				return reply.status(401).send({
					success: false,
					error: 'messages.authError'
				});
			}

			if (!token) {
				return reply.status(400).send({
					success: false,
					error: '2fa.tokenRequired'
				});
			}

			const dbUser = await findUserById(user.id);
			if (!dbUser || !dbUser.two_factor_enabled) {
				return reply.status(400).send({
					success: false,
					error: '2fa.notEnabled'
				});
			}

			if (!dbUser.two_factor_secret) {
				return reply.status(400).send({
					success: false,
					error: '2fa.invalidSetup'
				});
			}

			const isValid = twoFactorService.verifyToken(dbUser.two_factor_secret, token);
			if (!isValid) {
				return reply.status(400).send({
					success: false,
					error: 'messages.invalid2FAToken'
				});
			}

			await updateUser(dbUser.id, {
				two_factor_enabled: false,
				two_factor_secret: null
			});

			await twoFactorService.clearBackupCodes(dbUser.id);

			return {
				success: true,
				message: 'messages.2faDisabled'
			};
		} catch (err) {
			console.error('2FA disable error:', err);
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/refresh-qr', {
		preHandler: authenticateJWT
	}, async (request, reply) => {
		try {
			const user = request.user;
			if (!user) {
				return reply.status(401).send({
					success: false,
					error: 'messages.authError'
				});
			}

			const dbUser = await findUserById(user.id);
			const { secret, otpauth_url } = twoFactorService.generateSecret(dbUser);
			const qrCode = await twoFactorService.generateQRCode(otpauth_url);

			request.session.pendingTwoFactor = {
				secret,
				userId: dbUser.id,
				createdAt: Date.now()
			};

			return {
				success: true,
				secret,
				qrCode
			};
		} catch (err) {
			console.error('QR refresh error:', err);
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/backup-codes/generate', {
		preHandler: authenticateJWT
	}, async (request, reply) => {
		try {
			const user = request.user;
			if (!user) {
				return reply.status(401).send({
					success: false,
					error: 'messages.authError'
				});
			}

			const dbUser = await findUserById(user.id);
			if (!dbUser || !dbUser.two_factor_enabled) {
				return reply.status(400).send({
					success: false,
					error: '2fa.notEnabled'
				});
			}

			const backupCodes = twoFactorService.generateBackupCodes();
			await twoFactorService.saveBackupCodes(dbUser.id, backupCodes);

			return {
				success: true,
				codes: backupCodes
			};
		} catch (err) {
			console.error('Backup codes generation error:', err);
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});
}
