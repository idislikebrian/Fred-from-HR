# Fred from HR - Discord Bot

## Overview

Fred from HR is a Discord bot being actively migrated from Python (discord.py) to JavaScript (discord.js v14). The bot serves a community server with features including user verification, virtual currency/economy system, fun commands (Magic 8 Ball, coin flip, dice games), media lookups (movies, books), financial data (crypto, stocks), and reaction-based role assignment.

The project is mid-migration: core commands (ping, verify, daily, balance) have been ported to JavaScript, while many commands (ceelo, magic8, sacrifice, crypto, ticker, media, reaction roles) still exist only as Python cogs. The JavaScript version is the primary runtime going forward.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Runtime & Entry Point
- **Primary runtime**: Node.js with `src/index.js` as the main entry point
- **Legacy runtime**: Python `main.py` with cogs pattern (being phased out)
- The bot uses a message-based command prefix (`-`) rather than Discord slash commands
- Commands are loaded dynamically from `src/commands/` directory using `fs.readdirSync`

### Command Pattern
- Each command is a separate module in `src/commands/` exporting an object with `name`, `description`, and `execute(message, args)` function
- Commands are registered in a `Collection` on the client object and dispatched in the `messageCreate` event handler
- When adding new commands, create a new `.js` file in `src/commands/` following the existing pattern — it will be auto-loaded

### Database
- **SQLite** using the `sqlite3` npm package (file-based at `bot_data.db` in project root)
- Database abstraction layer in `src/database/db.js` with Promise-wrapped query functions
- Single `users` table with schema: `id TEXT PRIMARY KEY, balance INTEGER DEFAULT 0, last_daily_claim TEXT, last_weekly_claim TEXT`
- Uses `INSERT ... ON CONFLICT ... DO UPDATE` (upsert) pattern for writes
- The same `bot_data.db` file was shared with the Python version, so schema compatibility matters

### Keep-Alive Server
- An Express server runs on port 5000 serving a simple health-check endpoint
- This is a common pattern for keeping bots alive on platforms like Replit
- The Python version had an equivalent Flask server on port 8080

### Legacy Python Structure
- Python cogs in `cogs/` directory: `finance.py`, `ceelo.py`, `media.py`, `fun.py`, `reaction_roles.py`
- These represent commands that still need to be migrated to JavaScript
- `utils.py` and `src/utils/constants.js` contain the same static data (GIF URLs, response arrays, etc.) — the JS version is the canonical copy going forward

### Key Design Decisions
- **Prefix commands over slash commands**: The bot uses `-` prefix commands for simplicity and backward compatibility with existing users. Slash commands could be added later but are not currently used.
- **SQLite over hosted database**: Chosen for simplicity and zero-config. The database file lives alongside the code. If scaling is needed, migration to PostgreSQL would be straightforward given the simple schema.
- **Gradual migration strategy**: Python commands are being ported one at a time to JS, keeping both codebases present during transition.

## External Dependencies

### npm Packages
- **discord.js v14**: Core Discord API library
- **sqlite3**: SQLite database driver
- **express**: HTTP server for keep-alive endpoint
- **dotenv**: Environment variable loading from `.env` file
- **axios**: HTTP client (for future API calls during command migration)
- **cheerio**: HTML parsing (for web scraping commands being migrated)

### Environment Variables (via `.env`)
- `DISCORD_TOKEN` (or similar): Discord bot authentication token
- `ALPHA_VANTAGE_API_KEY`: Stock market data API (used in Python finance cog, pending migration)
- `FINNHUB_API_KEY`: Alternative stock data API (used in Python finance cog)
- `tmdb.API_KEY`: The Movie Database API key (used in Python media cog)

### External APIs (used in Python cogs, to be migrated)
- **CoinGecko API**: Cryptocurrency prices (via `pycoingecko` in Python)
- **Alpha Vantage / Finnhub**: Stock market data
- **TMDB (The Movie Database)**: Movie information and posters
- **Google Books API**: Book search (referenced in media cog)
- **Tenor**: GIF hosting for fun command responses (URLs hardcoded in constants)

### Discord Server Configuration
- The bot references specific channel IDs and role IDs (hardcoded) for features like verification, reaction roles, and the Cee-lo game channel
- Reaction roles are configured for a specific message ID (`808727603808174121`) with emoji-to-role mappings