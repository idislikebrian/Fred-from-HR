# Legacy Python implementation (archived)

Fred originally ran as a Python bot built on `discord.py`. This directory is
an **archive of that implementation, kept for historical reference only**.
It is not used in production.

Production now runs from **`src/index.js`** (Node.js / discord.js). See the
root [README.md](../../README.md) for current commands and process
management details.

## Why this is here

Several legacy commands have not yet been rebuilt in JavaScript. This
archive is the reference implementation to consult when restoring them:

- `weekly`
- `crypto`
- `ticker`
- `movie`
- `book`
- `sacrifice`
- `handshake`
- `match`
- `deathmatch`

Two legacy features are intentionally **not** on that list:

- `gig` — retired. Do not migrate.
- `memo` — belongs to The Principal (a different bot), not Fred.

Reaction-role functionality (`cogs/reaction_roles.py`) will be **redesigned**
rather than directly ported — the old hardcoded implementation should not be
copied as-is. See the roadmap in the root README for the current thinking
(buttons/select menus, admin controls owned by The Principal).

## Contents

- `main.py` — bot entry point and cog loading
- `keep_alive.py` — legacy keepalive HTTP server (Replit-era)
- `utils.py` — shared helpers
- `cogs/ceelo.py` — Cee-lo game logic (already ported into `roll.js`)
- `cogs/finance.py` — `crypto` / `ticker` commands
- `cogs/fun.py` — `sacrifice`, `handshake`, `match`, `deathmatch`, and other social commands
- `cogs/media.py` — `movie` / `book` commands
- `cogs/reaction_roles.py` — old hardcoded reaction-role wiring
- `pyproject.toml`, `poetry.lock`, `pyproject.toml.backup` — Python dependency management

## Caveats before using this code

This code is preserved as-is and has **not** been modernized. Before running
or porting logic from it, assume:

- APIs it calls (Discord, third-party data sources) may have changed or been deprecated since this was last run.
- Dependencies pinned in `poetry.lock` are likely outdated and may have known vulnerabilities.
- It may contain hardcoded IDs (channels, roles, users) specific to the old deployment.
- It assumes a Replit-style always-on environment (see `keep_alive.py`) that no longer applies.
- Credentials or config it expects (env vars, config files) are not guaranteed to exist in the current environment.

Do not execute this code against production without a compatibility and
security review.
