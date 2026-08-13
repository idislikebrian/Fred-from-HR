const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const deathmatch = require('../src/commands/deathmatch.js');
const { _internal } = deathmatch;
const { selectDeathmatchChallenge, buildDeathmatchEmbed, DEATHMATCH_CHALLENGES } = _internal;
const { ACCESS_DENIED_MESSAGE } = require('../src/utils/memberAccess');

function makeMember({ isAdmin = false, isVerified = false } = {}) {
    return {
        permissions: { has: () => isAdmin },
        roles: { cache: isVerified ? [{ name: 'VERIFIED' }] : [] }
    };
}

function makeMessage({ isAdmin = false, isVerified = false, mentionedMember = null, membersCollection = 'default' } = {}) {
    const sent = [];
    const replies = [];
    let deleted = false;

    const members = membersCollection === 'missing'
        ? undefined
        : { first: () => mentionedMember };

    return {
        guild: {},
        member: makeMember({ isAdmin, isVerified }),
        author: { toString: () => '<@author>' },
        mentions: { members },
        channel: { send: async (payload) => { sent.push(payload); return payload; } },
        reply: async (payload) => { replies.push(payload); return payload; },
        delete: async () => { deleted = true; },
        sent,
        replies,
        get deleted() { return deleted; }
    };
}

test('verified member can invoke deathmatch', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await deathmatch.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.ok(message.sent[0].embeds);
});

test('administrator can invoke deathmatch', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isAdmin: true, mentionedMember: target });

    await deathmatch.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.ok(message.sent[0].embeds);
});

test('unverified non-admin is denied', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ mentionedMember: target });

    await deathmatch.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.equal(message.sent[0], `<@author>, ${ACCESS_DENIED_MESSAGE}`);
});

test('missing mention gets a useful reply instead of an embed', async () => {
    const message = makeMessage({ isVerified: true, mentionedMember: null });

    await deathmatch.execute(message, []);

    assert.equal(message.sent.length, 0);
    assert.equal(message.replies.length, 1);
    assert.match(message.replies[0], /mention someone/i);
});

test('valid target produces an embed with blank title and the expected description', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await deathmatch.execute(message, []);

    const embedData = message.sent[0].embeds[0].toJSON();
    assert.equal(embedData.title, ' ');
    assert.match(embedData.description, /^<@author> has challenged <@target> to a deathmatch\. The trial will be .+\.$/);
});

test('embed color is omitted, matching legacy behavior (unlike sacrifice/handshake)', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await deathmatch.execute(message, []);

    const embedData = message.sent[0].embeds[0].toJSON();
    assert.equal(embedData.color, undefined);
});

test('deathmatch does not delete the invoking message (legacy never did)', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await deathmatch.execute(message, []);

    assert.equal(message.deleted, false);
});

test('malformed context (no mentions collection) does not throw', async () => {
    const message = makeMessage({ isVerified: true, membersCollection: 'missing' });

    await assert.doesNotReject(() => deathmatch.execute(message, []));
    assert.equal(message.replies.length, 1);
});

test('missing guild/member is a silent no-op, matching other member commands', async () => {
    const message = makeMessage({ isVerified: true, mentionedMember: { toString: () => '<@target>' } });
    message.guild = null;

    await assert.doesNotReject(() => deathmatch.execute(message, []));
    assert.equal(message.sent.length, 0);
    assert.equal(message.replies.length, 0);
});

test('self-target is allowed, matching legacy behavior', async () => {
    const author = { toString: () => '<@author>' };
    const message = makeMessage({ isVerified: true, mentionedMember: author });
    message.author = author;

    await deathmatch.execute(message, []);

    assert.equal(message.sent.length, 1);
    const embedData = message.sent[0].embeds[0].toJSON();
    assert.match(embedData.description, /^<@author> has challenged <@author> to a deathmatch\./);
});

test('bot-target is allowed, matching legacy behavior (bots are valid guild members)', async () => {
    const botTarget = { toString: () => '<@bot-target>', bot: true };
    const message = makeMessage({ isVerified: true, mentionedMember: botTarget });

    await deathmatch.execute(message, []);

    assert.equal(message.sent.length, 1);
    const embedData = message.sent[0].embeds[0].toJSON();
    assert.match(embedData.description, /^<@author> has challenged <@bot-target> to a deathmatch\./);
});

test('selectDeathmatchChallenge only ever returns a value from the approved pool', () => {
    for (let i = 0; i < 200; i++) {
        const result = selectDeathmatchChallenge(DEATHMATCH_CHALLENGES);
        assert.ok(DEATHMATCH_CHALLENGES.includes(result));
        assert.notEqual(result, undefined);
    }
});

test('selectDeathmatchChallenge with injected randomness deterministically selects each index, including boundary values', () => {
    DEATHMATCH_CHALLENGES.forEach((expected, index) => {
        const randomFn = () => index / DEATHMATCH_CHALLENGES.length;
        assert.equal(selectDeathmatchChallenge(DEATHMATCH_CHALLENGES, randomFn), expected);
    });

    // randomFn() === 0 (lower boundary) must select the first entry, never undefined.
    assert.equal(selectDeathmatchChallenge(DEATHMATCH_CHALLENGES, () => 0), DEATHMATCH_CHALLENGES[0]);
    // randomFn() just under 1 (upper boundary) must select the last entry, never overflow.
    assert.equal(
        selectDeathmatchChallenge(DEATHMATCH_CHALLENGES, () => 0.999999),
        DEATHMATCH_CHALLENGES[DEATHMATCH_CHALLENGES.length - 1]
    );
});

test('DEATHMATCH_CHALLENGES matches the legacy Python list exactly, with no concatenation or duplication bugs', () => {
    assert.deepEqual(DEATHMATCH_CHALLENGES, [
        '`-coinflip`',
        'typeracer.com',
        '**One round** of <#814947576297160746>. (*Must be in that channel*)',
        '**Insults**',
        '`-roulette`'
    ]);
    assert.equal(new Set(DEATHMATCH_CHALLENGES).size, DEATHMATCH_CHALLENGES.length, 'no duplicate entries');
});

test('buildDeathmatchEmbed composes challenger/challengee/challenge text deterministically, with no color set', () => {
    const embed = buildDeathmatchEmbed('<@1>', '<@2>', '**Insults**');
    const data = embed.toJSON();
    assert.equal(data.title, ' ');
    assert.equal(data.description, '<@1> has challenged <@2> to a deathmatch. The trial will be **Insults**.');
    assert.equal(data.color, undefined);
});

test('command metadata is correct', () => {
    assert.equal(deathmatch.name, 'deathmatch');
    assert.deepEqual(deathmatch.aliases, []);
    assert.equal(deathmatch.usage, '-deathmatch @user');
    assert.equal(typeof deathmatch.description, 'string');
    assert.ok(deathmatch.description.length > 0);
    assert.equal(deathmatch.access, 'member');
});

test('deathmatch.js source has no reference to the database module', () => {
    const src = fs.readFileSync(path.join(__dirname, '../src/commands/deathmatch.js'), 'utf8');
    assert.ok(!src.includes('database/db'), 'deathmatch must not touch economy/database state');
});
