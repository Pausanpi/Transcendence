import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import db from '../config/sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to media volume
const AVATARS_DIR = path.join(__dirname, '../../media/avatars');

export default async function avatarRoutes(fastify, options) {
	// Ensure avatars directory exists
	await fs.mkdir(AVATARS_DIR, { recursive: true });
	console.log('📁 Database: Avatars directory:', AVATARS_DIR);

	// POST /database/avatar/upload - Upload avatar
	fastify.post('/avatar/upload', async (request, reply) => {
		console.log('🟢 Database: Avatar upload endpoint hit');
		console.log('🟢 Database: Content-Type:', request.headers['content-type']);
		console.log('🟢 Database: Headers:', JSON.stringify(request.headers, null, 2));
		
		try {
			// Get user ID from JWT (set by gateway)
			const userId = request.headers['x-user-id'];
			console.log('🟢 Database: User ID from header:', userId);
			
			if (!userId) {
				console.log('❌ Database: No user ID in header');
				return reply.status(401).send({
					success: false,
					error: 'auth.authenticationRequired'
				});
			}

			console.log('🟢 Database: Attempting to read file...');
			
			// Get the uploaded file
			const data = await request.file();
			
			console.log('🟢 Database: File data:', data ? {
				filename: data.filename,
				mimetype: data.mimetype,
				encoding: data.encoding,
				fieldname: data.fieldname
			} : 'NULL');
			
			if (!data) {
				console.log('❌ Database: No file data received');
				console.log('❌ Database: Request is multipart?', request.isMultipart());
				return reply.status(400).send({
					success: false,
					error: 'No file uploaded'
				});
			}

			// Validate file type
			const mimeType = data.mimetype;
			console.log('🟢 Database: Validating mimetype:', mimeType);
			
			if (mimeType !== 'image/jpeg' && mimeType !== 'image/jpg') {
				console.log('❌ Database: Invalid mimetype');
				return reply.status(400).send({
					success: false,
					error: 'Only JPG/JPEG files are allowed'
				});
			}

			// Path where we'll save the avatar
			const avatarPath = path.join(AVATARS_DIR, `${userId}.jpg`);
			console.log('🟢 Database: Target path:', avatarPath);

			console.log('🟢 Database: Converting to buffer...');
			const buffer = await data.toBuffer();
			console.log('🟢 Database: Buffer size:', buffer.length, 'bytes');

			// Process image with sharp: resize to 200x200 and save as JPG
			console.log('🟢 Database: Processing with Sharp...');
			await sharp(buffer)
				.resize(200, 200, {
					fit: 'cover',
					position: 'center'
				})
				.jpeg({ quality: 90 })
				.toFile(avatarPath);

			console.log('🟢 Database: File saved successfully');

			// Update database with avatar path
			const avatarUrl = `/api/database/avatar/${userId}`;
			console.log('🟢 Database: Updating database with URL:', avatarUrl);
			
			await db.run(
				'UPDATE users SET avatar = ? WHERE id = ?',
				[avatarUrl, userId]
			);

			console.log('✅ Database: Avatar uploaded successfully');
			
			return reply.send({
				success: true,
				message: 'Avatar uploaded successfully',
				avatar: avatarUrl
			});

		} catch (error) {
			console.error('❌ Database: Avatar upload error:', error);
			console.error('❌ Database: Error stack:', error.stack);
			fastify.log.error('Avatar upload error:', error);
			return reply.status(500).send({
				success: false,
				error: 'Failed to upload avatar: ' + error.message
			});
		}
	});

	// GET /database/avatar/:userId - Retrieve avatar
	fastify.get('/avatar/:userId', async (request, reply) => {
		try {
			const { userId } = request.params;

			// Path to user's avatar
			const avatarPath = path.join(AVATARS_DIR, `${userId}.jpg`);

			// Check if avatar exists
			try {
				await fs.access(avatarPath);
				// Avatar exists, send it
				const fileStream = await fs.readFile(avatarPath);
				return reply
					.type('image/jpeg')
					.send(fileStream);
			} catch (err) {
				// Avatar doesn't exist, return 404
				// Frontend will fallback to default avatar
				return reply.status(404).send({
					success: false,
					error: 'Avatar not found'
				});
			}

		} catch (error) {
			fastify.log.error('Avatar retrieval error:', error);
			return reply.status(500).send({
				success: false,
				error: 'Failed to retrieve avatar'
			});
		}
	});

	// DELETE /database/avatar/:userId - Delete avatar
	fastify.delete('/avatar/:userId', async (request, reply) => {
		try {
			const userId = request.headers['x-user-id'];
			const { userId: targetUserId } = request.params;

			// Only allow users to delete their own avatar
			if (userId !== targetUserId) {
				return reply.status(403).send({
					success: false,
					error: 'Forbidden'
				});
			}

			const avatarPath = path.join(AVATARS_DIR, `${userId}.jpg`);

			try {
				await fs.unlink(avatarPath);
				
				// Update database to remove avatar reference
				await db.run(
					'UPDATE users SET avatar = NULL WHERE id = ?',
					[userId]
				);

				return reply.send({
					success: true,
					message: 'Avatar deleted successfully'
				});
			} catch (err) {
				// File doesn't exist, that's okay
				return reply.send({
					success: true,
					message: 'No avatar to delete'
				});
			}

		} catch (error) {
			fastify.log.error('Avatar deletion error:', error);
			return reply.status(500).send({
				success: false,
				error: 'Failed to delete avatar'
			});
		}
	});
}