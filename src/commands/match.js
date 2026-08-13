const { canUseMemberCommand, ACCESS_DENIED_MESSAGE } = require('../utils/memberAccess');

// Carried over from the legacy Python `matches` list (legacy/python/utils.py), with one
// fix: the legacy list had "100%. True love!" "69%. LOL best love!" as adjacent string
// literals with no comma between them, which Python silently concatenates into a single
// list entry ("100%. True love!69%. LOL best love!"). That was an accidental authoring
// bug, not an intended double-length result — restored here as the two separate results
// the surrounding "X%. text" pattern clearly intends.
const MATCH_RESULTS = [
    "10%. Your love isn't much.",
    '20%. Getting better!',
    '30%. A third of the way to true love.',
    '40%. Your love is getting great!',
    '50%. Halfway love!',
    '65%. I ship it!',
    '85%. The ship is sailing!',
    '100%. True love!',
    '69%. LOL best love!',
    '200%. You two should be married!'
];

function selectMatchResult(results, randomFn = Math.random) {
    return results[Math.floor(randomFn() * results.length)];
}

function buildMatchMessage(author, target, result) {
    return `The love between ${author} and ${target} is ${result} Keep expressing your love to each other, and that could change!`;
}

module.exports = {
    name: 'match',
    description: "Gauge the love between you and another member",
    async execute(message, args) {
        if (!message.guild || !message.member) return;

        if (!canUseMemberCommand(message.member)) {
            await message.channel.send(`${message.author}, ${ACCESS_DENIED_MESSAGE}`).catch(() => {});
            return;
        }

        const target = message.mentions.members?.first();
        if (!target) {
            await message.reply('You need to mention someone to check your love meter with!').catch(() => {});
            return;
        }

        const result = selectMatchResult(MATCH_RESULTS);
        await message.channel.send(buildMatchMessage(message.author, target, result));
    },
    _internal: { selectMatchResult, buildMatchMessage, MATCH_RESULTS }
};
