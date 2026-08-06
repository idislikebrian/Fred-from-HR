# Fred from HR - Discord Bot

Fred is a Discord bot with prefix commands that use `-`.

Runtime data, `.env`, and installed dependencies are local-only and are not committed as project source.

## Commands

- `-ping` — Basic connectivity check.
- `-verify @user` — Verify a mentioned member. Use this in the `🤝・verification` channel.
- `-daily` — Claim the daily reward.
- `-balance` — Check your current currency balance.
- `-art [search terms]` — Fetch a random artwork from The Met collection. Requires the `VERIFIED` role or `Administrator`. If no search terms are provided, Fred uses a built-in art query.
- `-flip [heads|tails]` — Flip a coin. Aliases: `-coin`, `-coinflip`. You can also mention a user to direct the result.
- `-hug @user` — Send a hug GIF to a mentioned member.
- `-magic8 question...` — Ask the Magic 8 Ball a question.
- `-roll` — Start a Cee-lo game in `<#814947576297160746>`. Players join by reacting with 🎲 during the countdown.
- `-roulette` — Play a roulette-style chance game.

## Other bot behavior

- Fred sends a welcome DM when a member joins the server.
- Reaction-role behavior is not present as a command in the current JavaScript source.

## Roadmap — 2026-08-06

> This roadmap records the state of Fred’s JavaScript migration and the agreed next steps as of August 6, 2026.

### Restore from the legacy Python bot

- [ ] `weekly` — restore the weekly economy reward
- [ ] `handshake` — restore the social handshake command
- [ ] `sacrifice` — restore the Spaghetti Monster command
- [ ] `match` — restore compatibility matching
- [ ] `deathmatch` — restore the competitive social command
- [ ] `book` — rebuild using a maintained public books API
- [ ] `movie` — rebuild using a maintained movie API
- [ ] `crypto` — rebuild after selecting a maintained market-data API
- [ ] `ticker` — rebuild after selecting a maintained stock-market API

### Retired

- [x] `gig` — intentionally retired; do not migrate

### Owned by Principal

- [x] `memo` — administrative memo functionality belongs to The Principal

### Redesign later

- [ ] Role assignment system — do not directly port the old hardcoded reaction-role implementation
  - evaluate buttons or select menus
  - keep configuration/admin controls with The Principal
  - let Fred present member-facing role selection where appropriate

### Maintenance

- [ ] Archive the legacy Python implementation under `legacy/python/`
- [ ] Remove tracked Python cache and Replit artifact files
- [ ] Review, rotate, and remove credentials from `uploader.cfg`
- [ ] Mark archived Python as vendored for GitHub Linguist
- [ ] Add a generated `-help` command
- [ ] Centralize verified-member permission checks
- [ ] Restore normal PM2 CLI management

## Project Structure

- `src/index.js` — Main entry point and command/event wiring.
- `src/commands/` — Individual command modules.
- `test/` — Node test coverage for command behavior.
- `package.json` — Runtime and test scripts.
