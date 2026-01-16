import jwtService from '../services/jwt.js';
import {
	saveUser,
	findUserById,
	findUserByEmail,
	incrementLoginAttempts,
	resetLoginAttempts,
	findOrCreateOAuthUser
} from '../../users/models/User.js';
import { validateLogin, validateRegistration } from '../middleware/validation.js';
import fastifyPassport from '@fastify/passport';
import { configurePassport } from '../config/oauth.js';



export default async function authRoutes(fastify, options) {




	fastify.post('/login', { preHandler: validateLogin }, async (request, reply) => {
		const { email, password } = request.body;

		try {
			const user = await findUserByEmail(email);
			if (!user) {
				return reply.status(401).send({
					success: false,
					error: 'messages.invalidCredentials'
				});
			}

			if (user.isAccountLocked()) {
				return reply.status(423).send({
					success: false,
					error: 'auth.accountLocked'
				});
			}

			const isValidPassword = await user.verifyPassword(password);
			if (!isValidPassword) {
				await incrementLoginAttempts(user.id);
				return reply.status(401).send({
					success: false,
					error: 'messages.invalidCredentials'
				});
			}

			await resetLoginAttempts(user.id);

			if (user.two_factor_enabled) {
				const tempToken = await jwtService.generateToken({
					id: user.id,
					temp2FA: true
				}, { expiresIn: '5m' });

				return {
					success: true,
					requires2FA: true,
					tempToken
				};
			}

			const token = await jwtService.generateToken({
				id: user.id,
				username: user.username,
				email: user.email
			});

			return {
				success: true,
				token,
				user: user.toSafeJSON()
			};
		} catch (error) {
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/register', { preHandler: validateRegistration }, async (request, reply) => {
		const { username, email, password } = request.body;

		const existingUser = await findUserByEmail(email);
		if (existingUser) {
			return reply.status(400).send({
				success: false,
				error: 'auth.userExists'
			});
		}

		const newUser = {
			id: 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
			username,
			email,
			password,
			two_factor_enabled: false
		};

		const savedUser = await saveUser(newUser);
		if (!savedUser) {
			return reply.status(500).send({
				success: false,
				error: 'auth.creationError'
			});
		}

		const token = await jwtService.generateToken({
			id: savedUser.id,
			username: savedUser.username,
			email: savedUser.email
		});

		return {
			success: true,
			token,
			user: savedUser.toSafeJSON()
		};
	});

fastify.get('/profile-data', async (request, reply) => {
    const userId = request.headers['x-user-id'] ||
                   (request.headers['x-user'] ? JSON.parse(request.headers['x-user']).id : null);

    if (!userId) {
        return reply.status(401).send({
            success: false,
            error: 'messages.authError'
        });
    }

    try {
        const user = await findUserById(userId);
        if (!user) {
            return reply.status(404).send({
                success: false,
                error: 'messages.userNotFound'
            });
        }
        return {
            success: true,
            user: user.toSafeJSON()
        };
    } catch (error) {
        return reply.status(500).send({
            success: false,
            error: 'common.internalError'
        });
    }
});

fastify.put('/profile-data', async (request, reply) => {
    const userId = request.headers['x-user-id'] ||
                   (request.headers['x-user'] ? JSON.parse(request.headers['x-user']).id : null);

    if (!userId) {
        return reply.status(401).send({
            success: false,
            error: 'messages.authError'
        });
    }

    try {
        const { displayName, avatar } = request.body;
        const user = await findUserById(userId);
        if (!user) {
            return reply.status(404).send({
                success: false,
                error: 'messages.userNotFound'
            });
        }
        const updateData = {};
        if (displayName !== undefined) updateData.username = displayName;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (Object.keys(updateData).length > 0) {
            await updateUser(user.id, updateData);
        }
        const updatedUser = await findUserById(userId);
        return {
            success: true,
            user: updatedUser.toSafeJSON()
        };
    } catch (error) {
        return reply.status(500).send({
            success: false,
            error: 'common.internalError'
        });
    }
});

	fastify.get('/profile', { preHandler: async (req, reply) => {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			return reply.status(401).send({
				success: false,
				error: 'messages.authError'
			});
		}

		const token = authHeader.substring(7);
		const decoded = await jwtService.verifyToken(token);
		if (!decoded) {
			return reply.status(401).send({
				success: false,
				error: 'auth.invalidToken'
			});
		}

		req.user = decoded;
	}}, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}

			return {
				success: true,
				user: user.toSafeJSON()
			};
		} catch (error) {
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});





}
