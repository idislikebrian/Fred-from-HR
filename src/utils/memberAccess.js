const { PermissionsBitField } = require('discord.js');

// Fred's current member-facing gate. This is expected to be replaced once
// Workshop moves to Discord-native Rules Screening — keep this the single
// place that decision changes.
const VERIFIED_ROLE_NAME = 'VERIFIED';
const ACCESS_DENIED_MESSAGE = 'you need to be verified to use this command.';

function canUseMemberCommand(member) {
    if (!member || !member.permissions || !member.roles || !member.roles.cache) return false;

    const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
    const isVerified = member.roles.cache.some(role => role.name === VERIFIED_ROLE_NAME);
    return isAdmin || isVerified;
}

module.exports = { canUseMemberCommand, VERIFIED_ROLE_NAME, ACCESS_DENIED_MESSAGE };
