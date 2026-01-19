import fastifyPassport from '@fastify/passport';
import jwtService from '../services/jwt.js';

export default async function oauthRoutes(fastify) {

  fastify.get('/github', {
    preValidation: fastifyPassport.authenticate('github', {
      scope: ['user:email']
    })
  }, async () => {
  });

  fastify.get('/github/callback', {
    preValidation: fastifyPassport.authenticate('github', {
      failureRedirect: '/?error=auth_failed'
    })
  }, async (request, reply) => {

    const user = request.user;
    if (!user) {
      return reply.redirect('/?error=user_not_found');
    }

    const jwtToken = await jwtService.generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      twoFactorEnabled: user.two_factor_enabled === true
    });

    return reply.redirect(`/?token=${jwtToken}`);
  });
}
