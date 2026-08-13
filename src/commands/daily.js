const { EmbedBuilder } = require('discord.js');
const { getBalance, updateBalance, getLastClaim, updateLastClaim } = require('../database/db');

module.exports = {
    name: 'daily',
    aliases: [],
    usage: '-daily',
    description: 'Claim the daily reward.',
    access: 'public',
    async execute(message, args) {
        const userId = message.author.id;
        const lastClaim = await getLastClaim(userId, 'last_daily_claim');
        const now = new Date();

        if (lastClaim && new Date(lastClaim).getTime() + 86400000 > now.getTime()) {
            const nextClaim = new Date(new Date(lastClaim).getTime() + 86400000);
            const embed = new EmbedBuilder()
                .setTitle("💵 Daily Reward 💵")
                .setDescription("You have already claimed your daily reward!")
                .addFields({ name: "Next:", value: nextClaim.toISOString().replace('T', ' ').substring(0, 19), inline: false })
                .setColor(0xf449d3);
            return message.channel.send({ embeds: [embed] });
        }

        const balance = await getBalance(userId);
        await updateBalance(userId, balance + 1000);
        await updateLastClaim(userId, 'last_daily_claim', now.toISOString().replace('T', ' ').substring(0, 19));

        const nextClaim = new Date(now.getTime() + 86400000);
        const embed = new EmbedBuilder()
            .setTitle("💵 Daily Reward 💵")
            .setDescription("You have claimed your daily reward!")
            .addFields(
                { name: "Contains:", value: "🧧 1,000", inline: false },
                { name: "Available every:", value: "24 hours", inline: false },
                { name: "Next:", value: nextClaim.toISOString().replace('T', ' ').substring(0, 19), inline: false }
            )
            .setColor(0xf449d3);
        await message.channel.send({ embeds: [embed] });
    }
};
