const { EmbedBuilder } = require('discord.js');

// Rendering order for command groups in the directory. Any access value not
// listed here still renders, just after these known ones.
const GROUP_ORDER = ['public', 'verification', 'member', 'admin'];

const GROUP_TITLES = {
    public: 'Public',
    verification: 'Verification',
    member: 'Member',
    admin: 'Admin'
};

const ACCESS_LABELS = {
    public: 'Open to everyone.',
    verification: "Open to everyone — it's how you get verified.",
    member: 'Requires the `VERIFIED` role or Administrator.',
    admin: 'Administrator only.'
};

function formatCommandLine(command) {
    const aliasSuffix = command.aliases && command.aliases.length
        ? ` (aka ${command.aliases.map(a => `\`-${a}\``).join(', ')})`
        : '';
    return `\`${command.usage || `-${command.name}`}\`${aliasSuffix} — ${command.description || 'No description available.'}`;
}

function groupByAccess(commands) {
    const groups = new Map();
    for (const command of commands) {
        const key = command.access || 'public';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(command);
    }
    for (const group of groups.values()) {
        group.sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
}

function buildCommandListEmbed(commands) {
    const embed = new EmbedBuilder()
        .setTitle('🆘 Fred from HR — Commands')
        .setDescription('Use `-help <command>` for details on a specific command.')
        .setColor(0xf449d3);

    const groups = groupByAccess(commands);
    const orderedKeys = [...GROUP_ORDER, ...[...groups.keys()].filter(k => !GROUP_ORDER.includes(k))];

    for (const key of orderedKeys) {
        const group = groups.get(key);
        if (!group || !group.length) continue;

        const label = GROUP_TITLES[key] || key.charAt(0).toUpperCase() + key.slice(1);
        const accessNote = ACCESS_LABELS[key] || '';
        embed.addFields({
            name: `${label} — ${accessNote}`.trim(),
            value: group.map(formatCommandLine).join('\n'),
            inline: false
        });
    }

    return embed;
}

function resolveCommand(commands, query) {
    if (!query) return null;
    const key = query.toLowerCase();
    for (const command of commands) {
        if (command.name === key) return command;
        if (Array.isArray(command.aliases) && command.aliases.includes(key)) return command;
    }
    return null;
}

function buildCommandDetailEmbed(command) {
    const aliasesValue = command.aliases && command.aliases.length
        ? command.aliases.map(a => `\`-${a}\``).join(', ')
        : 'None';
    const accessValue = ACCESS_LABELS[command.access] || 'Open to everyone.';

    return new EmbedBuilder()
        .setTitle(`🆘 -${command.name}`)
        .setDescription(command.description || 'No description available.')
        .addFields(
            { name: 'Usage', value: `\`${command.usage || `-${command.name}`}\``, inline: false },
            { name: 'Aliases', value: aliasesValue, inline: true },
            { name: 'Access', value: accessValue, inline: true }
        )
        .setColor(0xf449d3);
}

function buildUnknownCommandMessage(query) {
    return `I don't know a command called \`${query}\`. Try \`-help\` to see everything I can do.`;
}

module.exports = {
    name: 'help',
    aliases: [],
    usage: '-help [command]',
    description: 'Show this command list, or details for one command.',
    access: 'public',
    async execute(message, args, client) {
        if (!client || !client.commands) return;

        const commands = [...client.commands.values()];
        const query = args[0];

        if (!query) {
            await message.channel.send({ embeds: [buildCommandListEmbed(commands)] }).catch(() => {});
            return;
        }

        const target = resolveCommand(commands, query);
        if (!target) {
            await message.channel.send(buildUnknownCommandMessage(query)).catch(() => {});
            return;
        }

        await message.channel.send({ embeds: [buildCommandDetailEmbed(target)] }).catch(() => {});
    },
    _internal: {
        formatCommandLine,
        groupByAccess,
        buildCommandListEmbed,
        resolveCommand,
        buildCommandDetailEmbed,
        buildUnknownCommandMessage,
        GROUP_ORDER,
        GROUP_TITLES,
        ACCESS_LABELS
    }
};
