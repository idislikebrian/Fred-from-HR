const { EmbedBuilder } = require('discord.js');

const activeGames = new Map();

function ceeLoOutcome(roll) {
    roll.sort((a, b) => a - b);
    if (roll[0] === roll[1] && roll[1] === roll[2]) {
        return ['Triple', roll[0]];
    } else if (roll[0] === 1 && roll[1] === 2 && roll[2] === 3) {
        return ['Automatic Loss', null];
    } else if (roll[0] === 4 && roll[1] === 5 && roll[2] === 6) {
        return ['Automatic Win', null];
    } else if (roll[0] === roll[1]) {
        return ['Point', roll[2]];
    } else if (roll[1] === roll[2]) {
        return ['Point', roll[0]];
    } else {
        return ['No Point', null];
    }
}

module.exports = {
    name: 'roll',
    async execute(message, args, client) {
        const allowedChannelId = '814947576297160746';
        
        if (message.channel.id !== allowedChannelId) {
            const embed = new EmbedBuilder()
                .setTitle('Cee-lo')
                .setDescription('Let\'s keep the game in the <#814947576297160746> channel :wink:')
                .setColor(0xf449d3);
            return message.channel.send({ embeds: [embed] });
        }
        
        const channelId = message.channel.id;
        
        if (activeGames.get(channelId)?.gameRunning) {
            const embed = new EmbedBuilder()
                .setTitle('Cee-lo')
                .setDescription('A game is already in progress.')
                .setColor(0xf449d3);
            return message.channel.send({ embeds: [embed] });
        }
        
        activeGames.set(channelId, { players: new Set(), gameRunning: true });
        
        const embed = new EmbedBuilder()
            .setTitle(`A game of Cee-lo hosted by ${message.author.username}`)
            .setDescription('A new Cee-lo game is about to start in 60 seconds, please react with 🎲 to participate in this round.')
            .setColor(0xf449d3);
        
        const gameMessage = await message.channel.send({ embeds: [embed] });
        await gameMessage.react('🎲');
        
        // Countdown
        setTimeout(async () => {
            const embed30 = new EmbedBuilder()
                .setTitle('Cee-lo')
                .setDescription(`Starting in 30 seconds! [React to this message](${gameMessage.url})`)
                .setColor(0xffa500);
            await message.channel.send({ embeds: [embed30] });
        }, 30000);
        
        setTimeout(async () => {
            const embed15 = new EmbedBuilder()
                .setTitle('Cee-lo')
                .setDescription(`Starting in 15 seconds! [React to this message](${gameMessage.url})`)
                .setColor(0xff0000);
            await message.channel.send({ embeds: [embed15] });
        }, 45000);
        
        setTimeout(async () => {
            // Fetch updated message and get reactions
            const updatedMessage = await message.channel.messages.fetch(gameMessage.id);
            const diceReaction = updatedMessage.reactions.cache.get('🎲');
            
            if (diceReaction) {
                const users = await diceReaction.users.fetch();
                const game = activeGames.get(channelId);
                users.forEach(user => {
                    if (!user.bot) {
                        game.players.add(user);
                    }
                });
            }
            
            const game = activeGames.get(channelId);
            
            if (game.players.size < 2) {
                const embed = new EmbedBuilder()
                    .setTitle('Cee-lo')
                    .setDescription(`No one wanted the smoke from ${message.author}. Chumps.`)
                    .setColor(0xf449d3);
                await message.channel.send({ embeds: [embed] });
                activeGames.set(channelId, { players: new Set(), gameRunning: false });
                return;
            }
            
            const playerMentions = Array.from(game.players).map(p => p.toString()).join(', ');
            const embed = new EmbedBuilder()
                .setTitle('Started a new game of Cee-lo')
                .setDescription(`Number of participants: ${game.players.size}`)
                .addFields({ name: 'Participants', value: playerMentions, inline: false })
                .setColor(0xf449d3);
            await message.channel.send({ embeds: [embed] });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            let winner = null;
            let maxRank = -1;
            
            for (const player of game.players) {
                let outcome = 'No Point';
                let roll, point;
                
                while (outcome === 'No Point') {
                    roll = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
                    [outcome, point] = ceeLoOutcome(roll);
                }
                
                const rollEmbed = new EmbedBuilder()
                    .setTitle('Cee-lo')
                    .setDescription(`${player} rolled:`)
                    .addFields({ name: '🎲', value: `${roll[0]}, ${roll[1]}, ${roll[2]} (${outcome})`, inline: false })
                    .setColor(0xf449d3);
                await message.channel.send({ embeds: [rollEmbed] });
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                if (outcome === 'Automatic Win') {
                    winner = player;
                    break;
                }
                
                let rank = 0;
                if (outcome === 'Triple') {
                    rank = 10 + point;
                } else if (outcome === 'Point') {
                    rank = point;
                }
                
                if (rank > maxRank) {
                    maxRank = rank;
                    winner = player;
                }
            }
            
            if (maxRank === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('Cee-lo')
                    .setDescription('All players rolled an Automatic Loss. There is no winner.')
                    .setColor(0xf449d3);
                await message.channel.send({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('Cee-lo')
                    .setDescription(`🎉 ${winner} wins the game with ${maxRank} points! 🎉`)
                    .setColor(0xffff00);
                await message.channel.send({ embeds: [embed] });
            }
            
            activeGames.set(channelId, { players: new Set(), gameRunning: false });
        }, 60000);
    }
};
