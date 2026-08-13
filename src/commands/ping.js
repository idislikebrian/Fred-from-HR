module.exports = {
    name: 'ping',
    aliases: [],
    usage: '-ping',
    description: 'Basic connectivity check.',
    access: 'public',
    async execute(message, args) {
        await message.channel.send("To that, I say pong!");
    }
};
