import type { Player } from "./gameService";
import { api } from './api.js';

export type Match = {
  player1: Player;
  player2: Player;
  winner?: Player;
};

export type Round = {
  matches: Match[];
};

export type Tournament = {
  players: Player[];
  rounds: Round[];
  currentRoundIndex: number;
  currentMatchIndex: number;
  tournamentId?: number | null; // ID en la base de datos
  creatorId?: string | null;
};

// Utils
function shufflePlayers(players:Player[]):Player[] {
  return [...players].sort(() => Math.random() - 0.5);
}

function createMatches(players:Player[]): Match[] {
  const matches: Match[] = [];

  for (let i = 0; i < players.length; i += 2) {
    matches.push({
      player1: players[i],
      player2: players[i + 1],
    });
  }
  return matches;
}

export function createTournament(players: Player[]): Tournament {
  const shuffled = shufflePlayers(players);

  return {
    players: shuffled,
    rounds: [{ matches: createMatches(shuffled) }],
    currentRoundIndex: 0,
    currentMatchIndex: 0
  };
}

export function getCurrentMatch(t: Tournament): Match | null {
  return t.rounds[t.currentRoundIndex]?.matches[t.currentMatchIndex] ?? null;
}

export function setMatchWinner(t: Tournament, winner: Player): void {
  const match = getCurrentMatch(t);
  if (match) match.winner = winner;
}

export function advanceTournament(t: Tournament): void {
  const round = t.rounds[t.currentRoundIndex];
  t.currentMatchIndex++;

  if (t.currentMatchIndex < round.matches.length) return;

  const winners = round.matches
    .map(m => m.winner)
    .filter(Boolean) as Player[];

  if (winners.length <= 1) return;

  t.rounds.push({ matches: createMatches(winners) });
  t.currentRoundIndex++;
  t.currentMatchIndex = 0;
}

// TournamentWinner
export function getChampion(t: Tournament): Player | null {
  const lastRound = t.rounds[t.rounds.length - 1];
  return lastRound?.matches.length === 1
    ? lastRound.matches[0].winner ?? null
    : null;
}

// Storage
export function saveTournament(t: Tournament): void {
  sessionStorage.setItem("pongTournament", JSON.stringify(t));
}

export function loadTournament(): Tournament | null {
  const data = sessionStorage.getItem("pongTournament");
  return data ? JSON.parse(data) : null;
}

// ===== DATABASE FUNCTIONS =====

/**
 * Crea un torneo en la base de datos
 * @returns El ID del torneo creado, o null si falla
 */
export async function createTournamentInDB(
  players: Player[],
  creatorId?: string | null
): Promise<number | null> {
  try {
    // Determinar el creador (primer jugador registrado si no se especifica)
    const actualCreatorId = creatorId || players.find(p => !p.isGuest)?.id || null;
    
    const response = await api<{ success: boolean; tournamentId: number }>(
      '/api/database/tournaments',
      {
        method: 'POST',
        body: JSON.stringify({
          name: `Pong Tournament ${new Date().toLocaleDateString()}`,
          creator_id: actualCreatorId,
          max_players: players.length
        })
      }
    );

    if (response.success && response.tournamentId) {
      // Guardar participantes
      await saveTournamentParticipants(response.tournamentId, players);
      return response.tournamentId;
    }
    return null;
  } catch (error) {
    console.error('Failed to create tournament in DB:', error);
    return null;
  }
}

/**
 * Guarda los participantes del torneo en la base de datos
 */
async function saveTournamentParticipants(
  tournamentId: number,
  players: Player[]
): Promise<void> {
  try {
    const participants = players.map((player, index) => ({
      tournament_id: tournamentId,
      user_id: player.isGuest ? null : player.id,
      display_name: player.name,
      seed: index + 1
    }));

    await api('/api/database/tournament-participants', {
      method: 'POST',
      body: JSON.stringify({ participants })
    });
  } catch (error) {
    console.error('Failed to save tournament participants:', error);
  }
}

/**
 * Inicia un torneo en la base de datos
 */
export async function startTournamentInDB(tournamentId: number): Promise<void> {
  try {
    await api(`/api/database/tournaments/${tournamentId}/start`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'active',
        started_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to start tournament in DB:', error);
  }
}

/**
 * Guarda una partida del torneo en la base de datos
 * Solo guarda si al menos un jugador está registrado
 */
export async function saveTournamentMatch(
  tournamentId: number,
  player1: Player,
  player2: Player,
  player1Score: number,
  player2Score: number,
  winner: Player,
  matchDuration?: number
): Promise<{ success: boolean; matchId?: number }> {
  // Solo guardar si hay al menos un jugador registrado
  const hasRegisteredPlayer = !player1.isGuest || !player2.isGuest;
  
  if (!hasRegisteredPlayer) {
    console.log('Match not saved: both players are guests');
    return { success: true };
  }

  try {
    const payload = {
      player1_id: player1.isGuest ? null : player1.id,
      player1_name: player1.name,
      player2_id: player2.isGuest ? null : player2.id,
      player2_name: player2.name,
      player1_score: player1Score,
      player2_score: player2Score,
      winner_id: winner.isGuest ? null : winner.id,
      winner_name: winner.name,
      game_type: 'pong',
      tournament_id: tournamentId,
      match_duration: matchDuration || null
    };

    const response = await api<{ success: boolean; matchId: number }>(
      '/api/database/matches',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );

    return { success: true, matchId: response.matchId };
  } catch (error) {
    console.error('Failed to save tournament match:', error);
    return { success: false };
  }
}

/**
 * Completa un torneo en la base de datos
 */
export async function completeTournamentInDB(
  tournamentId: number,
  winner: Player,
  currentRound: number
): Promise<void> {
  try {
    await api(`/api/database/tournaments/${tournamentId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'completed',
        winner_id: winner.isGuest ? null : winner.id,
        winner_name: winner.name,
        current_round: currentRound,
        completed_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to complete tournament in DB:', error);
  }
}

/**
 * Actualiza la ronda actual del torneo
 */
export async function updateTournamentRound(
  tournamentId: number,
  currentRound: number
): Promise<void> {
  try {
    await api(`/api/database/tournaments/${tournamentId}/round`, {
      method: 'PATCH',
      body: JSON.stringify({
        current_round: currentRound
      })
    });
  } catch (error) {
    console.error('Failed to update tournament round:', error);
  }
}