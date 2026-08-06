const { EmbedBuilder } = require('discord.js');

const magicalAnswers = [
    "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
    "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
    "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
    "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
    "Don't count on it.", "My reply is no.", "My sources say no.",
    "Outlook not so good.", "Very doubtful."
];

module.exports = {
    name: 'magic8',
    async execute(message, args, client) {
        const inquiry = args.join(' ');
        
        if (!inquiry) {
            return message.reply('You need to ask a question!');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const answer = magicalAnswers[Math.floor(Math.random() * magicalAnswers.length)];
        
        const embed = new EmbedBuilder()
            .setTitle(':8ball: Magic 8 Ball')
            .setDescription(message.author.toString())
            .setColor(0xf449d3)
            .addFields(
                { name: `Q: ${inquiry}`, value: `A: ${answer}` }
            );
        
        message.channel.send({ embeds: [embed] });
    }
};
