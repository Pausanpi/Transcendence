import db from '../config/sqlite.js';

export default async function playersRoutes(fastify, options) {
    /**
     * GET /players
     * Returns a list of players with minimal information (for the player list)
     * Query params:
     *   - search: optional search term for username/display_name
     *   - limit: max number of results (default 50)
     *   - offset: pagination offset (default 0)
     */
    fastify.get('/players', async (request, reply) => {
        const search = request.query.search || '';
        const limit = request.query.limit || 50;
        const offset = request.query.offset || 0;

        try {
            let sql = `
                SELECT id, username, display_name, avatar, online_status
                FROM users
                WHERE is_active = 1 AND is_anonymized = 0
            `;
            const params = [];

            if (search) {
                sql += ' AND (username LIKE ? OR display_name LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm);
            }

            sql += ' ORDER BY online_status DESC, username ASC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const users = await db.all(sql, params);

            return {
                success: true,
                users: users.map(user => ({
                    id: user.id,
                    username: user.username,
                    display_name: user.display_name,
                    avatar: user.avatar || '/avatars/default-avatar.png',
                    online_status: user.online_status || 'offline'
                }))
            };
        } catch (error) {
            console.error('Error loading players:', error);
            return reply.status(500).send({
                success: false,
                error: 'common.internalError',
                code: 'DB_ERROR'
            });
        }
    });

    /**
     * GET /players/:id
     * Returns detailed player profile including stats and match history
     * Requires authentication
     */
    fastify.get('/players/:id', async (request, reply) => {
        const { id } = request.params;

        // TODO: Add authentication check here
        // if (!request.user) {
        //     return reply.status(401).send({
        //         success: false,
        //         error: 'Authentication required',
        //         code: 'AUTH_REQUIRED'
        //     });
        // }

        try {
            // Get user basic info and stats
            const user = await db.get(
                `SELECT id, username, display_name, avatar, online_status, 
                        last_seen, created_at
                 FROM users
                 WHERE id = ? AND is_active = 1 AND is_anonymized = 0`,
                [id]
            );

            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: 'Player not found',
                    code: 'PLAYER_NOT_FOUND'
                });
            }

            // Calculate stats from matches table
            const statsQuery = `
                SELECT 
                    COUNT(*) as games_played,
                    SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
                    SUM(CASE WHEN winner_id != ? AND winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses
                FROM matches
                WHERE (player1_id = ? OR player2_id = ?)
            `;
            
            const stats = await db.get(statsQuery, [id, id, id, id]);

            // Get recent match history (last 10 matches)
            const matchHistoryQuery = `
                SELECT 
                    m.id,
                    m.player1_id,
                    m.player1_name,
                    m.player2_id,
                    m.player2_name,
                    m.player1_score,
                    m.player2_score,
                    m.winner_id,
                    m.winner_name,
                    m.game_type,
                    m.match_duration,
                    m.played_at,
                    m.tournament_id
                FROM matches m
                WHERE m.player1_id = ? OR m.player2_id = ?
                ORDER BY m.played_at DESC
                LIMIT 10
            `;

            const matchHistory = await db.all(matchHistoryQuery, [id, id]);

            // Format match history for frontend
            const formattedMatches = matchHistory.map(match => {
                const isPlayer1 = match.player1_id === id;
                const opponent = {
                    id: isPlayer1 ? match.player2_id : match.player1_id,
                    name: isPlayer1 ? match.player2_name : match.player1_name
                };
                const playerScore = isPlayer1 ? match.player1_score : match.player2_score;
                const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
                const won = match.winner_id === id;

                return {
                    id: match.id,
                    opponent,
                    playerScore,
                    opponentScore,
                    won,
                    gameType: match.game_type,
                    duration: match.match_duration,
                    playedAt: match.played_at,
                    tournamentId: match.tournament_id
                };
            });

            // Build complete profile response
            const profile = {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                avatar: user.avatar || '/avatars/default-avatar.png',
                online_status: user.online_status || 'offline',
                last_seen: user.last_seen,
                created_at: user.created_at,
                stats: {
                    games_played: stats.games_played || 0,
                    wins: stats.wins || 0,
                    losses: stats.losses || 0,
                    win_rate: stats.games_played > 0 
                        ? Math.round((stats.wins / stats.games_played) * 100) 
                        : 0
                },
                match_history: formattedMatches
            };

            return { success: true, user: profile };
        } catch (error) {
            console.error('Error loading player profile:', error);
            return reply.status(500).send({
                success: false,
                error: 'common.internalError',
                code: 'DB_ERROR'
            });
        }
    });
}