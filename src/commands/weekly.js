const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getBalance, updateBalance, getLastClaim, updateLastClaim } = require('../database/db');

const VERIFIED_ROLE_NAME = 'VERIFIED';
const WEEKLY_REWARD = 10000;
const WEEKLY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // fixed 7-day window, matching the legacy Python command

function isAuthorized(member) {
    const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
    const isVerified = member.roles.cache.some(role => role.name === VERIFIED_ROLE_NAME);
    return isAdmin || isVerified;
}

// Stored claim timestamps are full ISO-8601 with a trailing "Z", so re-parsing with
// `new Date(...)` is unambiguously UTC regardless of the server's local timezone.
function getNextClaimTime(lastClaimIso) {
    if (!lastClaimIso) return null;
    return new Date(new Date(lastClaimIso).getTime() + WEEKLY_COOLDOWN_MS);
}

function isOnCooldown(lastClaimIso, now) {
    const nextClaimAt = getNextClaimTime(lastClaimIso);
    return nextClaimAt !== null && now.getTime() < nextClaimAt.getTime();
}

function formatDisplayTimestamp(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

function formatDuration(ms) {
    const totalMinutes = Math.max(0, Math.floor(ms / 60000));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes || parts.length === 0) parts.push(`${minutes}m`);
    return parts.join(' ');
}

function buildClaimedEmbed(newBalance, nextClaimAt) {
    return new EmbedBuilder()
        .setTitle('💰 Weekly Reward 💰')
        .setDescription('You have claimed your weekly reward!')
        .addFields(
            { name: 'Contains:', value: `🧧 ${WEEKLY_REWARD.toLocaleString('en-US')}`, inline: false },
            { name: 'New balance:', value: `🧧 ${newBalance.toLocaleString('en-US')}`, inline: false },
            { name: 'Available every:', value: '7 days', inline: false },
            { name: 'Next:', value: formatDisplayTimestamp(nextClaimAt), inline: false }
        )
        .setColor(0xf449d3);
}

function buildCooldownEmbed(nextClaimAt, now) {
    return new EmbedBuilder()
        .setTitle('💰 Weekly Reward 💰')
        .setDescription('You have already claimed your weekly reward!')
        .addFields(
            { name: 'Next:', value: formatDisplayTimestamp(nextClaimAt), inline: false },
            { name: 'Time remaining:', value: formatDuration(nextClaimAt.getTime() - now.getTime()), inline: false }
        )
        .setColor(0xf449d3);
}

module.exports = {
    name: 'weekly',
    description: 'Claim your weekly 10,000 🧧 reward',
    async execute(message, args) {
        if (!message.guild || !message.member) return;

        if (!isAuthorized(message.member)) {
            await message.channel.send(`${message.author}, you need to be verified to use this command.`).catch(() => {});
            return;
        }

        const userId = message.author.id;
        const lastClaim = await getLastClaim(userId, 'last_weekly_claim');
        const now = new Date();

        if (isOnCooldown(lastClaim, now)) {
            const nextClaimAt = getNextClaimTime(lastClaim);
            await message.channel.send({ embeds: [buildCooldownEmbed(nextClaimAt, now)] });
            return;
        }

        const balance = await getBalance(userId);
        const newBalance = balance + WEEKLY_REWARD;
        await updateBalance(userId, newBalance);
        await updateLastClaim(userId, 'last_weekly_claim', now.toISOString());

        const nextClaimAt = new Date(now.getTime() + WEEKLY_COOLDOWN_MS);
        await message.channel.send({ embeds: [buildClaimedEmbed(newBalance, nextClaimAt)] });
    },
    _internal: {
        isAuthorized,
        isOnCooldown,
        getNextClaimTime,
        formatDisplayTimestamp,
        formatDuration,
        buildClaimedEmbed,
        buildCooldownEmbed,
        WEEKLY_REWARD,
        WEEKLY_COOLDOWN_MS
    }
};
