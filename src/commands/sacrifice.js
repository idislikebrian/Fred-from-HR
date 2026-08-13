const { EmbedBuilder } = require('discord.js');
const { canUseMemberCommand, ACCESS_DENIED_MESSAGE } = require('../utils/memberAccess');

// Carried over verbatim from the legacy Python `ceremonies` list (legacy/python/utils.py).
// Text only — the legacy command never attached an image/GIF for sacrifice.
const CEREMONIES = [
    'The Flying Spaghetti Monster',
    'the Illuminati',
    'a local school district',
    'a giant squid',
    'the devil',
    'get the iPhone X',
    'cure cancer',
    'Dictator Advaith'
];

function buildSacrificeEmbed(author, target) {
    const ceremony = CEREMONIES[Math.floor(Math.random() * CEREMONIES.length)];
    return new EmbedBuilder()
        .setTitle(' ')
        .setDescription(`${author} has sacrificed ${target} to ${ceremony}`)
        .setColor(0xf449d3);
}

module.exports = {
    name: 'sacrifice',
    aliases: [],
    usage: '-sacrifice @user',
    description: 'Sacrifice another member to a random cause',
    access: 'member',
    async execute(message, args) {
        if (!message.guild || !message.member) return;

        if (!canUseMemberCommand(message.member)) {
            await message.channel.send(`${message.author}, ${ACCESS_DENIED_MESSAGE}`).catch(() => {});
            return;
        }

        const target = message.mentions.members?.first();
        if (!target) {
            await message.reply('You need to mention someone to sacrifice!').catch(() => {});
            return;
        }

        await message.channel.send({ embeds: [buildSacrificeEmbed(message.author, target)] });
        await message.delete().catch(() => {});
    },
    _internal: { buildSacrificeEmbed, CEREMONIES }
};
