# Legacy Replit configuration (archived)

Fred was previously developed and deployed through [Replit](https://replit.com).
These files are **historical only** and describe an environment that is no
longer in use.

Current production does **not** use Replit. The runtime is Node.js,
started from `src/index.js` and supervised by PM2 on the deployment host.
See the root [README.md](../../README.md) for current process management
details.

## Contents

- `.replit` — Replit's run/deploy/workflow configuration. Notably, by the
  time this was archived it already showed the migration in progress: the
  `run`/`entrypoint`/`[deployment]` keys still pointed at Python's
  `main.py`, while the actual `[[workflows.workflow]]` entry Replit was
  using to start the bot had been switched to `node src/index.js`.
- `replit.md` — a project overview written during the Python-to-JavaScript
  migration. Useful for historical context on design decisions, but treat
  any statement about "current" architecture as a snapshot of that period,
  not of today.
- `replit.nix` — the Nix package environment Replit built for the Python
  side of the bot (Python 3.8 plus native libs for pandas/numpy/pygame/
  matplotlib). Not relevant to the current Node.js-only runtime.

## Do not treat these as active configuration

Do not use these files to infer current ports, entry points, environment
variables, or deployment steps. They predate the current PM2-based
deployment and the retirement of Replit hosting entirely.
