# TODO

**Organization:**
- **Track contributors**: Add your username when creating tasks (e.g., `lcuevas- / todo`), and note who solved them when completed (e.g., `lcuevas- / pausanch`)
- **High and Medium Priority**: Active todo lists that can be checked off or expanded as needed.
- **Low Priority / Bug Reports**: Numbered list for tracking issues. When resolved, move entries to the "Solved Bug Reports" section below.


## High Priority
- [ ] General testing of endpoints. Codes an errors messages seem fine, frontend should handle that gracefully.
Basically when we return an error on a api request, instead of do a condole.error we handle it "gracefully" (lcuevas- / todo)
- [ ] Everything is runing dinamically, game keeps running in the background. Maybe load and refresh pages less dinamically? Bug report 15 (lcuevas- / todo)

### Database Schema
- [x] Database schema for README (lcuevas- / lcuevas-)
- [ ] Database schema must be updated in the final version(lcuevas- / todo)

### Docker Configuration
- [ ] Prepare final production version without bind-mounts (lcuevas- / todo)
- [ ] Nginx must generate the certificates at runtime (lcuevas- / todo)

### Git comments
- [ ] Investigate changing git comments history (lcuevas- / todo)

### Authentications
- [ ] Oauth need api keys to be configured? (lcuevas- / todo)

## Medium Priority
- [ ] Check friends list UI (show friends, online status, send requests) (lcuevas- / todo)
- [ ] Check tournament UI and matchmaking logic (lcuevas- / todo)
- [ ] Profile page: show user stats & match history. Bug report 11 (lcuevas- / todo)
- [ ] Add Leaderboards: Bug report 12 (lcuevas- / todo)
- [ ] TicTacToe integration with gameService. Bug report 16 (lcuevas- / todo)
- [ ] Database service is in realuty UserManagement service, should we change anything? (lcuevas- / todo)


### Documentation
- [x] Update README.md (lcuevas- / lcuevas-)
- [x] Privacy Policy and Terms of services, accesible and tick in the registration (lcuevas- / lcuevas-)
- [ ] Create issue templates (bug report, feature request) (lcuevas- / todo)



## Low Priority / Bug reports
- [ ] **001**: Update button in profile page overwrites the image. We can recicle to change the mail, maybe (lcuevas- / todo)
- [ ] **002**: Check erase od information and account in GDPR (lcuevas- / todo)
- [x] **003**: Error mensajes in the log due to console.errors in the frontend pages.ts files. some can just be reordenated. Example in loadPLayers in players.ts. We should Check every console.error and console.log (lcuevas- / lcuevas-)
- [x] **004**: Similarly to 003, there are network errors when the api "fails" even in a expcted way. (lcuevas- / lcuevas-)
- [x] **005**: Navbar interfered with responsiveness. Improved resnposive changes in general. (lcuevas- / lcuevas-)
- [ ] **006**: Navbar is not translated. Some buttons like "Dashboard" and titlesl ike "Players" in front page also (lcuevas- / TODO)
- [ ] **007**: Update database scheme in README and image to the last version with tournament and sessions? (lcuevas- / TODO)
- [x] **008**: Handling fetch error when failing to log a player as second player in a match (lcuevas- / lcuevas-)
- [x] **009**: You cna play against yourself if logged in (lcuevas- / lcuevas-)
- [ ] **010**: Check friends process and online status (lcuevas- / todo)
- [ ] **011**: Ad button for exra information in profile page, like the cards we render and such (lcuevas- / todo)
- [ ] **012**: Make the leaderboard. (lcuevas- / todo)
- [ ] **013**: Oauth 2 Deactivated, reactivate with API key?. (lcuevas- / todo)
- [ ] **014**: IA movement overshoots and never stop mooving. (lcuevas- / todo)
- [ ] **015**: Games keep runing in backgorund if we change pages. (lcuevas- / todo)
- [ ] **016**: Tic-Tac-Toe does not track matches. (lcuevas- / todo)
- [ ] **017**: Check subject compliance for Games Customization module. (lcuevas- / todo)
- [ ] **018**: Promehteus and grapahan are deactivated. (lcuevas- / todo)
- [ ] **019**: Clean references to old users module. (lcuevas- / todo)
- [ ] **020**: Check GDPR module for new requisites, like requesting data via mail (lcuevas- / todo)

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
- [x] **005**: Navbar interfered with responsiveness. Improved resnposive changes in general. (lcuevas- / lcuevas-)
- [x] **008**: Handling fetch error when failing to log a player as second player in a match (lcuevas- / lcuevas-)
- [x] **009**: You cna play against yourself if logged in (lcuevas- / lcuevas-)
