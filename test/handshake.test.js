const test = require('node:test');
const assert = require('node:assert/strict');
const handshake = require('../src/commands/handshake.js');
const { _internal } = handshake;
const { buildHandshakeEmbed, HANDSHAKE_GIFS } = _internal;
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

test('verified member can invoke handshake', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await handshake.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.ok(message.sent[0].embeds);
});

test('administrator can invoke handshake', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isAdmin: true, mentionedMember: target });

    await handshake.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.ok(message.sent[0].embeds);
});

test('unverified non-admin is denied and no embed is sent', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ mentionedMember: target });

    await handshake.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.equal(message.sent[0], `<@author>, ${ACCESS_DENIED_MESSAGE}`);
});

test('missing mention gets a useful reply instead of an embed', async () => {
    const message = makeMessage({ isVerified: true, mentionedMember: null });

    await handshake.execute(message, []);

    assert.equal(message.sent.length, 0);
    assert.equal(message.replies.length, 1);
    assert.match(message.replies[0], /mention someone/i);
});

test('valid target produces an embed with description, image, and color', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await handshake.execute(message, []);

    const embedData = message.sent[0].embeds[0].toJSON();
    assert.equal(embedData.description, '<@author> shook hands with <@target>');
    assert.ok(HANDSHAKE_GIFS.includes(embedData.image.url));
    assert.equal(embedData.color, 0xf449d3);
});

test('invoking message is deleted after a successful handshake', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await handshake.execute(message, []);

    assert.equal(message.deleted, true);
});

test('denied invocation does not delete the invoking message', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ mentionedMember: target });

    await handshake.execute(message, []);

    assert.equal(message.deleted, false);
});

test('malformed context (no mentions collection) does not throw', async () => {
    const message = makeMessage({ isVerified: true, membersCollection: 'missing' });

    await assert.doesNotReject(() => handshake.execute(message, []));
    assert.equal(message.replies.length, 1);
});

test('missing guild/member is a silent no-op, matching other member commands', async () => {
    const message = makeMessage({ isVerified: true, mentionedMember: { toString: () => '<@target>' } });
    message.guild = null;

    await assert.doesNotReject(() => handshake.execute(message, []));
    assert.equal(message.sent.length, 0);
    assert.equal(message.replies.length, 0);
});

test('buildHandshakeEmbed composes author/target text from any stringifiable input', () => {
    const embed = buildHandshakeEmbed('<@1>', '<@2>');
    const data = embed.toJSON();
    assert.equal(data.description, '<@1> shook hands with <@2>');
    assert.ok(HANDSHAKE_GIFS.includes(data.image.url));
});

test('HANDSHAKE_GIFS is a small non-empty list of URLs', () => {
    assert.ok(Array.isArray(HANDSHAKE_GIFS));
    assert.ok(HANDSHAKE_GIFS.length > 0);
    for (const url of HANDSHAKE_GIFS) {
        assert.match(url, /^https:\/\//);
    }
});
