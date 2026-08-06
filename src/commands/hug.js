const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'hug',
    async execute(message, args, client) {
        const mentionedUser = message.mentions.members.first();
        
        if (!mentionedUser) {
            return message.reply('You need to mention someone to hug!');
        }
        
        const embed = new EmbedBuilder()
            .setTitle(' ')
            .setDescription(`${message.author} hugged ${mentionedUser} ♥`)
            .setColor(0xf449d3);
        
        await message.channel.send({ embeds: [embed] });
        await message.delete().catch(() => {});
    }
};
