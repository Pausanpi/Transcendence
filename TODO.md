# TODO

**Organization:**
- **Track contributors**: Add your username when creating tasks (e.g., `lcuevas- / todo`), and note who solved them when completed (e.g., `lcuevas- / pausanch`)
- **High and Medium Priority**: Active todo lists that can be checked off or expanded as needed.
- **Low Priority / Bug Reports**: Numbered list for tracking issues. When resolved, move entries to the "Solved Bug Reports" section below.


## High Priority
- [ ] General testing of endpoints. Codes an errors messages seem fine, frontend should handle that gracefully.
Basically when we return an error on a api request, instead of do a condole.error we handle it "gracefully". 21, 23, 26, 27 
Also Post, Put, Delete etc... should be protected from unexpeected imput (lcuevas- / todo)
- [x] Everything is runing dinamically, game keeps running in the background. Maybe load and refresh pages less dinamically? Bug report 15 (lcuevas- / todo)

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


## Low Priority / Bug reports
- [x] **001**: Update button in profile page overwrites the image. We can recicle to change the mail, maybe (lcuevas- / lcuevas-)
- [ ] **002**: Check erase od information and account in GDPR (lcuevas- / todo)
- [x] **003**: Error mensajes in the log due to console.errors in the frontend pages.ts files. some can just be reordenated. Example in loadPLayers in players.ts. We should Check every console.error and console.log (lcuevas- / lcuevas-)
- [x] **004**: Similarly to 003, there are network errors when the api "fails" even in a expcted way. (lcuevas- / lcuevas-)
- [x] **005**: Navbar interfered with responsiveness. Improved resnposive changes in general. (lcuevas- / lcuevas-)
- [x] **006**: Navbar is not translated. Some buttons like "Dashboard" and titles  like "Players" in front page also (lcuevas- / pausanch)
- [ ] **007**: Update database scheme in README and image to the last version with tournament and sessions? (lcuevas- / TODO)
- [x] **008**: Handling fetch error when failing to log a player as second player in a match (lcuevas- / lcuevas-)
- [x] **009**: You cna play against yourself if logged in (lcuevas- / lcuevas-)
- [ ] **010**: Check friends process and online status (lcuevas- / todo)
- [x] **011**: Add button for extra information in profile page, like the cards we render and such (lcuevas- / lcuevas-)
- [ ] **012**: Make the leaderboard. (lcuevas- / todo)
- [ ] **013**: Oauth 2 Deactivated, reactivate with API key?. (lcuevas- / todo)
- [ ] **014**: IA movement overshoots and never stop mooving. (lcuevas- / todo)
- [X] **015**: Games keep runing in backgorund if we change pages. (lcuevas- / pausanch)
- [X] **016**: Tic-Tac-Toe does not track matches. (lcuevas- / pausanch)
- [X] **017**: Check subject compliance for Games Customization module. (lcuevas- / pausanch)
- [ ] **018**: Promehteus and grapahan are deactivated. (lcuevas- / todo)
- [ ] **019**: Clean references to old users module. (lcuevas- / todo)
- [ ] **020**: Check GDPR module for new requisites, like requesting data via mail (lcuevas- / todo)
- [x] **021**: Logout button behaves weirdly. Check browser console nad network (lcuevas- / todo)
- [X] **022**: Privacy Policy and Terms of Service are not translated. Don't know if it needs it (lcuevas- / pausanch)
- [ ] **023**: Log out button make a strange network error. Also console shows 400 bad request. SHould look into that (lcuevas- / todo)
- [X] **024**: Match History cut on the bottom in profile (pausanch / pausanch)
- [X] **025**: Match History don't show type of game (pausanch / pausanch)
- [ ] **026**: Dashboard without loging shows a 502. May be for deprecated fetch, also protect better the endpoint(lcuevas- / todo)
- [ ] **027**: Like we said, some POST are not protected.  cahnge-lenguaje with nothing inside makes a error 500 (lcuevas- / todo)
- [x] **028**: Nickname update is not parsed and can load a text as long as you want. Let's cut it to 10 or something (lcuevas- / lcuevas-)
- [ ] **029**: After Erasing image there is some kind of cors error. Also check if we just make it null, maybe players is trying to load the image and when failing is doing osmething and showing error. Maybe is about the github image (lcuevas- / todo)
- [x] **030**: PLayers page return too much information?, id and name?. At least ID should not be return. (lcuevas- / lcuevas-)
- [x] **031**: Check and edit or take out search button in frineds. At least ID should not be return. (lcuevas- / lcuevas-)
- [ ] **032**: Aded security audit file wiht some problematic endpoints. (lcuevas- / lcuevas-)
- [ ] **033**: It seems we make a lot of endpoints generate generic errors, 400 or 500, we have to change that to specific ones and handle it in the forntend (lcuevas- / todo)
- [ ] **034**: Better check the responsivnes of the profile page, seem to have some limits (lcuevas- / todo)

# Solved Bug reports

- [x] **003**: Error mensajes in the log due to console.errors in the frontend pages.ts files. some can just be reordenated. Example in loadPLayers in players.ts. We should Check every console.error and console.log (lcuevas- / lcuevas-)
- [x] **004**: Similarly to 003, there are network errors when the api "fails" even in a expcted way. This is due to the browser DevTools, we CAN NOT silence that, our backend is correct. The frontend handle it gracefully, but hte devtools will launch that everytime since it is monitoring the requests. (lcuevas- / lcuevas-)
- [x] **005**: Navbar interfered with responsiveness. Improved resnposive changes in general. (lcuevas- / lcuevas-)
- [x] **008**: Handling fetch error when failing to log a player as second player in a match (lcuevas- / lcuevas-)
- [x] **009**: You cna play against yourself if logged in (lcuevas- / lcuevas-)
- [X] **015**: Games keep runing in backgorund if we change pages. General strucutre mantained, used listeners to stop game gracefully (lcuevas- / pausanch)
- [x] **001**: Update button in profile page overwrites the image. We can recicle to change the mail, maybe. Recicled the button for mail updating. Mail is validated and Also imprived translation and (lcuevas- / lcuevas-)
- [x] **011**: Ad button for exra information in profile page, like the cards we render and such (lcuevas- / lcuevas-)
- [X] **016**: Tic-Tac-Toe does not track matches. Recicle function from pong (lcuevas- / pausanch)
- [X] **024**: Match History cut on the bottom in profile. The container was cropped so that it does not occupy the footer and does not hide behind it. (pausanch / pausanch)
- [X] **025**: Match History don't show type of game. I added a new variable so that the game appears in the history. (pausanch / pausanch)
- [x] **030**: PLayers page return too much information?, id and name?. At least ID should not be return. Changed to use username as public identifier instead of exposing internal database IDs. (lcuevas- / lcuevas-)
- [x] **032**: Aded security audit file wiht some problematic endpoints. Fixed 1 and 2, 3 to 6 are from the tournament  (lcuevas- / lcuevas-)
- [x] **028**: Nickname update is not parsed and can load a text as long as you want. Parsed on frotnend and backend (lcuevas- / lcuevas-)
- [x] **006**: Navbar is not translated. Some buttons like "Dashboard" and titles  like "Players" in front page also (lcuevas- / pausanch)
- [x] **021**: Logout button behaves weirdly. Check browser console nad network. The endpoint was deprecated, enrouted to a valid exisiting one and parsed some errors. Also it needed a body to be accepted
Also aded empty body to /api/2fa/backup-codes/generate (lcuevas- / lcuevas-)



That seem to do the trick, in the same vein we should adjust the endpoints we call from the frontend.

Because some malignant agent could fabricate a fetch with their user token to try and attack the server.

In that sense the project says:

Browser Compatibility
Does the application run on the latest stable Google Chrome without errors
or warnings in the console?
Open Chrome DevTools and verify the console.
There should be no errors or warnings visible in the browser console.
Minor warnings from third-party libraries may be acceptable if explained.

We are mostly cool at the moment but we have endpoint in our backend in general that return error 400 and 500 in case anything goes wrong, without parsing the input, they trust the frontend when it should not do it, it should parse the input.

I want to do an audit of all those points.
SO let's do it step but step.

First let's locate them and diagnosticate them and then we will fix the code one by one.