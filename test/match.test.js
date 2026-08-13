const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const match = require('../src/commands/match.js');
const { _internal } = match;
const { selectMatchResult, buildMatchMessage, MATCH_RESULTS } = _internal;
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

test('verified member can invoke match', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await match.execute(message, []);

    assert.equal(message.sent.length, 1);
});

test('administrator can invoke match', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isAdmin: true, mentionedMember: target });

    await match.execute(message, []);

    assert.equal(message.sent.length, 1);
});

test('unverified non-admin is denied', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ mentionedMember: target });

    await match.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.equal(message.sent[0], `<@author>, ${ACCESS_DENIED_MESSAGE}`);
});

test('missing mention gets a useful reply instead of a match result', async () => {
    const message = makeMessage({ isVerified: true, mentionedMember: null });

    await match.execute(message, []);

    assert.equal(message.sent.length, 0);
    assert.equal(message.replies.length, 1);
    assert.match(message.replies[0], /mention someone/i);
});

test('valid target produces a plain-text message, not an embed', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await match.execute(message, []);

    assert.equal(typeof message.sent[0], 'string');
    assert.match(message.sent[0], /^The love between <@author> and <@target> is /);
    assert.match(message.sent[0], /Keep expressing your love to each other, and that could change!$/);
});

test('match does not delete the invoking message (legacy never did)', async () => {
    const target = { toString: () => '<@target>' };
    const message = makeMessage({ isVerified: true, mentionedMember: target });

    await match.execute(message, []);

    assert.equal(message.deleted, false);
});

test('malformed context (no mentions collection) does not throw', async () => {
    const message = makeMessage({ isVerified: true, membersCollection: 'missing' });

    await assert.doesNotReject(() => match.execute(message, []));
    assert.equal(message.replies.length, 1);
});

test('missing guild/member is a silent no-op, matching other member commands', async () => {
    const message = makeMessage({ isVerified: true, mentionedMember: { toString: () => '<@target>' } });
    message.guild = null;

    await assert.doesNotReject(() => match.execute(message, []));
    assert.equal(message.sent.length, 0);
    assert.equal(message.replies.length, 0);
});

test('self-target is allowed, matching legacy behavior', async () => {
    const author = { toString: () => '<@author>' };
    const message = makeMessage({ isVerified: true, mentionedMember: author });
    message.author = author;

    await match.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.match(message.sent[0], /^The love between <@author> and <@author> is /);
});

test('selectMatchResult only ever returns a value from the approved pool', () => {
    for (let i = 0; i < 200; i++) {
        const result = selectMatchResult(MATCH_RESULTS);
        assert.ok(MATCH_RESULTS.includes(result));
        assert.notEqual(result, undefined);
    }
});

test('selectMatchResult with injected randomness deterministically selects each index', () => {
    MATCH_RESULTS.forEach((expected, index) => {
        const randomFn = () => index / MATCH_RESULTS.length;
        assert.equal(selectMatchResult(MATCH_RESULTS, randomFn), expected);
    });
});

test('"100%. True love!" exists as its own distinct result', () => {
    assert.ok(MATCH_RESULTS.includes('100%. True love!'));
});

test('"69%. LOL best love!" exists as its own distinct result', () => {
    assert.ok(MATCH_RESULTS.includes('69%. LOL best love!'));
});

test('the legacy accidental concatenation bug does not exist in the restored pool', () => {
    assert.ok(!MATCH_RESULTS.includes('100%. True love!69%. LOL best love!'));
    assert.equal(MATCH_RESULTS.length, 10, 'legacy had 9 raw entries; splitting the bug yields 10 distinct results');
});

test('buildMatchMessage composes author/target/result text deterministically', () => {
    const text = buildMatchMessage('<@1>', '<@2>', '50%. Halfway love!');
    assert.equal(
        text,
        'The love between <@1> and <@2> is 50%. Halfway love! Keep expressing your love to each other, and that could change!'
    );
});

test('match.js source has no reference to the database module', () => {
    const src = fs.readFileSync(path.join(__dirname, '../src/commands/match.js'), 'utf8');
    assert.ok(!src.includes('database/db'), 'match must not touch economy/database state');
});
