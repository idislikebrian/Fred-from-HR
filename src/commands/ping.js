module.exports = {
    name: 'ping',
    description: 'Ping command',
    async execute(message, args) {
        await message.channel.send("To that, I say pong!");
    }
};
