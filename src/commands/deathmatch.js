const { EmbedBuilder } = require('discord.js');
const { canUseMemberCommand, ACCESS_DENIED_MESSAGE } = require('../utils/memberAccess');

// Carried over verbatim from the legacy Python `deathmatches` list
// (legacy/python/utils.py). Re-audited for the accidental adjacent-string
// concatenation bug found in `match`'s list — none present here: 5 distinct,
// well-formed entries, no duplicates.
const DEATHMATCH_CHALLENGES = [
    '`-coinflip`',
    'typeracer.com',
    '**One round** of <#814947576297160746>. (*Must be in that channel*)',
    '**Insults**',
    '`-roulette`'
];

function selectDeathmatchChallenge(challenges, randomFn = Math.random) {
    return challenges[Math.floor(randomFn() * challenges.length)];
}

function buildDeathmatchEmbed(challenger, challengee, challenge) {
    // Legacy never set a color on this embed (unlike sacrifice/handshake), so it
    // rendered with Discord's default neutral sidebar instead of Fred's usual pink.
    // Preserved here by simply not calling .setColor().
    return new EmbedBuilder()
        .setTitle(' ')
        .setDescription(`${challenger} has challenged ${challengee} to a deathmatch. The trial will be ${challenge}.`);
}

module.exports = {
    name: 'deathmatch',
    aliases: [],
    usage: '-deathmatch @user',
    description: 'Challenge another member to a deathmatch trial',
    access: 'member',
    async execute(message, args) {
        if (!message.guild || !message.member) return;

        if (!canUseMemberCommand(message.member)) {
            await message.channel.send(`${message.author}, ${ACCESS_DENIED_MESSAGE}`).catch(() => {});
            return;
        }

        const target = message.mentions.members?.first();
        if (!target) {
            await message.reply('You need to mention someone to challenge to a deathmatch!').catch(() => {});
            return;
        }

        const challenge = selectDeathmatchChallenge(DEATHMATCH_CHALLENGES);
        await message.channel.send({ embeds: [buildDeathmatchEmbed(message.author, target, challenge)] });
    },
    _internal: { selectDeathmatchChallenge, buildDeathmatchEmbed, DEATHMATCH_CHALLENGES }
};
