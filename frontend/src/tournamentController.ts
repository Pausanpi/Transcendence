import { navigate } from "./router.js";
import type { Player } from "./gameService.js";
import {
	loadTournament,
	saveTournament,
	getCurrentMatch,
	setMatchWinner,
	advanceTournament,
	getChampion,
	saveTournamentMatch,
	updateTournamentRound,
	completeTournamentInDB
} from "./tournamentEngine.js";
import { startGameSession } from "./gameService.js";
import { initPongGame, setOnGameEnd, showWinnerOverlay } from "./pong.js";

export function startCurrentMatch(): void {
	const tournament = loadTournament();
	if (!tournament) return;

	const match = getCurrentMatch(tournament);
	if (!match) return;

	console.log("Starting match:", match.player1.name, "vs", match.player2.name);

	startGameSession({
		player1: match.player1,
		player2: match.player2,
		gameType: 'pong',
		isAI: match.player2.id === "AI",
		difficulty: match.player2.id === "AI" ? 3 : undefined,
		startTime: Date.now(),
		tournamentId: tournament.tournamentId || null
	});

	setOnGameEnd((result) => {
		showWinnerOverlay(result.winner.name, () => {
			// Store the result of the match and go ahead with the tournament
			finishMatch(result.winner, result.player1Score, result.player2Score);
		});
	});

	navigate("game");
	setTimeout(() => {
		initPongGame({
			player1: match.player1,
			player2: match.player2,
			isAI: match.player2.id === "AI",
			difficulty: match.player2.id === "AI" ? 3 : undefined
		});
	}, 100);
}

export async function finishMatch(
	winner: Player,
	player1Score: number,
	player2Score: number
): Promise<void> {
	const tournament = loadTournament();
	if (!tournament) return;

	const match = getCurrentMatch(tournament);
	if (!match) return;

	// Store the match in the DB if there is a tournament ID and at least one registered user
	if (tournament.tournamentId) {
		// Obtain match duration based on the session
		const session = await import('./gameService.js').then(m => m.getGameSession());
		const matchDuration = session
			? Math.floor((Date.now() - session.startTime) / 1000)
			: null;

		await saveTournamentMatch(
			tournament.tournamentId,
			match.player1,
			match.player2,
			player1Score,
			player2Score,
			winner,
			matchDuration || undefined
		);
	}

	// Update the tournament locally
	setMatchWinner(tournament, winner);
	const previousRound = tournament.currentRoundIndex;
	advanceTournament(tournament);
	saveTournament(tournament);

	// Update round in DB if changed
	if (tournament.tournamentId && tournament.currentRoundIndex !== previousRound) {
		await updateTournamentRound(tournament.tournamentId, tournament.currentRoundIndex);
	}

	// Check if there is a champion
	const champion = getChampion(tournament);
	if (champion) {
		// Complete tournament in DB
		if (tournament.tournamentId) {
			await completeTournamentInDB(
				tournament.tournamentId,
				champion,
				tournament.currentRoundIndex
			);
		}
		showChampion(champion);
	} else {
		navigate("tournament_game");
	}
}

function showChampionOverlay(championName: string, onComplete: () => void): void {
	const el = document.getElementById('countdown');
	const txt = document.getElementById('countdownText');

	if (!el || !txt) {
		onComplete();
		return;
	}

	el.classList.remove('hidden');
	txt.innerHTML = `<div class="text-6xl font-bold text-yellow-400 mb-4">🏆 ${championName}</div><div class="text-4xl font-semibold text-yellow-300">Tournament Champion!</div>`;

	setTimeout(() => {
		el.classList.add('hidden');
		txt.className = 'text-9xl font-extrabold text-yellow-300';
		txt.innerHTML = '';
		onComplete();
	}, 4000);
}

function showChampion(player: Player): void {
	showChampionOverlay(player.name, () => {
		sessionStorage.removeItem("pongTournament");
		navigate("home");
	});
}