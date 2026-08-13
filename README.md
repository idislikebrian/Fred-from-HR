# Fred from HR - Discord Bot

Fred is a Discord bot with prefix commands that use `-`.

**Production runs on JavaScript only.** The entry point is [`src/index.js`](src/index.js) (Node.js / discord.js), started by PM2. The original Python (`discord.py`) implementation is archived for historical reference under [`legacy/python/`](legacy/python/) and is not executed in production — see that directory's README before restoring any command from it. Historical Replit deployment configuration is archived under [`legacy/replit/`](legacy/replit/); current production does not use Replit.

Runtime data, `.env`, and installed dependencies are local-only and are not committed as project source.

**Process management:** this bot is supervised by the systemd-managed PM2 daemon (`pm2-root.service`), alongside `theprincipal` and `jowcm-hotline`. Before running any `pm2` command against it, read `/root/AGENTS.md` — the interactive `pm2` CLI on this box has a known split-brain trap that makes `pm2 list`/`restart`/`stop` silently lie about what's running. (This is also the "Restore normal PM2 CLI management" item in the Maintenance roadmap below — `/root/AGENTS.md` documents the current broken state in detail.)

## Commands

- `-ping` — Basic connectivity check.
- `-help [command]` — List available commands, or show usage/access details for one command. Generated from each command module's own metadata, so it always reflects what's actually loaded.
- `-verify @user` — Verify a mentioned member. Use this in the `🤝・verification` channel.
- `-daily` — Claim the daily reward.
- `-weekly` — Claim Fred's weekly 10,000 🧧 reward. Requires the `VERIFIED` role or `Administrator`.
- `-balance` — Check your current currency balance.
- `-art [search terms]` — Fetch a random artwork from The Met collection. Requires the `VERIFIED` role or `Administrator`. If no search terms are provided, Fred uses a built-in art query.
- `-flip [heads|tails]` — Flip a coin. Aliases: `-coin`, `-coinflip`. You can also mention a user to direct the result.
- `-handshake @user` — Send a handshake GIF to a mentioned member. Requires the `VERIFIED` role or `Administrator`.
- `-hug @user` — Send a hug GIF to a mentioned member.
- `-magic8 question...` — Ask the Magic 8 Ball a question.
- `-match @user` — Gauge the love between you and a mentioned member. Requires the `VERIFIED` role or `Administrator`.
- `-roll` — Start a Cee-lo game in `<#814947576297160746>`. Players join by reacting with 🎲 during the countdown.
- `-roulette` — Play a roulette-style chance game.
- `-sacrifice @user` — Sacrifice a mentioned member to a random cause. Requires the `VERIFIED` role or `Administrator`.

## Other bot behavior

- Fred sends a welcome DM when a member joins the server.
- Reaction-role behavior is not present as a command in the current JavaScript source.
- Member-facing command access (Administrator or exact `VERIFIED` role) is centralized in [`src/utils/memberAccess.js`](src/utils/memberAccess.js). This still reflects the legacy bot-managed verification role; it is expected to change when Workshop moves to Discord-native Rules Screening, which has not happened yet.

## Roadmap — 2026-08-06

> This roadmap records the state of Fred’s JavaScript migration and the agreed next steps as of August 6, 2026.

### Restore from the legacy Python bot

- [x] `weekly` — restored; see Commands above
- [x] `handshake` — restored; see Commands above
- [x] `sacrifice` — restored; see Commands above
- [x] `match` — restored; see Commands above
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

- [x] Archive the legacy Python implementation under `legacy/python/`
- [x] Remove tracked Python cache and Replit artifact files
- [x] `uploader.cfg` removed from Git tracking (unused, unreferenced by any current code — see `legacy/python/README.md` history). A forensic copy is retained outside the repo with restrictive permissions. **Manual step still required:** rotate/revoke the imgur credential this file held, since an OAuth refresh token does not expire on its own.
- [x] Mark archived Python as vendored for GitHub Linguist
- [x] Add a generated `-help` command — see `src/commands/help.js`
- [x] Centralize verified-member permission checks — see `src/utils/memberAccess.js`
- [ ] Restore normal PM2 CLI management

## Project Structure

- `src/index.js` — Main entry point and command/event wiring.
- `src/commands/` — Individual command modules.
- `test/` — Node test coverage for command behavior.
- `package.json` — Runtime and test scripts.
- `legacy/python/` — Archived Python (`discord.py`) implementation. Historical reference only; not used in production.
- `legacy/replit/` — Archived Replit deployment configuration. Historical reference only; not used in production.
