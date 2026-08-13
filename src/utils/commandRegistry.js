// Builds the name+alias -> command lookup table used by the message dispatcher
// in src/index.js. Kept separate from client.commands (which stays keyed by
// canonical name only, one entry per command, for -help's listing) so that
// registering aliases here can never cause a command to be listed twice.
function buildCommandRegistry(commands) {
    const registry = new Map();

    for (const command of commands) {
        registerKey(registry, command.name, command);
        for (const alias of command.aliases || []) {
            registerKey(registry, alias, command);
        }
    }

    return registry;
}

function registerKey(registry, key, command) {
    if (!key) return;
    const normalized = key.toLowerCase();

    if (registry.has(normalized)) {
        const existing = registry.get(normalized);
        throw new Error(
            `Command key collision: "${normalized}" is claimed by both "${existing.name}" and "${command.name}". ` +
            'Rename one of the conflicting command names/aliases before this can load.'
        );
    }

    registry.set(normalized, command);
}

module.exports = { buildCommandRegistry };
