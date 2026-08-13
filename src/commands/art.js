const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { canUseMemberCommand, ACCESS_DENIED_MESSAGE } = require('../utils/memberAccess');

const REQUEST_TIMEOUT_MS = 8000;
const MAX_OBJECTS_TO_INSPECT = 10;
const COOLDOWN_MS = 10000;
const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

const defaultQueries = ['photography', 'painting', 'sculpture', 'print', 'drawing', 'textile', 'design'];

const cooldowns = new Map();

function truncate(str, max) {
    if (typeof str !== 'string') return str;
    return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function isSuitableArtwork(data) {
    if (!data || typeof data !== 'object') return false;
    const hasImage =
        (typeof data.primaryImage === 'string' && data.primaryImage.trim() !== '') ||
        (typeof data.primaryImageSmall === 'string' && data.primaryImageSmall.trim() !== '');
    const hasTitle = typeof data.title === 'string' && data.title.trim() !== '';
    const hasUrl = typeof data.objectURL === 'string' && data.objectURL.trim() !== '';
    return hasImage && hasTitle && hasUrl;
}

async function searchObjectIds(query) {
    const response = await axios.get(`${MET_API_BASE}/search`, {
        params: { hasImages: true, q: query },
        timeout: REQUEST_TIMEOUT_MS
    });
    const ids = response.data && Array.isArray(response.data.objectIDs) ? response.data.objectIDs : [];
    return ids;
}

async function fetchObject(objectId) {
    const response = await axios.get(`${MET_API_BASE}/objects/${objectId}`, {
        timeout: REQUEST_TIMEOUT_MS
    });
    return response.data;
}

async function findArtwork(query) {
    const objectIds = await searchObjectIds(query);
    if (!objectIds.length) return null;

    const candidates = shuffle(objectIds).slice(0, MAX_OBJECTS_TO_INSPECT);

    for (const objectId of candidates) {
        try {
            const data = await fetchObject(objectId);
            if (isSuitableArtwork(data)) {
                return data;
            }
        } catch (err) {
            // Skip this candidate (timeout, network error, malformed record) and try the next.
            continue;
        }
    }
    return null;
}

function buildArtworkEmbed(artwork) {
    const imageUrl = artwork.primaryImage || artwork.primaryImageSmall;
    const embed = new EmbedBuilder()
        .setTitle(truncate(artwork.title, 256) || 'Untitled')
        .setURL(artwork.objectURL)
        .setColor(0xf449d3)
        .setImage(imageUrl)
        .setFooter({ text: 'The Metropolitan Museum of Art' });

    const fields = [];
    if (artwork.artistDisplayName) {
        fields.push({ name: 'Artist', value: truncate(artwork.artistDisplayName, 1024), inline: true });
    }
    if (artwork.objectDate) {
        fields.push({ name: 'Date', value: truncate(artwork.objectDate, 1024), inline: true });
    }
    if (artwork.medium) {
        fields.push({ name: 'Medium', value: truncate(artwork.medium, 1024), inline: true });
    }
    const cultureOrPeriod = [artwork.culture, artwork.period].filter(Boolean).join(' / ');
    if (cultureOrPeriod) {
        fields.push({ name: 'Culture / Period', value: truncate(cultureOrPeriod, 1024), inline: true });
    }
    if (artwork.department) {
        fields.push({ name: 'Department', value: truncate(artwork.department, 1024), inline: true });
    }

    if (fields.length) embed.addFields(fields.slice(0, 25));

    return embed;
}

module.exports = {
    name: 'art',
    description: 'Fetch a random piece of art from the Met Museum collection',
    async execute(message, args, client) {
        if (!message.guild || !message.member) return;

        if (!canUseMemberCommand(message.member)) {
            await message.channel.send(`${message.author}, ${ACCESS_DENIED_MESSAGE}`).catch(() => {});
            return;
        }

        const now = Date.now();
        const cooldownExpires = cooldowns.get(message.author.id);
        if (cooldownExpires && now < cooldownExpires) {
            const remaining = Math.ceil((cooldownExpires - now) / 1000);
            await message.channel.send(`${message.author}, slow down! Try again in ${remaining}s.`).catch(() => {});
            return;
        }
        cooldowns.set(message.author.id, now + COOLDOWN_MS);

        const query = args.join(' ').trim() || defaultQueries[Math.floor(Math.random() * defaultQueries.length)];

        let artwork;
        try {
            artwork = await findArtwork(query);
        } catch (err) {
            console.error('Met API error:', err.message);
            await message.channel.send(`${message.author}, I couldn't reach the Met's collection right now. Try again later.`).catch(() => {});
            return;
        }

        if (!artwork) {
            await message.channel.send(`${message.author}, I couldn't find any art for "${truncate(query, 100)}". Try a different search.`).catch(() => {});
            return;
        }

        try {
            const embed = buildArtworkEmbed(artwork);
            await message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('Failed to send art embed:', err.message);
            await message.channel.send(`${message.author}, I found something but couldn't display it here.`).catch(() => {});
        }
    },
    _internal: { truncate, shuffle, isSuitableArtwork, buildArtworkEmbed, defaultQueries }
};
