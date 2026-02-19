const { EmbedBuilder } = require('discord.js');
const { getBalance } = require('../database/db');

module.exports = {
    name: 'balance',
    description: 'Check your balance',
    async execute(message, args) {
        const userId = message.author.id;
        const balance = await getBalance(userId);

        const embed = new EmbedBuilder()
            .setTitle("💳 Balance 💳")
            .setDescription(`${message.author}, your current balance is:`)
            .addFields({ name: "Amount:", value: `${balance}`, inline: false })
            .setColor(0xf449d3);

        await message.channel.send({ embeds: [embed] });
    }
};
