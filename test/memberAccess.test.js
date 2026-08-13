const test = require('node:test');
const assert = require('node:assert/strict');
const { canUseMemberCommand, ACCESS_DENIED_MESSAGE } = require('../src/utils/memberAccess');

function makeMember({ isAdmin = false, isVerified = false } = {}) {
    return {
        permissions: { has: () => isAdmin },
        roles: { cache: isVerified ? [{ name: 'VERIFIED' }] : [] }
    };
}

test('administrator is allowed', () => {
    assert.equal(canUseMemberCommand(makeMember({ isAdmin: true })), true);
});

test('member with the exact VERIFIED role is allowed', () => {
    assert.equal(canUseMemberCommand(makeMember({ isVerified: true })), true);
});

test('ordinary member is denied', () => {
    assert.equal(canUseMemberCommand(makeMember({})), false);
});

test('missing member is denied safely', () => {
    assert.equal(canUseMemberCommand(undefined), false);
    assert.equal(canUseMemberCommand(null), false);
});

test('member with a malformed roles/permissions shape is denied safely', () => {
    assert.equal(canUseMemberCommand({}), false);
    assert.equal(canUseMemberCommand({ permissions: { has: () => false } }), false);
    assert.equal(canUseMemberCommand({ roles: { cache: [] } }), false);
});

test('a role sharing a substring but not the exact VERIFIED name is denied', () => {
    const member = {
        permissions: { has: () => false },
        roles: { cache: [{ name: 'UNVERIFIED' }, { name: 'verified' }] }
    };
    assert.equal(canUseMemberCommand(member), false);
});

test('ACCESS_DENIED_MESSAGE is a non-empty, reusable denial string', () => {
    assert.equal(typeof ACCESS_DENIED_MESSAGE, 'string');
    assert.ok(ACCESS_DENIED_MESSAGE.length > 0);
});
