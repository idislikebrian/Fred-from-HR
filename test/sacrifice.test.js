const test = require('node:test');
const assert = require('node:assert/strict');
const sacrifice = require('../src/commands/sacrifice.js');
const { _internal } = sacrifice;
const { buildSacrificeEmbed, CEREMONIES } = _internal;
const { ACCESS_DENIED_MESSAGE } = require('../src/utils/memberAccess');

function makeMember({ isAdmin = false, isVerified = false } = {}) {
    return {
        permissions: { has: () => isAdmin },
        roles: { cache: isVerified ? [{ name: 'VERIFIED' }] : [] }
    };
}

function makeMessage({ isAdmin = false, isVerified = false, mentionedMember = null, membersCollection = 'default', deleteImpl } = {}) {
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
        delete: deleteImpl || (async () => { deleted = true; }),
        sent,
        replies,
        get deleted() { return deleted; }
    };
}

test('verified member can invoke sacrifice', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await sacrifice.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.ok(message.sent[0].embeds);
});

test('administrator can invoke sacrifice', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isAdmin: true, mentionedMember: target });

    await sacrifice.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.ok(message.sent[0].embeds);
});

test('unverified non-admin is denied and no embed is sent', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ mentionedMember: target });

    await sacrifice.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.equal(message.sent[0], `<@author>, ${ACCESS_DENIED_MESSAGE}`);
});

test('missing mention gets a useful reply instead of an embed', async () => {
    const message = makeMessage({ isVerified: true, mentionedMember: null });

    await sacrifice.execute(message, []);

    assert.equal(message.sent.length, 0);
    assert.equal(message.replies.length, 1);
    assert.match(message.replies[0], /mention someone/i);
});

test('valid target produces an embed with description and color, and no image', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await sacrifice.execute(message, []);

    const embedData = message.sent[0].embeds[0].toJSON();
    assert.match(embedData.description, /^<@author> has sacrificed <@target> to /);
    assert.equal(embedData.color, 0xf449d3);
    assert.equal(embedData.image, undefined, 'legacy sacrifice never attached an image/GIF');
});

test('invoking message is deleted after a successful sacrifice', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await sacrifice.execute(message, []);

    assert.equal(message.deleted, true);
});

test('denied invocation does not delete the invoking message', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ mentionedMember: target });

    await sacrifice.execute(message, []);

    assert.equal(message.deleted, false);
});

test('message deletion failure does not crash the command', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({
        isVerified: true,
        mentionedMember: target,
        deleteImpl: async () => { throw new Error('missing permissions'); }
    });

    await assert.doesNotReject(() => sacrifice.execute(message, []));
    assert.equal(message.sent.length, 1);
});

test('malformed context (no mentions collection) does not throw', async () => {
    const message = makeMessage({ isVerified: true, membersCollection: 'missing' });

    await assert.doesNotReject(() => sacrifice.execute(message, []));
    assert.equal(message.replies.length, 1);
});

test('missing guild/member is a silent no-op, matching other member commands', async () => {
    const message = makeMessage({ isVerified: true, mentionedMember: { toString: () => '<@target>' } });
    message.guild = null;

    await assert.doesNotReject(() => sacrifice.execute(message, []));
    assert.equal(message.sent.length, 0);
    assert.equal(message.replies.length, 0);
});

test('buildSacrificeEmbed always chooses a ceremony from the approved legacy list', () => {
    for (let i = 0; i < 50; i++) {
        const embed = buildSacrificeEmbed('<@1>', '<@2>');
        const data = embed.toJSON();
        assert.match(data.description, /^<@1> has sacrificed <@2> to /);
        const ceremony = data.description.replace('<@1> has sacrificed <@2> to ', '');
        assert.ok(CEREMONIES.includes(ceremony));
        assert.equal(data.image, undefined);
    }
});

test('CEREMONIES matches the legacy Python list exactly', () => {
    assert.deepEqual(CEREMONIES, [
        'The Flying Spaghetti Monster',
        'the Illuminati',
        'a local school district',
        'a giant squid',
        'the devil',
        'get the iPhone X',
        'cure cancer',
        'Dictator Advaith'
    ]);
});

test('sacrifice.js source has no reference to the database module', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '../src/commands/sacrifice.js'), 'utf8');
    assert.ok(!src.includes('database/db'), 'sacrifice must not touch economy/database state');
});
