import db from '../config/sqlite.js';

export default async function tournamentsRoutes(fastify, options) {

	// Create a new tournament
	fastify.post('/tournaments', async (request, reply) => {
		const {
			name,
			creator_id = null,
			max_players = 8
		} = request.body;

		if (!name) {
			return reply.status(400).send({
				error: 'Tournament name is required',
				success: false,
				code: 'MISSING_NAME'
			});
		}

		try {
			const result = await db.run(
				`INSERT INTO tournaments (name, creator_id, max_players, status, current_round, created_at)
				VALUES (?, ?, ?, 'pending', 0, CURRENT_TIMESTAMP)`,
				[name, creator_id, max_players]
			);
			return { success: true, tournamentId: result.id };
		} catch (error) {
			console.error('Error creating tournament:', error);
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Get tournament by ID
	fastify.get('/tournaments/:id', async (request, reply) => {
		const { id } = request.params;

		try {
			const tournament = await db.get('SELECT * FROM tournaments WHERE id = ?', [id]);
			if (!tournament) {
				return reply.status(404).send({
					error: 'Tournament not found',
					success: false,
					code: 'TOURNAMENT_NOT_FOUND'
				});
			}

			// Get participants
			const participants = await db.all(
				`SELECT * FROM tournament_participants 
				WHERE tournament_id = ? 
				ORDER BY seed ASC`,
				[id]
			);

			// Get matches
			const matches = await db.all(
				`SELECT * FROM matches 
				WHERE tournament_id = ? 
				ORDER BY played_at ASC`,
				[id]
			);

			return {
				success: true,
				tournament: {
					...tournament,
					participants,
					matches
				}
			};
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// List all tournaments
	fastify.get('/tournaments', async (request, reply) => {
		const { status, limit = 50, offset = 0 } = request.query;

		try {
			let sql = 'SELECT * FROM tournaments';
			const params = [];

			if (status) {
				sql += ' WHERE status = ?';
				params.push(status);
			}

			sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
			params.push(parseInt(limit), parseInt(offset));

			const tournaments = await db.all(sql, params);
			return { success: true, tournaments };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Update tournament
	fastify.put('/tournaments/:id', async (request, reply) => {
		const { id } = request.params;
		const updates = request.body;

		const allowedFields = ['name', 'status', 'current_round', 'winner_id', 'winner_name', 'started_at', 'completed_at'];
		const fields = Object.keys(updates).filter(f => allowedFields.includes(f));

		if (fields.length === 0) {
			return reply.status(400).send({
				error: 'No valid fields to update',
				success: false,
				code: 'NO_UPDATES'
			});
		}

		const updateFields = fields.map(field => `${field} = ?`).join(', ');
		const values = fields.map(field => updates[field]);
		values.push(id);

		try {
			await db.run(`UPDATE tournaments SET ${updateFields} WHERE id = ?`, values);
			return { success: true };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Delete tournament
	fastify.delete('/tournaments/:id', async (request, reply) => {
		const { id } = request.params;

		try {
			await db.run('DELETE FROM tournaments WHERE id = ?', [id]);
			return { success: true };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Add participant to tournament
	fastify.post('/tournaments/:id/participants', async (request, reply) => {
		const { id } = request.params;
		const { user_id = null, display_name } = request.body;

		if (!display_name) {
			return reply.status(400).send({
				error: 'Display name is required',
				success: false,
				code: 'MISSING_DISPLAY_NAME'
			});
		}

		try {
			// Check tournament exists and is pending
			const tournament = await db.get('SELECT * FROM tournaments WHERE id = ?', [id]);
			if (!tournament) {
				return reply.status(404).send({
					error: 'Tournament not found',
					success: false,
					code: 'TOURNAMENT_NOT_FOUND'
				});
			}

			if (tournament.status !== 'pending') {
				return reply.status(400).send({
					error: 'Tournament already started',
					success: false,
					code: 'TOURNAMENT_STARTED'
				});
			}

			// Check max players
			const currentCount = await db.get(
				'SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = ?',
				[id]
			);

			if (currentCount.count >= tournament.max_players) {
				return reply.status(400).send({
					error: 'Tournament is full',
					success: false,
					code: 'TOURNAMENT_FULL'
				});
			}

			// Check if user already joined (if registered user)
			if (user_id) {
				const existing = await db.get(
					'SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ?',
					[id, user_id]
				);
				if (existing) {
					return reply.status(400).send({
						error: 'User already in tournament',
						success: false,
						code: 'ALREADY_JOINED'
					});
				}
			}

			// Check display name uniqueness in this tournament
			const nameExists = await db.get(
				'SELECT * FROM tournament_participants WHERE tournament_id = ? AND display_name = ?',
				[id, display_name]
			);
			if (nameExists) {
				return reply.status(400).send({
					error: 'Display name already taken in this tournament',
					success: false,
					code: 'NAME_TAKEN'
				});
			}

			const result = await db.run(
				`INSERT INTO tournament_participants (tournament_id, user_id, display_name, joined_at)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
				[id, user_id, display_name]
			);

			return { success: true, participantId: result.id };
		} catch (error) {
			console.error('Error adding participant:', error);
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Get tournament participants
	fastify.get('/tournaments/:id/participants', async (request, reply) => {
		const { id } = request.params;

		try {
			const participants = await db.all(
				`SELECT * FROM tournament_participants 
				WHERE tournament_id = ? 
				ORDER BY seed ASC, joined_at ASC`,
				[id]
			);
			return { success: true, participants };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Update participant (seed, eliminate)
	fastify.put('/tournaments/:id/participants/:participantId', async (request, reply) => {
		const { id, participantId } = request.params;
		const { seed, eliminated, eliminated_round } = request.body;

		try {
			const updates = [];
			const values = [];

			if (seed !== undefined) {
				updates.push('seed = ?');
				values.push(seed);
			}
			if (eliminated !== undefined) {
				updates.push('eliminated = ?');
				values.push(eliminated ? 1 : 0);
			}
			if (eliminated_round !== undefined) {
				updates.push('eliminated_round = ?');
				values.push(eliminated_round);
			}

			if (updates.length === 0) {
				return reply.status(400).send({
					error: 'No fields to update',
					success: false,
					code: 'NO_UPDATES'
				});
			}

			values.push(participantId, id);

			await db.run(
				`UPDATE tournament_participants SET ${updates.join(', ')} 
				WHERE id = ? AND tournament_id = ?`,
				values
			);

			return { success: true };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Remove participant from tournament
	fastify.delete('/tournaments/:id/participants/:participantId', async (request, reply) => {
		const { id, participantId } = request.params;

		try {
			await db.run(
				'DELETE FROM tournament_participants WHERE id = ? AND tournament_id = ?',
				[participantId, id]
			);
			return { success: true };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Start tournament (set seeds randomly and change status)
	fastify.post('/tournaments/:id/start', async (request, reply) => {
		const { id } = request.params;

		try {
			const tournament = await db.get('SELECT * FROM tournaments WHERE id = ?', [id]);
			if (!tournament) {
				return reply.status(404).send({
					error: 'Tournament not found',
					success: false,
					code: 'TOURNAMENT_NOT_FOUND'
				});
			}

			if (tournament.status !== 'pending') {
				return reply.status(400).send({
					error: 'Tournament already started',
					success: false,
					code: 'ALREADY_STARTED'
				});
			}

			const participants = await db.all(
				'SELECT * FROM tournament_participants WHERE tournament_id = ?',
				[id]
			);

			if (participants.length < 2) {
				return reply.status(400).send({
					error: 'Need at least 2 participants',
					success: false,
					code: 'NOT_ENOUGH_PLAYERS'
				});
			}

			// Shuffle and assign seeds
			const shuffled = participants.sort(() => Math.random() - 0.5);
			for (let i = 0; i < shuffled.length; i++) {
				await db.run(
					'UPDATE tournament_participants SET seed = ? WHERE id = ?',
					[i + 1, shuffled[i].id]
				);
			}

			// Update tournament status
			await db.run(
				`UPDATE tournaments SET status = 'in_progress', current_round = 1, started_at = CURRENT_TIMESTAMP WHERE id = ?`,
				[id]
			);

			return { success: true, message: 'Tournament started' };
		} catch (error) {
			console.error('Error starting tournament:', error);
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

}