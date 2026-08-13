const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildCommandRegistry } = require('../src/utils/commandRegistry');

// balance/daily/weekly open a DB connection at require-time; point it at a
// disposable path before loading the real commands directory below. Left
// unremoved deliberately (see test/help.test.js) to avoid racing sqlite3's
// in-flight async CREATE TABLE callback against directory cleanup.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fred-commandregistry-test-'));
process.env.BOT_DB_PATH = path.join(tmpDir, 'test.db');

const COMMANDS_DIR = path.join(__dirname, '../src/commands');

function loadRealCommandModules() {
    return fs.readdirSync(COMMANDS_DIR)
        .filter(f => f.endsWith('.js'))
        .map(f => require(path.join(COMMANDS_DIR, f)));
}

function makeCommand(name, aliases = [], overrides = {}) {
    return { name, aliases, execute: async () => {}, ...overrides };
}

test('canonical -flip resolves to the flip command', () => {
    const commands = loadRealCommandModules();
    const registry = buildCommandRegistry(commands);
    const flip = commands.find(c => c.name === 'flip');

    assert.equal(registry.get('flip'), flip);
});

test('-coin resolves to the flip command', () => {
    const commands = loadRealCommandModules();
    const registry = buildCommandRegistry(commands);
    const flip = commands.find(c => c.name === 'flip');

    assert.equal(registry.get('coin'), flip);
});

test('-coinflip resolves to the flip command', () => {
    const commands = loadRealCommandModules();
    const registry = buildCommandRegistry(commands);
    const flip = commands.find(c => c.name === 'flip');

    assert.equal(registry.get('coinflip'), flip);
});

test('alias lookup is case-insensitive, matching canonical dispatch lookup', () => {
    const upper = makeCommand('shout', ['YELL']);
    const registry = buildCommandRegistry([upper]);

    // The real dispatcher lowercases the parsed command name before calling
    // registry.get(), so the registry only needs to expose lowercase keys —
    // but the alias was declared in uppercase, proving normalization happens
    // regardless of how a command author capitalized it.
    assert.equal(registry.get('yell'), upper);
    assert.equal(registry.get('SHOUT'.toLowerCase()), upper);
});

test('resolving via an alias or the canonical name yields the identical command object, so execute runs exactly once', async () => {
    let callCount = 0;
    const command = makeCommand('greet', ['hi', 'hello'], {
        execute: async () => { callCount += 1; }
    });
    const registry = buildCommandRegistry([command]);

    const viaAlias = registry.get('hi');
    const viaCanonical = registry.get('greet');
    assert.equal(viaAlias, viaCanonical);

    await viaAlias.execute();
    assert.equal(callCount, 1);
});

test('aliases do not create duplicate entries in the canonical (help-facing) command map', () => {
    const commands = loadRealCommandModules();

    // This mirrors exactly what src/index.js does to build client.commands,
    // the map help.js iterates over.
    const canonicalMap = new Map();
    for (const command of commands) {
        canonicalMap.set(command.name, command);
    }

    assert.equal(canonicalMap.size, commands.length);
    assert.equal([...canonicalMap.values()].filter(c => c.name === 'flip').length, 1);
});

test('duplicate alias declared by two different commands is detected and throws', () => {
    const a = makeCommand('alpha', ['shared']);
    const b = makeCommand('beta', ['shared']);

    assert.throws(() => buildCommandRegistry([a, b]), /collision/i);
});

test('an alias colliding with another command\'s canonical name is detected and throws', () => {
    const a = makeCommand('alpha', []);
    const b = makeCommand('beta', ['alpha']);

    assert.throws(() => buildCommandRegistry([a, b]), /collision/i);
});

test('two commands declaring the same canonical name is detected and throws (no silent override)', () => {
    const a = makeCommand('dup', []);
    const b = makeCommand('dup', []);

    assert.throws(() => buildCommandRegistry([a, b]), /collision/i);
});

test('commands with no aliases still resolve by canonical name only', () => {
    const commands = loadRealCommandModules();
    const registry = buildCommandRegistry(commands);
    const weekly = commands.find(c => c.name === 'weekly');

    assert.equal(registry.get('weekly'), weekly);
    assert.equal(weekly.aliases.length, 0);
});

test('the real command set loads into a registry without collisions', () => {
    const commands = loadRealCommandModules();
    assert.doesNotThrow(() => buildCommandRegistry(commands));
});

test('registering the same command object under multiple keys does not touch its execute function or metadata', () => {
    const commands = loadRealCommandModules();
    const registry = buildCommandRegistry(commands);
    const flipViaName = registry.get('flip');
    const flipViaAlias = registry.get('coin');

    assert.equal(typeof flipViaName.execute, 'function');
    assert.equal(flipViaName.execute, flipViaAlias.execute);
    assert.equal(flipViaName.access, 'public');
});
