const { EmbedBuilder } = require('discord.js');

const rouletteGIFs = [
    "https://media1.tenor.com/images/69be09d0b37d5c4541bb2a01805ffabc/tenor.gif",
    "https://media.tenor.com/5q1PVGJLpQAAAAAd/russian-roulette.gif"
];

module.exports = {
    name: 'roulette',
    aliases: [],
    usage: '-roulette',
    description: 'Play a roulette-style chance game.',
    access: 'public',
    async execute(message, args, client) {
        const loadingEmbed = new EmbedBuilder()
            .setTitle(' ')
            .setDescription('Loading...')
            .setImage('https://media1.tenor.com/images/69be09d0b37d5c4541bb2a01805ffabc/tenor.gif');
        
        const loadingMsg = await message.channel.send({ embeds: [loadingEmbed] });
        
        const visual = rouletteGIFs[Math.floor(Math.random() * rouletteGIFs.length)];
        const choice = Math.floor(Math.random() * 6) + 1; // 1-6
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (choice > 1) {
            // Survived
            const embed = new EmbedBuilder()
                .setTitle(' ')
                .setDescription(`😰 ${message.author}, you survived... This time.`)
                .setColor(0xf449d3);
            await message.channel.send({ embeds: [embed] });
        } else {
            // Died
            await message.channel.send(visual);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const embed = new EmbedBuilder()
                .setTitle(' ')
                .setDescription(`**BANG!** ⚰ ${message.author} died. RIP.`)
                .setColor(0xff0000);
            await message.channel.send({ embeds: [embed] });
        }
    }
};
