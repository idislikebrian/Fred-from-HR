const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Point the database layer at a disposable temp file *before* requiring anything
// that touches it, so these tests never read or write production bot_data.db.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fred-weekly-test-'));
process.env.BOT_DB_PATH = path.join(tmpDir, 'test.db');

const { getBalance, getLastClaim, updateLastClaim } = require('../src/database/db');
const weekly = require('../src/commands/weekly.js');
const { _internal } = weekly;
const { isAuthorized, isOnCooldown, getNextClaimTime, formatDuration, WEEKLY_REWARD, WEEKLY_COOLDOWN_MS } = _internal;

test.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

let nextUserId = 1;
function freshUserId() {
    return `weekly-test-user-${nextUserId++}`;
}

function makeMember({ isAdmin = false, isVerified = false } = {}) {
    return {
        permissions: { has: () => isAdmin },
        roles: { cache: isVerified ? [{ name: 'VERIFIED' }] : [] }
    };
}

function makeMessage({ userId, isAdmin = false, isVerified = false }) {
    const sent = [];
    return {
        guild: {},
        member: makeMember({ isAdmin, isVerified }),
        author: { id: userId, toString: () => `<@${userId}>` },
        channel: { send: async (payload) => { sent.push(payload); return payload; } },
        sent
    };
}

function embedText(payload) {
    const data = payload.embeds[0].toJSON();
    return [data.description, ...(data.fields || []).map(f => `${f.name} ${f.value}`)].join(' ');
}

test('eligible verified user receives 10,000', async () => {
    const userId = freshUserId();
    const message = makeMessage({ userId, isVerified: true });
    await weekly.execute(message, []);

    assert.equal(await getBalance(userId), 10000);
    assert.ok(embedText(message.sent[0]).includes('10,000'));
});

test('administrator is allowed', async () => {
    const userId = freshUserId();
    const message = makeMessage({ userId, isAdmin: true });
    await weekly.execute(message, []);

    assert.equal(await getBalance(userId), 10000);
});

test('unverified non-admin user is denied', async () => {
    const userId = freshUserId();
    const message = makeMessage({ userId });
    await weekly.execute(message, []);

    assert.equal(message.sent.length, 1);
    assert.ok(!message.sent[0].embeds, 'denial should be a plain text reply, not the reward embed');
    assert.equal(await getBalance(userId), 0);
    assert.equal(await getLastClaim(userId, 'last_weekly_claim'), null);
});

test('denied user does not consume cooldown', async () => {
    const userId = freshUserId();
    const deniedMessage = makeMessage({ userId });
    await weekly.execute(deniedMessage, []);
    assert.equal(await getLastClaim(userId, 'last_weekly_claim'), null);

    const verifiedMessage = makeMessage({ userId, isVerified: true });
    await weekly.execute(verifiedMessage, []);
    assert.equal(await getBalance(userId), 10000, 'the earlier denial must not have started the cooldown');
});

test('user inside weekly cooldown cannot claim again', async () => {
    const userId = freshUserId();
    const message = makeMessage({ userId, isVerified: true });
    await weekly.execute(message, []);

    const secondMessage = makeMessage({ userId, isVerified: true });
    await weekly.execute(secondMessage, []);

    assert.ok(embedText(secondMessage.sent[0]).includes('already claimed'));
});

test('cooldown denial does not alter balance', async () => {
    const userId = freshUserId();
    const message = makeMessage({ userId, isVerified: true });
    await weekly.execute(message, []);
    const balanceAfterFirstClaim = await getBalance(userId);

    const secondMessage = makeMessage({ userId, isVerified: true });
    await weekly.execute(secondMessage, []);

    assert.equal(await getBalance(userId), balanceAfterFirstClaim);
});

test('user becomes eligible after the cooldown expires', async () => {
    const userId = freshUserId();
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await updateLastClaim(userId, 'last_weekly_claim', eightDaysAgo.toISOString());

    const message = makeMessage({ userId, isVerified: true });
    await weekly.execute(message, []);

    assert.equal(await getBalance(userId), 10000);
    assert.ok(embedText(message.sent[0]).includes('claimed your weekly reward!'));
});

test('existing balance is incremented rather than replaced', async () => {
    const userId = freshUserId();
    const { updateBalance } = require('../src/database/db');
    await updateBalance(userId, 500);

    const message = makeMessage({ userId, isVerified: true });
    await weekly.execute(message, []);

    assert.equal(await getBalance(userId), 10500);
});

test('weekly claim does not modify last_daily_claim', async () => {
    const userId = freshUserId();
    const dailyStamp = new Date().toISOString();
    await updateLastClaim(userId, 'last_daily_claim', dailyStamp);

    const message = makeMessage({ userId, isVerified: true });
    await weekly.execute(message, []);

    assert.equal(await getLastClaim(userId, 'last_daily_claim'), dailyStamp);
});

test('daily claim does not interfere with weekly eligibility', async () => {
    const userId = freshUserId();
    await updateLastClaim(userId, 'last_daily_claim', new Date().toISOString());

    const message = makeMessage({ userId, isVerified: true });
    await weekly.execute(message, []);

    assert.equal(await getBalance(userId), 10000);
});

test('isAuthorized: admin without VERIFIED role is authorized', () => {
    assert.equal(isAuthorized(makeMember({ isAdmin: true })), true);
});

test('isAuthorized: verified non-admin is authorized', () => {
    assert.equal(isAuthorized(makeMember({ isVerified: true })), true);
});

test('isAuthorized: neither admin nor verified is denied', () => {
    assert.equal(isAuthorized(makeMember({})), false);
});

test('isOnCooldown / getNextClaimTime use a fixed 7-day window', () => {
    const now = new Date('2026-08-12T00:00:00.000Z');
    const lastClaim = new Date('2026-08-06T00:00:00.000Z').toISOString(); // 6 days ago
    assert.equal(isOnCooldown(lastClaim, now), true);
    assert.equal(getNextClaimTime(lastClaim).toISOString(), '2026-08-13T00:00:00.000Z');

    const eligibleLastClaim = new Date('2026-08-04T00:00:00.000Z').toISOString(); // 8 days ago
    assert.equal(isOnCooldown(eligibleLastClaim, now), false);
    assert.equal(WEEKLY_COOLDOWN_MS, 7 * 24 * 60 * 60 * 1000);
});

test('isOnCooldown: no prior claim is always eligible', () => {
    assert.equal(isOnCooldown(null, new Date()), false);
    assert.equal(getNextClaimTime(null), null);
});

test('formatDuration renders a deterministic, human-readable span', () => {
    assert.equal(formatDuration(0), '0m');
    assert.equal(formatDuration(90 * 60 * 1000), '1h 30m');
    assert.equal(formatDuration((2 * 24 * 60 + 3) * 60 * 1000), '2d 3m');
});

test('WEEKLY_REWARD matches the historical Python amount', () => {
    assert.equal(WEEKLY_REWARD, 10000);
});
