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

## Project Structure

- `src/index.js` — Main entry point and command/event wiring.
- `src/commands/` — Individual command modules.
- `test/` — Node test coverage for command behavior.
- `package.json` — Runtime and test scripts.

