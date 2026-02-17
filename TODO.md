# TODO

**Organization:**
- **Track contributors**: Add your username when creating tasks (e.g., `lcuevas- / todo`), and note who solved them when completed (e.g., `lcuevas- / pausanch`)
- **High and Medium Priority**: Active todo lists that can be checked off or expanded as needed.
- **Low Priority / Bug Reports**: Numbered list for tracking issues. When resolved, move entries to the "Solved Bug Reports" section below.


## High Priority
- [ ] General testing of endpoints. Codes an errors messages seem fine, frontend should handle that gracefully (lcuevas- / todo)

### Database Schema
- [ ] Database schema for README (lcuevas- / todo)

### Docker Configuration
- [ ] Prepare final production version without bind-mounts (lcuevas- / todo)

### Git comments
- [ ] Investigate changing git comments history (lcuevas- / todo)

### Documentation


## Medium Priority
- [ ] Friends list UI (show friends, online status, send requests) (lcuevas- / todo)
- [ ] Tournament UI and matchmaking logic (lcuevas- / todo)
- [ ] Profile page: show user stats & match history (lcuevas- / todo)
- [ ] TicTacToe integration with gameService (lcuevas- / todo)

### Documentation
- [ ] Update README.md (lcuevas- / todo)
- [ ] Create issue templates (bug report, feature request) (lcuevas- / todo)


## Low Priority / Bug reports
- [ ] **001**: Update button in profile page overwrites the image. We can recicle to change the mail, maybe (lcuevas- / todo)
- [ ] **002**: Check erase od information and account in GDPR (lcuevas- / todo)
- [x] **003**: Error mensajes in the log due to console.errors in the frontend pages.ts files. some can just be reordenated. Example in loadPLayers in players.ts. We should Check every console.error and console.log (lcuevas- / lcuevas-)
- [x] **004**: Similarly to 003, there are network errors when the api "fails" even in a expcted way. (lcuevas- / lcuevas-)


## Testing Checklist

### After `make` (container rebuild)
- [ ] PvP game: Check player name modal appears
- [ ] PvP game: Verify names display during game
- [ ] PvP game: Confirm match saves after game ends (check console)
- [ ] AI game: Verify difficulty selection works
- [ ] AI game: Confirm match saves with AI as player2
- [ ] Guest vs Guest: Verify match is NOT saved (skipped)
- [ ] Check enpoints? in dashboard?

# Solved Bug reports

- [x] **003**: Error mensajes in the log due to console.errors in the frontend pages.ts files. some can just be reordenated. Example in loadPLayers in players.ts. We should Check every console.error and console.log (lcuevas- / lcuevas-)
- [x] **004**: Similarly to 003, there are network errors when the api "fails" even in a expcted way. This is due to the browser DevTools, we CAN NOT silence that, our backend is correct. The frontend handle it gracefully, but hte devtools will launch that everytime since it is monitoring the requests. (lcuevas- / lcuevas-)