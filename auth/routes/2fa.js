import twoFactorService from '../services/twoFactor.js';
import { authenticateJWT } from '../middleware/auth.js';
import { findUserById, updateUser } from '../../users/models/User.js';
import jwtService from '../services/jwt.js';

export default async function twoFactorRoutes(fastify) {

	fastify.post('/verify-login', async (request, reply) => {
		try {
			const { token: totpToken, tempToken } = request.body;

			if (!totpToken || !tempToken) {
				return reply.status(400).send({
					success: false,
					error: '2fa.tokenRequired'
				});
			}

			const decoded = await jwtService.verifyToken(tempToken);
			if (!decoded?.temp2FA) {
				return reply.status(401).send({
					success: false,
					error: 'auth.invalidToken'
				});
			}

			const user = await findUserById(decoded.id);
			if (!user?.two_factor_enabled) {
				return reply.status(400).send({
					success: false,
					error: '2fa.notEnabled'
				});
			}

			const isValid = twoFactorService.verifyToken(user.two_factor_secret, totpToken);
			if (!isValid) {
				return reply.status(400).send({
					success: false,
					error: 'messages.invalid2FAToken'
				});
			}

			const finalToken = await jwtService.generateToken({
				id: user.id,
				username: user.username,
				email: user.email
			});

			return {
				success: true,
				token: finalToken,
				user: user.toSafeJSON()
			};
		} catch (error) {
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/setup', { preHandler: authenticateJWT }, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}

			if (user.two_factor_enabled) {
				return reply.status(400).send({
					success: false,
					error: '2fa.alreadyEnabled'
				});
			}

			const { secret, otpauth_url } = twoFactorService.generateSecret(user);
			const qrCode = await twoFactorService.generateQRCode(otpauth_url);

			return {
				success: true,
				secret,
				qrCode,
				setupToken: await jwtService.generateToken({
					userId: user.id,
					secret,
					setup2FA: true
				}, { expiresIn: '10m' })
			};
		} catch (err) {
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/verify', async (request, reply) => {
		try {
			const { token, setupToken } = request.body;

			const decoded = await jwtService.verifyToken(setupToken);
			if (!decoded?.setup2FA) {
				return reply.status(400).send({
					success: false,
					error: '2fa.setupExpired'
				});
			}

			const isValid = twoFactorService.verifyToken(decoded.secret, token);
			if (!isValid) {
				return reply.status(400).send({
					success: false,
					error: 'messages.invalid2FAToken'
				});
			}

			const user = await findUserById(decoded.userId);
			await updateUser(user.id, {
				two_factor_enabled: true,
				two_factor_secret: decoded.secret
			});

			const backupCodes = twoFactorService.generateBackupCodes();
			await twoFactorService.saveBackupCodes(user.id, backupCodes);

			return {
				success: true,
				message: 'messages.2FASetupSuccess',
				backupCodes
			};
		} catch (err) {
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/disable', { preHandler: authenticateJWT }, async (request, reply) => {
		try {
			const { token } = request.body;
			const user = await findUserById(request.user.id);

			if (!user?.two_factor_enabled) {
				return reply.status(400).send({
					success: false,
					error: '2fa.notEnabled'
				});
			}

			const isValid = twoFactorService.verifyToken(user.two_factor_secret, token);
			if (!isValid) {
				return reply.status(400).send({
					success: false,
					error: 'messages.invalid2FAToken'
				});
			}

			await updateUser(user.id, {
				two_factor_enabled: false,
				two_factor_secret: null
			});

			await twoFactorService.clearBackupCodes(user.id);

			return {
				success: true,
				message: 'messages.2faDisabled'
			};
		} catch (err) {
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/backup-codes/generate', { preHandler: authenticateJWT }, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user?.two_factor_enabled) {
				return reply.status(400).send({
					success: false,
					error: '2fa.notEnabled'
				});
			}

			const backupCodes = twoFactorService.generateBackupCodes();
			await twoFactorService.saveBackupCodes(user.id, backupCodes);

			return {
				success: true,
				codes: backupCodes
			};
		} catch (err) {
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});
}
