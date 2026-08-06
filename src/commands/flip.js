module.exports = {
    name: 'flip',
    aliases: ['coin', 'coinflip'],
    execute(message, args, client) {
        const coinSides = ['heads', 'tails'];
        const result = coinSides[Math.floor(Math.random() * coinSides.length)];
        
        const mentionedUser = message.mentions.users.first();
        const prediction = args[0]?.toLowerCase();
        
        if (mentionedUser) {
            message.channel.send(`${mentionedUser}, the coin landed on ${result.charAt(0).toUpperCase() + result.slice(1)}!`);
        } else if (prediction && ['heads', 'tails'].includes(prediction)) {
            const isCorrect = prediction === result;
            if (isCorrect) {
                message.reply(`your prediction was correct! The coin landed on ${result.charAt(0).toUpperCase() + result.slice(1)}!`);
            } else {
                message.reply(`your prediction was incorrect. The coin landed on ${result.charAt(0).toUpperCase() + result.slice(1)}.`);
            }
        } else {
            message.channel.send(`${message.author}, the coin landed on ${result.charAt(0).toUpperCase() + result.slice(1)}!`);
        }
    }
};
