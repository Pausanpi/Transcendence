import db from '../config/sqlite.js';

export default async function playersRoutes(fastify, options) {
    fastify.get('/players', async (request, reply) => {
        const search = request.query.search || '';
        const limit = request.query.limit || 50;
        const offset = request.query.offset || 0;

        try {
            let sql = `
                SELECT id, username, display_name, avatar, wins, losses, games_played,
                       online_status, last_seen, created_at
                FROM users
                WHERE is_active = 1 AND is_anonymized = 0
            `;
            const params = [];

            if (search) {
                sql += ' AND (username LIKE ? OR display_name LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm);
            }

            sql += ' ORDER BY username ASC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const users = await db.all(sql, params);

            return {
                success: true,
                users: users.map(user => ({
                    ...user,
                    avatar: user.avatar || '/default-avatar.png'
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

    fastify.get('/players/:id', async (request, reply) => {
        const { id } = request.params;

        try {
            const user = await db.get(
                `SELECT id, username, display_name, avatar, wins, losses, games_played,
                        online_status, last_seen, created_at
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

            user.avatar = user.avatar || '/default-avatar.png';

            return { success: true, user };
        } catch (error) {
            console.error('Error loading player:', error);
            return reply.status(500).send({
                success: false,
                error: 'common.internalError',
                code: 'DB_ERROR'
            });
        }
    });
}
