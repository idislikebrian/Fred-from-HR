require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, ActivityType, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { buildCommandRegistry } = require('./utils/commandRegistry');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
const prefix = '-';

// Express keep-alive
const app = express();
app.get('/', (req, res) => res.send('Fred from HR is clocked in!'));
app.listen(5000, () => console.log('Keep-alive server running on port 5000'));

// Command Handler
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
const loadedCommands = commandFiles.map(file => require(`./commands/${file}`));
for (const command of loadedCommands) {
    client.commands.set(command.name, command);
}

// Separate name+alias -> command lookup for dispatch. client.commands above stays
// canonical-name-only so -help continues listing each command exactly once.
const commandRegistry = buildCommandRegistry(loadedCommands);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        activities: [{ name: 'with fire | -help | last update: 2026/02/19', type: ActivityType.Playing }],
        status: 'online'
    });
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commandRegistry.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
});

// Event Handler (simplified for basic events)
client.on('guildMemberAdd', async member => {
    console.log(`${member.user.tag} has joined the server.`);
    setTimeout(async () => {
        try {
            await member.send(`**Welcome to WORKSHOP!** I'm Fred... From HR. Here are some housekeeping items to get started:\n 
\n 1. Don't forget to send a \`-verify {@your-username}\` message in the <#758754067173343254> channel to access the rest of ther server! (this is a spam-prevention measure)
\n 2. Introduce yourself over in <#708440927596970014>.
\n 3. Visit <#746753317140561980> to get your notified for the right things.
\n 4. We've made a <#762788672080052234> so you can get a lay of the land as well.
\n \n See <#708439507309035623> for community guidelines. Long version here: https://www.notion.so/Welcome-to-Ws-READ-ME-721abbdd2f274e2da46a4308b2b6d9e8
\n Finally, to see what kind of cool things I can do, check me out here https://headwayapp.co/fred-from-hr-news/what-can-fred-from-hr-do-172725
\n If you need help or have any questions, please DM a Facilitator.`);
        } catch (e) {
            console.error(`Could not send welcome DM to ${member.user.tag}`);
        }
    }, 60000);
});

client.login(process.env.TOKEN);
