# TODO

## High Priority
- [ ] General testing of endpoints

### Database Schema
- [ ] Schema for README

### Docker Configuration
- [ ] Prepare final production version without bind-mounts

### Git comments
- [ ] Investigate changing git comments history

### Documentation


## Medium Priority
- [ ] Friends list UI (show friends, online status, send requests)
- [ ] Tournament UI and matchmaking logic
- [ ] Profile page: show user stats & match history
- [ ] TicTacToe integration with gameService

### Documentation
- [ ] Update README.md


## Low Priority / Bug reports
- [ ] Update button in profile page overwrites the image. We can recicle to change the mail, maybe
- [ ] Check erase od information and account in GDPR

### Documentation
- [ ] Create issue templates (bug report, feature request)


### Database Endpoints


### Shared HTTP Client



## Testing Checklist

### After `make` (container rebuild)
- [ ] PvP game: Check player name modal appears
- [ ] PvP game: Verify names display during game
- [ ] PvP game: Confirm match saves after game ends (check console)
- [ ] AI game: Verify difficulty selection works
- [ ] AI game: Confirm match saves with AI as player2
- [ ] Guest vs Guest: Verify match is NOT saved (skipped)
- [ ] Check enpoints? in dashboard?