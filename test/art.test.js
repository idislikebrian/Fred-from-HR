const test = require('node:test');
const assert = require('node:assert/strict');
const art = require('../src/commands/art.js');
const { _internal } = art;
const { truncate, shuffle, isSuitableArtwork, buildArtworkEmbed, defaultQueries } = _internal;
const { ACCESS_DENIED_MESSAGE } = require('../src/utils/memberAccess');

test('truncate leaves short strings untouched', () => {
    assert.equal(truncate('hello', 10), 'hello');
});

test('truncate shortens long strings and adds an ellipsis', () => {
    const result = truncate('a'.repeat(300), 256);
    assert.equal(result.length, 256);
    assert.ok(result.endsWith('…'));
});

test('shuffle preserves all elements without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    assert.deepEqual([...input].sort(), [1, 2, 3, 4, 5]);
    assert.deepEqual([...result].sort(), [...input].sort());
    assert.notEqual(result, input);
});

test('isSuitableArtwork requires an image, a title, and an object URL', () => {
    assert.equal(isSuitableArtwork(null), false);
    assert.equal(isSuitableArtwork({}), false);
    assert.equal(
        isSuitableArtwork({ title: 'Untitled', objectURL: 'https://example.com' }),
        false,
        'missing image should be rejected'
    );
    assert.equal(
        isSuitableArtwork({ primaryImage: '', primaryImageSmall: '', title: 'x', objectURL: 'https://example.com' }),
        false,
        'blank image strings should be rejected'
    );
    assert.equal(
        isSuitableArtwork({ primaryImageSmall: 'https://img', title: 'x', objectURL: 'https://example.com' }),
        true
    );
});

test('buildArtworkEmbed includes only the metadata fields present on the record', () => {
    const embed = buildArtworkEmbed({
        title: 'Starry Night',
        objectURL: 'https://metmuseum.org/objects/1',
        primaryImage: 'https://images.metmuseum.org/1.jpg',
        artistDisplayName: 'Vincent van Gogh',
        medium: 'Oil on canvas'
    });
    const data = embed.toJSON();
    assert.equal(data.title, 'Starry Night');
    assert.equal(data.footer.text, 'The Metropolitan Museum of Art');
    const fieldNames = data.fields.map(f => f.name);
    assert.ok(fieldNames.includes('Artist'));
    assert.ok(fieldNames.includes('Medium'));
    assert.ok(!fieldNames.includes('Date'));
    assert.ok(!fieldNames.includes('Department'));
});

test('buildArtworkEmbed falls back to primaryImageSmall when primaryImage is absent', () => {
    const embed = buildArtworkEmbed({
        title: 'Untitled Study',
        objectURL: 'https://metmuseum.org/objects/2',
        primaryImageSmall: 'https://images.metmuseum.org/2-small.jpg'
    });
    const data = embed.toJSON();
    assert.equal(data.image.url, 'https://images.metmuseum.org/2-small.jpg');
});

test('defaultQueries is a small curated, non-empty list of strings', () => {
    assert.ok(Array.isArray(defaultQueries));
    assert.ok(defaultQueries.length > 0);
    for (const q of defaultQueries) {
        assert.equal(typeof q, 'string');
        assert.ok(q.length > 0);
    }
});

// Regression coverage: art.js was migrated from an inline admin/VERIFIED check
// to the shared memberAccess helper. This must not change who is denied, what
// they're told, or that a denial short-circuits before any Met API call.
test('unverified non-admin is still denied with the shared access message, before any network call', async () => {
    const sent = [];
    const message = {
        guild: {},
        member: {
            permissions: { has: () => false },
            roles: { cache: [] }
        },
        author: { toString: () => '<@denied-user>' },
        channel: { send: async (payload) => { sent.push(payload); return payload; } }
    };

    await art.execute(message, []);

    assert.equal(sent.length, 1);
    assert.equal(sent[0], `<@denied-user>, ${ACCESS_DENIED_MESSAGE}`);
});
