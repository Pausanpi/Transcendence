import { api, getToken } from './api.js';

// ===== TYPES =====

export interface Player {
  id: string | null;      // null for guests
  name: string;           // display name or alias
  isGuest: boolean;
}

export interface MatchResult {
  player1: Player;
  player2: Player;

  player1Score: number;
  player2Score: number;
  winner: Player;
  gameType: 'pong' | 'tictactoe';
  tournamentId?: number | null;
  matchDuration?: number | null;  // seconds
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  display_name?: string;
}

// ===== CURRENT USER =====

let cachedUser: UserProfile | null = null;

/**
 * Get the currently logged-in user's profile
 * Returns null if not logged in
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const token = getToken();
  if (!token) {
    cachedUser = null;
    return null;
  }

  // Use cache if available
  if (cachedUser) {
    return cachedUser;
  }

  try {
    const response = await api<{ success: boolean; user: UserProfile }>('/api/auth/profile-data');
    if (response.success && response.user) {
      cachedUser = response.user;
      return cachedUser;
    }
    return null;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

/**
 * Clear cached user (call on logout)
 */
export function clearUserCache(): void {
  cachedUser = null;
}

/**
 * Check if a user is logged in
 */
export function isLoggedIn(): boolean {
  return getToken() !== null;
}

/**
 * Create a Player object for a registered user
 */
export function createRegisteredPlayer(user: UserProfile): Player {
  return {
    id: user.id,
    name: user.display_name || user.username,
    isGuest: false
  };
}

/**
 * Create a Player object for a guest
 */
export function createGuestPlayer(alias: string): Player {
  return {
    id: null,
    name: alias || 'Guest',
    isGuest: true
  };
}

/**
 * Create a Player object for AI
 */
export function createAIPlayer(difficulty: number): Player {
  const difficultyNames: Record<number, string> = {
    2: 'AI (Easy)',
    3: 'AI (Medium)',
    4: 'AI (Hard)'
  };
  return {
    id: null,
    name: difficultyNames[difficulty] || 'AI',
    isGuest: true  // AI is treated as guest for stats purposes
  };
}

// ===== MATCH SAVING =====

/**
 * Save a match result to the database
 * Only saves if at least one player is logged in (has a valid ID)
 */
export async function saveMatch(result: MatchResult): Promise<{ success: boolean; matchId?: number; error?: string; skipped?: boolean }> {
  // Debug logging
  console.log('saveMatch called with:', {
    player1: { id: result.player1.id, name: result.player1.name, isGuest: result.player1.isGuest },
    player2: { id: result.player2.id, name: result.player2.name, isGuest: result.player2.isGuest }
  });
  
  // Only save matches where at least one player is logged in
  const hasLoggedInPlayer = result.player1.id !== null || result.player2.id !== null;
  
  if (!hasLoggedInPlayer) {
    console.log('Match not saved: no logged-in players (guest vs guest)');
    return { success: true, skipped: true };
  }

  console.log('Saving match - at least one player is logged in');

  try {
    const payload = {
      player1_id: result.player1.id,
      player1_name: result.player1.name,
      player2_id: result.player2.id,
      player2_name: result.player2.name,
      player1_score: result.player1Score,
      player2_score: result.player2Score,
      winner_id: result.winner.id,
      winner_name: result.winner.name,
      game_type: result.gameType,
      tournament_id: result.tournamentId || null,
      match_duration: result.matchDuration || null
    };

    const response = await api<{ success: boolean; matchId: number }>('/api/database/matches', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return { success: true, matchId: response.matchId };
  } catch (error: any) {
    console.error('Failed to save match:', error);
    return { success: false, error: error.message };
  }
}

// ===== USER STATS =====

/**
 * Get user stats (wins, losses, games played)
 */
export async function getUserStats(userId: string): Promise<{
  wins: number;
  losses: number;
  games_played: number;
  win_rate: number;
  recentMatches: any[];
} | null> {
  try {
    const response = await api<{
      success: boolean;
      stats: { wins: number; losses: number; games_played: number; win_rate: number };
      recentMatches: any[];
    }>(`/api/database/stats/user/${userId}`);

    if (response.success) {
      return {
        ...response.stats,
        recentMatches: response.recentMatches
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get user stats:', error);
    return null;
  }
}

/**
 * Get match history for current user
 */
export async function getMatchHistory(userId: string, limit = 20): Promise<any[]> {
  try {
    const response = await api<{ success: boolean; matches: any[] }>(
      `/api/database/matches/user/${userId}?limit=${limit}`
    );
    return response.success ? response.matches : [];
  } catch (error) {
    console.error('Failed to get match history:', error);
    return [];
  }
}

// ===== GAME SESSION =====

export interface GameSession {
  player1: Player;
  player2: Player;
  gameType: 'pong' | 'tictactoe';
  isAI: boolean;
  difficulty?: number;
  startTime: number;
  tournamentId?: number | null;
}

let currentSession: GameSession | null = null;

/**
 * Start a new game session
 */
export function startGameSession(session: GameSession): void {
  currentSession = {
    ...session,
    startTime: Date.now()
  };
}

/**
 * Get current game session
 */
export function getGameSession(): GameSession | null {
  return currentSession;
}

/**
 * End game session and save match
 */
export async function endGameSession(
  player1Score: number,
  player2Score: number
): Promise<{ success: boolean; matchId?: number }> {
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

/**
 * Cancel current session without saving
 */
export function cancelGameSession(): void {
  currentSession = null;
}

// Export for global access
(window as any).gameService = {
  getCurrentUser,
  isLoggedIn,
  saveMatch,
  getUserStats,
  getMatchHistory,
  startGameSession,
  endGameSession,
  cancelGameSession,
  getGameSession,
  createGuestPlayer,
  createAIPlayer,
  createRegisteredPlayer,
  clearUserCache
};
