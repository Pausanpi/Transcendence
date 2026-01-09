# TODO

## Current Status (2026-01-07)

### 🔧 In Progress: Match Saving Not Working
- **Issue:** Matches not being saved to database after game ends
- **Debug added:** Console logs in `saveMatch()` to trace the issue
- **Next step:** Check browser console for logs when playing a match:
  - Look for `saveMatch called with: {...}`
  - Check if player1.id is populated when logged in
  - Verify `endGameSession` is being called (game reaches 5 points)

### ✅ Fixed Issues
- [x] Registration error "auth.creationError" → Added `DATABASE_SERVICE_URL` to docker-compose.yml
- [x] TypeScript changes not reflecting → Recompiled with `npx tsc`
- [x] Match saving auth requirement → Only saves if at least one player is logged in

---

## ✅ Completed (2026-01-07)

### Database Schema
- [x] Extended `users` table (display_name, wins, losses, games_played, online_status, last_seen)
- [x] Created `friendships` table
- [x] Created `tournaments` table
- [x] Created `tournament_participants` table
- [x] Created `matches` table

### Database Endpoints
- [x] `database/routes/matches.js` - Match history & user stats
- [x] `database/routes/tournaments.js` - Tournament CRUD & participants
- [x] `database/routes/friends.js` - Friend system & online status

### Shared HTTP Client
- [x] Added client methods for matches, tournaments, friends

### Frontend Game Integration
- [x] Created `frontend/src/gameService.ts` - Game-to-database bridge
- [x] Modified `frontend/src/pong.ts` - Player setup & match saving
- [x] Modified `frontend/src/pages/games.ts` - Uses new setupPongGame()
- [x] Modified `frontend/src/auth.ts` - Clears user cache on logout
- [x] Modified `frontend/src/main.ts` - Imports gameService

### Docker Configuration
- [x] Added `DATABASE_SERVICE_URL=http://database:3003` to auth service
- [x] Added `DATABASE_SERVICE_URL=http://database:3003` to users service

---

## 📋 Pending Tasks

### High Priority (Next Session)
- [ ] Debug match saving - check browser console logs
- [ ] Test complete flow: login → play game → verify match saved
- [ ] Scoreboard/leaderboard page

### Medium Priority
- [ ] Friends list UI (show friends, online status, send requests)
- [ ] Tournament UI and matchmaking logic
- [ ] Profile page: show user stats & match history
- [ ] TicTacToe integration with gameService

### Low Priority / Future
- [ ] Real-time notifications for friend requests
- [ ] Tournament brackets visualization
- [ ] Match replay system
- [ ] Spectator mode

---

## 🚀 GitHub Collaboration Setup (Tomorrow)

### Branch Protection Rules
- [ ] Require pull request reviews before merging
- [ ] Require status checks to pass
- [ ] Require branches to be up to date

### GitHub Actions CI
- [ ] TypeScript compile check
- [ ] ESLint linting
- [ ] Docker build test

### Documentation
- [ ] Create CONTRIBUTING.md with workflow guidelines
- [ ] Create issue templates (bug report, feature request)
- [ ] Update README.md with setup instructions

---

## Testing Checklist

### After `make` (container rebuild)
- [ ] PvP game: Check player name modal appears
- [ ] PvP game: Verify names display during game
- [ ] PvP game: Confirm match saves after game ends (check console)
- [ ] AI game: Verify difficulty selection works
- [ ] AI game: Confirm match saves with AI as player2
- [ ] Guest vs Guest: Verify match is NOT saved (skipped)
- [ ] Check database: `curl -s http://localhost:3003/matches | jq .`
