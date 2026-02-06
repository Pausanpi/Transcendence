import type { Player } from "./gameService";

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