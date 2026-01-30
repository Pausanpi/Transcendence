import { api, getToken } from './api.js';
// ===== USER CACHE =====
let cachedUser = null;
export async function getCurrentUser() {
    const token = getToken();
    if (!token) {
        cachedUser = null;
        return null;
    }
    if (cachedUser) {
        return cachedUser;
    }
    try {
        const response = await api('/api/auth/profile-data');
        if (response.success && response.user) {
            cachedUser = response.user;
            return cachedUser;
        }
        return null;
    }
    catch (error) {
        console.error('Failed to get user profile:', error);
        return null;
    }
}
export function clearUserCache() {
    cachedUser = null;
}
export function isLoggedIn() {
    return getToken() !== null;
}
// ===== PLAYER FACTORY FUNCTIONS =====
export function createRegisteredPlayer(user) {
    return {
        id: user.id,
        name: user.display_name,
        isGuest: false
    };
}
export function createGuestPlayer(alias) {
    return {
        id: null,
        name: alias || 'Guest',
        isGuest: true
    };
}
export function createAIPlayer(difficulty) {
    const difficultyNames = {
        2: 'AI (Easy)',
        3: 'AI (Medium)',
        4: 'AI (Hard)'
    };
    return {
        id: null,
        name: difficultyNames[difficulty] || 'AI',
        isGuest: true
    };
}
// ===== PLAYER VERIFICATION =====
export async function verifyPlayerByName(playerName) {
    try {
        const response = await api(`/api/database/players?search=${encodeURIComponent(playerName)}&limit=10`);
        if (response.success && response.users) {
            const player = response.users.find((u) => u.username === playerName || u.display_name === playerName);
            return player || null;
        }
        return null;
    }
    catch (error) {
        console.error('Failed to verify player:', error);
        return null;
    }
}
export async function loginPlayer(email, password) {
    try {
        const response = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (response.success && response.user) {
            return response.user;
        }
        return null;
    }
    catch (error) {
        console.error('Failed to login player:', error);
        return null;
    }
}
// ===== MATCH SAVING =====
export async function saveMatch(result) {
    // Only save matches where at least one player is logged in
    const hasLoggedInPlayer = result.player1.id !== null || result.player2.id !== null;
    if (!hasLoggedInPlayer) {
        console.log('Match not saved: no logged-in players (guest vs guest)');
        return { success: true, skipped: true };
    }
    // Determine user vs opponent based on who's logged in
    let userScore, opponentScore, opponentName, opponentId;
    if (result.player1.id !== null) {
        userScore = result.player1Score;
        opponentScore = result.player2Score;
        opponentName = result.player2.name;
        opponentId = result.player2.id;
    }
    else {
        userScore = result.player2Score;
        opponentScore = result.player1Score;
        opponentName = result.player1.name;
        opponentId = result.player1.id;
    }
    try {
        const payload = {
            opponent_id: opponentId || null,
            opponent_name: opponentName,
            user_score: userScore,
            opponent_score: opponentScore,
            winner: result.winner.name,
            game_type: result.gameType,
            tournament_id: result.tournamentId || null,
            match_duration: result.matchDuration || null
        };
        // Call to register the match
        const response = await api('/api/database/matches', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return { success: true, matchId: response.matchId };
    }
    catch (error) {
        console.error('Failed to save match:', error);
        return { success: false, error: error.message };
    }
}
// ===== USER STATS =====
export async function getUserStats(userId) {
    try {
        const response = await api(`/api/database/stats/user/${userId}`);
        if (response.success) {
            return {
                ...response.stats,
                recentMatches: response.recentMatches
            };
        }
        return null;
    }
    catch (error) {
        console.error('Failed to get user stats:', error);
        return null;
    }
}
export async function getMatchHistory(userId, limit = 20) {
    try {
        const response = await api(`/api/database/matches/user/${userId}?limit=${limit}`);
        return response.success ? response.matches : [];
    }
    catch (error) {
        console.error('Failed to get match history:', error);
        return [];
    }
}
// ===== GAME SESSION MANAGEMENT =====
let currentSession = null;
export function startGameSession(session) {
    currentSession = {
        ...session,
        startTime: Date.now()
    };
}
export function getGameSession() {
    return currentSession;
}
export async function endGameSession(player1Score, player2Score) {
    if (!currentSession) {
        console.error('No active game session');
        return { success: false };
    }
    const winner = player1Score > player2Score
        ? currentSession.player1
        : currentSession.player2;
    const matchDuration = Math.floor((Date.now() - currentSession.startTime) / 1000);
    const result = await saveMatch({
        player1: currentSession.player1,
        player2: currentSession.player2,
        player1Score,
        player2Score,
        winner,
        gameType: currentSession.gameType,
        tournamentId: currentSession.tournamentId,
        matchDuration
    });
    currentSession = null;
    return result;
}
export function cancelGameSession() {
    currentSession = null;
}
