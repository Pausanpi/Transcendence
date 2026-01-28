import jwt from 'jsonwebtoken';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import VaultService from '../../auth/services/vault.js';
import fs from 'fs/promises';
import { register } from '../../shared/metrics.js';


export default async function gatewayRoutes(fastify, options) {

  const avatarsDir = path.join(process.cwd(), 'avatars');
  await fs.mkdir(avatarsDir, { recursive: true });

	fastify.post('/upload/avatar', async (request, reply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: 'auth.authenticationRequired'
    });
  }

  const user = request.user;

  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (data.mimetype !== 'image/png') {
      return reply.status(400).send({
        success: false,
        error: 'Only PNG files are allowed'
      });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const safeUserId = user.id.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `avatar_${safeUserId}_${timestamp}_${randomString}.png`;
    const filePath = path.join(avatarsDir, fileName);

    await pipeline(data.file, createWriteStream(filePath));

    try {
      await fetch('http://database:3003/database/users/' + user.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: fileName })
      });
    } catch (dbError) {
      console.error('Error updating user avatar:', dbError);
    }

    return reply.send({
      success: true,
      url: `/avatars/${fileName}`,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(400).send({
        success: false,
        error: 'File size must be less than 2MB'
      });
    }
    return reply.status(500).send({
      success: false,
      error: 'Failed to upload avatar'
    });
  }
});

	fastify.get('/health', async () => ({
		service: 'api-gateway',
		status: 'OK',
		url: 'http://gateway:3000',
		database: 'connected',
		timestamp: new Date().toISOString(),
		endpoints: [
			'/api/auth',
			'/api/2fa',
			'/api/i18n',
			'/api/users',
			'/api/database',
			'/api/gdpr'
		]
	}));


  fastify.get('/metrics', async (_request, reply) => {
    reply
      .header('Content-Type', register.contentType)
      .send(await register.metrics());
  });


}
