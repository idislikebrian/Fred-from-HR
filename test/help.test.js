const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Some command modules (balance/daily/weekly) require the database layer, which
// opens a connection and issues an async CREATE TABLE at require-time. Point it at
// a disposable temp file *before* loading the commands directory, so this suite
// never touches bot_data.db. Unlike weekly.test.js, nothing here actually performs
// a DB operation to force that connection to finish initializing, so — to avoid
// racing sqlite3's in-flight callback with directory removal — this file is
// deliberately left for the OS to reclaim rather than rm'd in a test.after().
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fred-help-test-'));
process.env.BOT_DB_PATH = path.join(tmpDir, 'test.db');

const help = require('../src/commands/help.js');
const { _internal } = help;
const { buildCommandListEmbed, buildCommandDetailEmbed, resolveCommand } = _internal;

const COMMANDS_DIR = path.join(__dirname, '../src/commands');

function loadRealCommands() {
    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js'));
    const map = new Map();
    for (const file of files) {
        const command = require(path.join(COMMANDS_DIR, file));
        map.set(command.name, command);
    }
    return map;
}

function makeMessage() {
    const sent = [];
    return {
        channel: { send: async (payload) => { sent.push(payload); return payload; } },
        sent
    };
}

test('command loader discovers all active commands, including help itself', () => {
    const commandsMap = loadRealCommands();
    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js'));

    assert.equal(commandsMap.size, files.length, 'expected one unique command name per file (no duplicate names)');
    assert.ok(commandsMap.has('help'));
    assert.ok(commandsMap.has('weekly'));
    assert.ok(commandsMap.has('match'));
});

test('archived Python-only commands are not discovered or listed', () => {
    const commandsMap = loadRealCommands();
    for (const legacyOnly of ['gig', 'book', 'movie', 'crypto', 'ticker', 'memo']) {
        assert.equal(commandsMap.has(legacyOnly), false, `${legacyOnly} has no JS implementation and must not appear`);
    }
});

test('no two commands declare the same alias, and no alias collides with a real command name', () => {
    const commandsMap = loadRealCommands();
    const seenAliases = new Map();
    for (const command of commandsMap.values()) {
        for (const alias of command.aliases || []) {
            assert.ok(
                !commandsMap.has(alias) || commandsMap.get(alias) === command,
                `alias "${alias}" collides with an existing command name`
            );
            assert.ok(
                !seenAliases.has(alias),
                `alias "${alias}" is declared by both ${seenAliases.get(alias)} and ${command.name}`
            );
            seenAliases.set(alias, command.name);
        }
    }
});

test('-help lists every loaded command exactly once', async () => {
    const commandsMap = loadRealCommands();
    const commands = [...commandsMap.values()];
    const client = { commands: commandsMap };
    const message = makeMessage();

    await help.execute(message, [], client);

    assert.equal(message.sent.length, 1);
    const embed = message.sent[0].embeds[0].toJSON();
    const allLines = embed.fields.flatMap(f => f.value.split('\n'));

    assert.equal(allLines.length, commands.length);
    for (const command of commands) {
        const usage = command.usage || `-${command.name}`;
        const matchingLines = allLines.filter(line => line.includes(`\`${usage}\``));
        assert.equal(matchingLines.length, 1, `expected exactly one directory line for ${command.name}`);
    }
});

test('directory note mentions that some commands require member access', async () => {
    const commandsMap = loadRealCommands();
    const client = { commands: commandsMap };
    const message = makeMessage();

    await help.execute(message, [], client);

    const embed = message.sent[0].embeds[0].toJSON();
    const memberField = embed.fields.find(f => f.name.startsWith('Member'));
    assert.ok(memberField, 'expected a Member group field');
    assert.match(memberField.name, /VERIFIED/);
});

test('-help weekly returns weekly command details', async () => {
    const commandsMap = loadRealCommands();
    const client = { commands: commandsMap };
    const message = makeMessage();

    await help.execute(message, ['weekly'], client);

    const embed = message.sent[0].embeds[0].toJSON();
    assert.equal(embed.title, '🆘 -weekly');
    assert.match(embed.description, /weekly/i);
    assert.equal(embed.fields.find(f => f.name === 'Usage').value, '`-weekly`');
    assert.match(embed.fields.find(f => f.name === 'Access').value, /VERIFIED/);
});

test('-help art returns art command details', async () => {
    const commandsMap = loadRealCommands();
    const client = { commands: commandsMap };
    const message = makeMessage();

    await help.execute(message, ['art'], client);

    const embed = message.sent[0].embeds[0].toJSON();
    assert.equal(embed.title, '🆘 -art');
    assert.equal(embed.fields.find(f => f.name === 'Usage').value, '`-art [search terms]`');
});

test('alias lookup resolves -help coin to the flip command', async () => {
    const commandsMap = loadRealCommands();
    const client = { commands: commandsMap };
    const message = makeMessage();

    await help.execute(message, ['coin'], client);

    const embed = message.sent[0].embeds[0].toJSON();
    assert.equal(embed.title, '🆘 -flip');
});

test('alias lookup is case-insensitive', async () => {
    const commandsMap = loadRealCommands();
    const client = { commands: commandsMap };
    const message = makeMessage();

    await help.execute(message, ['COINFLIP'], client);

    const embed = message.sent[0].embeds[0].toJSON();
    assert.equal(embed.title, '🆘 -flip');
});

test('unknown command returns a friendly message instead of crashing', async () => {
    const commandsMap = loadRealCommands();
    const client = { commands: commandsMap };
    const message = makeMessage();

    await assert.doesNotReject(() => help.execute(message, ['definitelynotacommand'], client));

    assert.equal(message.sent.length, 1);
    assert.equal(typeof message.sent[0], 'string');
    assert.match(message.sent[0], /don't know a command/i);
});

test('malformed context (missing client/commands) does not throw and is a silent no-op', async () => {
    const message = makeMessage();

    await assert.doesNotReject(() => help.execute(message, [], {}));
    await assert.doesNotReject(() => help.execute(message, [], null));
    await assert.doesNotReject(() => help.execute(message, [], undefined));

    assert.equal(message.sent.length, 0);
});

test('help output stays within Discord embed limits', () => {
    const commandsMap = loadRealCommands();
    const commands = [...commandsMap.values()];

    const listEmbed = buildCommandListEmbed(commands).toJSON();
    assert.ok(listEmbed.title.length <= 256);
    assert.ok((listEmbed.description || '').length <= 4096);
    assert.ok(listEmbed.fields.length <= 25);
    for (const field of listEmbed.fields) {
        assert.ok(field.name.length <= 256, `field name too long: ${field.name}`);
        assert.ok(field.value.length <= 1024, `field value too long (${field.value.length}) for ${field.name}`);
    }

    for (const command of commands) {
        const detailEmbed = buildCommandDetailEmbed(command).toJSON();
        assert.ok((detailEmbed.description || '').length <= 4096);
        for (const field of detailEmbed.fields) {
            assert.ok(field.value.length <= 1024);
        }
    }
});

test('metadata additions did not remove permission gating from member-access commands', () => {
    for (const name of ['art', 'weekly', 'handshake', 'sacrifice', 'match']) {
        const src = fs.readFileSync(path.join(COMMANDS_DIR, `${name}.js`), 'utf8');
        assert.ok(src.includes('canUseMemberCommand'), `${name} must still call canUseMemberCommand`);
    }
});

test('help.js source has no reference to the database module', () => {
    const src = fs.readFileSync(path.join(COMMANDS_DIR, 'help.js'), 'utf8');
    assert.ok(!src.includes('database/db'), 'help must not touch economy/database state');
});

test('resolveCommand returns null for empty or missing query', () => {
    const commandsMap = loadRealCommands();
    const commands = [...commandsMap.values()];
    assert.equal(resolveCommand(commands, ''), null);
    assert.equal(resolveCommand(commands, undefined), null);
});
