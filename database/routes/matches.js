import db from '../config/sqlite.js';

export default async function matchesRoutes(fastify, options) {

	// Record a new match
	fastify.post('/matches', async (request, reply) => {
		const {
			player1_id,
			player1_name,
			player2_id,
			player2_name,
			player1_score,
			player2_score,
			winner_id,
			winner_name,
			game_type = 'pong',
			tournament_id = null,
			match_duration = null
		} = request.body;

		if (!player1_name || !player2_name || player1_score === undefined || player2_score === undefined || !winner_name) {
			return reply.status(400).send({
				error: 'Missing required fields',
				success: false,
				code: 'MISSING_FIELDS'
			});
		}

		try {
			const result = await db.run(
				`INSERT INTO matches (
					player1_id, player1_name, player2_id, player2_name,
					player1_score, player2_score, winner_id, winner_name,
					game_type, tournament_id, match_duration, played_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
				[
					player1_id, player1_name, player2_id, player2_name,
					player1_score, player2_score, winner_id, winner_name,
					game_type, tournament_id, match_duration
				]
			);

			// Update user stats if players are registered
			if (player1_id) {
				const isWinner = winner_id === player1_id;
				await db.run(
					`UPDATE users SET 
						games_played = games_played + 1,
						wins = wins + ?,
						losses = losses + ?,
						updated_at = CURRENT_TIMESTAMP
					WHERE id = ?`,
					[isWinner ? 1 : 0, isWinner ? 0 : 1, player1_id]
				);
			}

			if (player2_id) {
				const isWinner = winner_id === player2_id;
				await db.run(
					`UPDATE users SET 
						games_played = games_played + 1,
						wins = wins + ?,
						losses = losses + ?,
						updated_at = CURRENT_TIMESTAMP
					WHERE id = ?`,
					[isWinner ? 1 : 0, isWinner ? 0 : 1, player2_id]
				);
			}

			return { success: true, matchId: result.id };
		} catch (error) {
			console.error('Error creating match:', error);
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Get match by ID
	fastify.get('/matches/:id', async (request, reply) => {
		const { id } = request.params;

		try {
			const match = await db.get('SELECT * FROM matches WHERE id = ?', [id]);
			if (!match) {
				return reply.status(404).send({
					error: 'Match not found',
					success: false,
					code: 'MATCH_NOT_FOUND'
				});
			}
			return { success: true, match };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Get user's match history
	fastify.get('/matches/user/:userId', async (request, reply) => {
		const { userId } = request.params;
		const { limit = 50, offset = 0 } = request.query;

		try {
			const matches = await db.all(
				`SELECT * FROM matches 
				WHERE player1_id = ? OR player2_id = ?
				ORDER BY played_at DESC
				LIMIT ? OFFSET ?`,
				[userId, userId, parseInt(limit), parseInt(offset)]
			);
			return { success: true, matches };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Get matches by tournament
	fastify.get('/matches/tournament/:tournamentId', async (request, reply) => {
		const { tournamentId } = request.params;

		try {
			const matches = await db.all(
				`SELECT * FROM matches 
				WHERE tournament_id = ?
				ORDER BY played_at ASC`,
				[tournamentId]
			);
			return { success: true, matches };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Get all matches (with optional filters)
	fastify.get('/matches', async (request, reply) => {
		const { game_type, limit = 100, offset = 0 } = request.query;

		try {
			let sql = 'SELECT * FROM matches';
			const params = [];

			if (game_type) {
				sql += ' WHERE game_type = ?';
				params.push(game_type);
			}

			sql += ' ORDER BY played_at DESC LIMIT ? OFFSET ?';
			params.push(parseInt(limit), parseInt(offset));

			const matches = await db.all(sql, params);
			return { success: true, matches };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	// Get user stats
	fastify.get('/stats/user/:userId', async (request, reply) => {
		const { userId } = request.params;

		try {
			const user = await db.get(
				'SELECT wins, losses, games_played FROM users WHERE id = ?',
				[userId]
			);

			if (!user) {
				return reply.status(404).send({
					error: 'User not found',
					success: false,
					code: 'USER_NOT_FOUND'
				});
			}

			const recentMatches = await db.all(
				`SELECT * FROM matches 
				WHERE player1_id = ? OR player2_id = ?
				ORDER BY played_at DESC LIMIT 10`,
				[userId, userId]
			);

			return {
				success: true,
				stats: {
					wins: user.wins || 0,
					losses: user.losses || 0,
					games_played: user.games_played || 0,
					win_rate: user.games_played > 0 
						? ((user.wins / user.games_played) * 100).toFixed(1) 
						: 0
				},
				recentMatches
			};
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

}
