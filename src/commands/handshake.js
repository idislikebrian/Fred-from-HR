const { EmbedBuilder } = require('discord.js');
const { canUseMemberCommand, ACCESS_DENIED_MESSAGE } = require('../utils/memberAccess');

// Carried over verbatim from the legacy Python `handshakes` list (legacy/python/utils.py).
// These are third-party Tenor/Giphy CDN links from the archived bot, not a new dependency.
const HANDSHAKE_GIFS = [
    'https://media.tenor.com/images/180cdc8c0939a00e3674e7eeaf9056a3/tenor.gif',
    'https://media.tenor.com/images/67e822adc41a34c44c66b998109cd92b/tenor.gif',
    'https://media1.tenor.com/images/44830011193e0398e7464ed9a86a3643/tenor.gif',
    'https://media.tenor.com/images/08469d2b5bfbe6cfbdea49dd40ae6a08/tenor.gif',
    'https://media.tenor.com/images/fc9526c4dc48bce72a0639b29711d59c/tenor.gif',
    'https://media0.giphy.com/media/l1IYhmLyuCfgPL16g/giphy.gif',
    'https://media1.tenor.com/images/99af662eae886bacc009163ba3150168/tenor.gif?itemid=3846347',
    'https://media1.tenor.com/images/73b5c90fc5d2400300292ea8027225c2/tenor.gif?itemid=3400269'
];

function buildHandshakeEmbed(author, target) {
    return new EmbedBuilder()
        .setTitle(' ')
        .setDescription(`${author} shook hands with ${target}`)
        .setImage(HANDSHAKE_GIFS[Math.floor(Math.random() * HANDSHAKE_GIFS.length)])
        .setColor(0xf449d3);
}

module.exports = {
    name: 'handshake',
    description: 'Shake hands with another member',
    async execute(message, args) {
        if (!message.guild || !message.member) return;

        if (!canUseMemberCommand(message.member)) {
            await message.channel.send(`${message.author}, ${ACCESS_DENIED_MESSAGE}`).catch(() => {});
            return;
        }

        const target = message.mentions.members?.first();
        if (!target) {
            await message.reply('You need to mention someone to shake hands with!').catch(() => {});
            return;
        }

        await message.channel.send({ embeds: [buildHandshakeEmbed(message.author, target)] });
        await message.delete().catch(() => {});
    },
    _internal: { buildHandshakeEmbed, HANDSHAKE_GIFS }
};
