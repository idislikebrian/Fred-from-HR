const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'verify',
    description: 'Verify a member',
    async execute(message, args) {
        const member = message.mentions.members.first();
        if (!member) {
            const embed = new EmbedBuilder()
                .setTitle("🆘 Need help?")
                .setDescription("Make sure you're including your own username.")
                .addFields({ name: "i.e.", value: "`-verify {your-username}`" })
                .setColor(0xff962a);
            return message.channel.send({ embeds: [embed] });
        }

        const verificationChannelName = "🤝・verification";
        if (message.channel.name !== verificationChannelName) {
            const channel = message.guild.channels.cache.find(c => c.name === verificationChannelName);
            return message.channel.send(`Please use this command in the ${channel ? `<#${channel.id}>` : verificationChannelName} channel.`);
        }

        const verifiedRoleName = "VERIFIED";
        const verifiedRole = message.guild.roles.cache.find(r => r.name === verifiedRoleName);

        if (!verifiedRole) return message.channel.send("Verified role not found.");

        if (member.roles.cache.has(verifiedRole.id)) {
            return message.channel.send(`${member} is already verified.`);
        }

        await member.roles.add(verifiedRole);
        await message.channel.send(`${member} has been verified.`);
    }
};
