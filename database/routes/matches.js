import db from '../config/sqlite.js';

export default async function matchesRoutes(fastify, options) {

	// Record a new match (secure)
	fastify.post('/matches', async (request, reply) => {
		const userId = request.headers['x-user-id'];
		if (!userId) {
			return reply.status(401).send({ success: false, error: 'auth.required' });
		}


		// Accept new, minimal payload from frontend
		const {
			opponent_id,
			opponent_name,
			user_score,
			opponent_score,
			winner,
			game_type = 'pong',
			tournament_id = null,
			match_duration = null
		} = request.body;

		if (!opponent_name || user_score === undefined || opponent_score === undefined || !winner) {
			return reply.status(400).send({
				error: 'Missing required fields',
				success: false,
				code: 'MISSING_FIELDS'
			});
		}


		// Use authenticated user as player1, opponent as player2
		const player1_id = userId;
		const player1_name = winner === opponent_name ? undefined : 'You'; // Optionally fetch from DB
		const player2_id = opponent_id || null; // Use provided opponent_id if present
		const player2_name = opponent_name;
		const player1_score = user_score;
		const player2_score = opponent_score;
		const winner_name = winner;
		let winner_id = null;
		if (player1_score > player2_score) {
			winner_id = player1_id;
		} else if (player2_score > player1_score && player2_id) {
			winner_id = player2_id;
		}

		// Optionally, fetch the user's display name from DB for player1_name
		let resolvedPlayer1Name = player1_name;
		try {
			const userRow = await db.get('SELECT display_name, username FROM users WHERE id = ?', [userId]);
			if (userRow) {
				resolvedPlayer1Name = userRow.display_name || userRow.username || 'You';
			}
		} catch (e) {
			// fallback to 'You'
		}

		try {
			const result = await db.run(
				`INSERT INTO matches (
					       player1_id, player1_name, player2_id, player2_name,
					       player1_score, player2_score, winner_id, winner_name,
					       game_type, tournament_id, match_duration, played_at
				       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
				[
					player1_id, resolvedPlayer1Name, player2_id, player2_name,
					player1_score, player2_score, winner_id, winner_name,
					game_type, tournament_id, match_duration
				]
			);

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

	// Get match by ID // not called right now
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

	// Get user's match history // Called by getMatchHistory but that is neve rused
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

	// Get matches by tournament // Not used
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

	// Get all matches (with optional filters) // not called
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

	// Get user stats // not called
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