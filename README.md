# Fred from HR - Discord Bot

## Migrated Commands (JavaScript)
- `ping`: Basic connectivity check.
- `verify`: Verify a user in the verification channel.
- `daily`: Claim daily rewards (1,000 🧧).
- `balance`: Check your current currency balance.

## Legacy Commands (Python - Pending Migration)
- `gig`: Post a job listing to the classifieds channel.
- `memo`: Generate a daily memorandum (Facilitator only).
- `weekly`: Claim weekly rewards (10,000 🧧).
- `crypto`: Get current cryptocurrency prices.
- `ticker`: Get stock market prices.
- `ceelo`: Play the Ceelo dice game.
- `magic8`: Ask the Magic 8 Ball a question.
- `sacrifice`: Sacrifice a user to the Spaghetti Monster.
- `handshake`: Give another user a handshake GIF.
- `hug`: Give another user a hug GIF.
- `match`: Check love compatibility with another user.
- `reaction_roles`: Automatic role assignment via reactions.

## Project Structure
- `src/index.js`: Main entry point and event handlers.
- `src/commands/`: Individual command modules.
- `src/database/db.js`: SQLite database interface.
- `src/utils/constants.js`: Static data and strings.
- `bot_data.db`: SQLite database file.
