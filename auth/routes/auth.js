import fastifyPassport from '@fastify/passport';
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
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function authRoutes(fastify, options) {

  /***********************
   *   GITHUB LOGIN
   ***********************/
  fastify.get('/github', {
      preValidation: fastifyPassport.authenticate('github', {
        scope: ['user:email']
      })
    }, async (request, reply) => reply.redirect('/')
  );

  fastify.get('/github/callback',
    {
      preValidation: fastifyPassport.authenticate('github', {
        failureRedirect: '/?error=auth_failed'
      })
    },

    async (request, reply) => {
      const user = request.user;
      if (!user) return reply.redirect('/?error=user_not_found');

      try {
        const oauthProfile = {
          provider: 'github',
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          avatar: user.avatar || 'default-avatar.png',
          profileUrl: user.profileUrl
        };

        const savedUser = await findOrCreateOAuthUser(oauthProfile);
        if (!savedUser) return reply.redirect('/?error=save_failed');

        const userForSession = {
          id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          avatar: savedUser.avatar,
          twoFactorEnabled: savedUser.two_factor_enabled === true
        };

        await request.logIn(userForSession);

        if (savedUser.two_factor_enabled === true) {
          request.session.set('pending2FAUserId', savedUser.id);
          request.session.delete('twoFactorVerified');
          return reply.redirect('/auth/2fa-required');
        }

        const jwtToken = await jwtService.generateToken({
          id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          twoFactorEnabled: false
        });

        request.session.set('jwtToken', jwtToken);
        request.session.delete('twoFactorVerified');
        request.session.delete('pending2FAUserId');

        return reply.redirect('/auth/profile');

      } catch (error) {
        fastify.log.error('OAuth error:', error);
        return reply.redirect('/?error=process_failed');
      }
    }
  );


  /***********************
   *   2FA REQUIRED VIEW
   ***********************/
  fastify.get('/2fa-required', async (request, reply) => {
    if (!request.session.get('pending2FAUserId')) {
      return reply.redirect('/');
    }
    return reply.sendFile('auth/2fa-required.html');
  });

  fastify.get('/pending-2fa-user', async (request, reply) => {
    const pendingId = request.session.get('pending2FAUserId');
    if (!pendingId) return reply.status(404).send({ error: 'messages.userNotFound' });

    const user = await findUserById(pendingId);
    if (!user) return reply.status(404).send({ error: 'messages.userNotFound' });

    return {
      userId: pendingId,
      username: user.username,
      twoFactorEnabled: Boolean(user.two_factor_enabled)
    };
  });


  /***********************
   *      PROFILE
   ***********************/
  fastify.get('/profile', {
    preHandler: async (request, reply) => {

      console.log('🔍 Profile access check:', {
        isAuthenticated: request.isAuthenticated?.(),
        userId: request.session.get('userId'),
        user: request.session.get('user'),
        jwtToken: request.session.get('jwtToken'),
        cookies: request.headers.cookie
      });

      if (!request.isAuthenticated || !request.isAuthenticated()) {
        return reply.redirect('/');
      }

      const user = await findUserById(request.user.id);
      if (!user) return reply.redirect('/');

      if (user.two_factor_enabled && !request.session.get('twoFactorVerified')) {
        request.session.set('pending2FAUserId', user.id);
        return reply.redirect('/auth/2fa-required');
      }
    }
  }, async (request, reply) => {
    return reply.sendFile('auth/profile.html');
  });

  fastify.get('/profile-data', async (request, reply) => {
    if (!request.isAuthenticated || !request.isAuthenticated()) {
      return reply.status(401).send({ error: 'messages.authError' });
    }

    const user = await findUserById(request.user.id);
    if (!user) return reply.status(404).send({ error: 'messages.userNotFound' });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || 'default-avatar.png',
      twoFactorEnabled: Boolean(user.two_factor_enabled),
      jwtToken: request.session.get('jwtToken')
    };
  });


  /***********************
   *       LOGIN
   ***********************/
  fastify.post('/login', { preHandler: validateLogin }, async (request, reply) => {
    const { email, password } = request.body;

    console.log('Login attempt for email:', email);

    const user = await findUserByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      return reply.status(401).send({ success: false, error: 'messages.invalidCredentials' });
    }

    console.log('User found:', user.id, user.username);

    if (user.isAccountLocked()) {
      console.log('Account locked:', user.id);
      return reply.status(423).send({ success: false, error: 'auth.accountLocked' });
    }

    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', user.id);
      await incrementLoginAttempts(user.id);
      return reply.status(401).send({ success: false, error: 'messages.invalidCredentials' });
    }

    await resetLoginAttempts(user.id);

    console.log('Session BEFORE login:', {
      userId: request.session.get('userId'),
      pending2FA: request.session.get('pending2FAUserId'),
      twoFactorVerified: request.session.get('twoFactorVerified')
    });

    // 2FA FIRST
    if (user.two_factor_enabled) {
      console.log('2FA required for user:', user.id);

      request.session.set('pending2FAUserId', user.id);
      request.session.delete('twoFactorVerified');

      return reply.send({
        success: true,
        requires2FA: true,
        userId: user.id,
        username: user.username
      });
    }

    // NORMAL LOGIN
    console.log('Successful login without 2FA:', user.id);

    request.session.set('userId', user.id);
    request.session.set('user', {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || 'default-avatar.png'
    });
    request.session.set('twoFactorVerified', false);

    const jwtToken = await jwtService.generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      twoFactorEnabled: false
    });

    request.session.set('jwtToken', jwtToken);

    console.log('Session AFTER login:', {
      userId: request.session.get('userId'),
      user: request.session.get('user'),
      jwtTokenSet: !!request.session.get('jwtToken')
    });

    return reply.send({
      success: true,
      requires2FA: false,
      token: jwtToken,
      user: user.toSafeJSON()
    });
  });


  /***********************
   *     REGISTER
   ***********************/
  fastify.post('/register', { preHandler: validateRegistration }, async (request, reply) => {
    const { username, email, password } = request.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return reply.status(400).send({ success: false, error: 'auth.userExists' });
    }

    const newUser = {
      id: 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      username,
      email,
      password,
      oauthProvider: null,
      oauthId: null,
      two_factor_enabled: false,
      two_factor_secret: null
    };

    const savedUser = await saveUser(newUser);
    if (!savedUser) {
      return reply.status(500).send({ success: false, error: 'auth.creationError' });
    }

    const jwtToken = await jwtService.generateToken({
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      twoFactorEnabled: false
    });

    return reply.send({
      success: true,
      token: jwtToken,
      user: savedUser.toSafeJSON()
    });
  });


  /***********************
   *      LOGOUT
   ***********************/
  fastify.get('/logout', async (request, reply) => {
    request.session.delete();
    reply.clearCookie('sessionId');
    return reply.redirect('/');
  });


  /***********************
   *   SESSION STATUS
   ***********************/
  fastify.get('/session-status', async (request, reply) => {
    return reply.send({
      isAuthenticated: request.isAuthenticated?.(),
      userId: request.session.get('userId'),
      user: request.session.get('user'),
      jwtToken: request.session.get('jwtToken'),
      cookies: request.headers.cookie
    });
  });

}
