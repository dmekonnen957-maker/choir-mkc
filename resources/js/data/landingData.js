/**
 * Landing / public data layer.
 *
 * CLEAN MOCK shaped to mirror the real Laravel public API
 * (routes/api.php -> PublicController). Replace getLandingData() / the
 * direct imports with axios calls when wiring the API:
 *
 *   GET /api/public/choirs
 *   GET /api/public/choirs/{choir}
 *   GET /api/public/choirs/{choir}/songs
 *   GET /api/public/choirs/{choir}/performances
 *   GET /api/public/choirs/{choir}/gallery
 *   GET /api/public/choirs/{choir}/history
 *
 * Every record carries `isDemo: true` so the UI can clearly label
 * placeholder content and never present fictional data as real.
 *
 * Lyric text uses public-domain hymns only.
 */

const today = new Date();
const isoDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
};

export const songs = [
    {
        id: 1,
        choirId: 1,
        title: 'Amazing Grace',
        composer: 'John Newton',
        arranger: 'Edwin O. Excell',
        language: 'English',
        year: 1779,
        isPublished: true,
        isDemo: true,
        lyrics: [
            'Amazing grace, how sweet the sound',
            'That saved a wretch like me',
            'I once was lost, but now am found',
            'Was blind, but now I see',
            '',
            '’Twas grace that taught my heart to fear',
            'And grace my fears relieved',
            'How precious did that grace appear',
            'The hour I first believed',
            '',
            'When we’ve been there ten thousand years',
            'Bright shining as the sun',
            'We’ve no less days to sing God’s praise',
            'Than when we first begun',
        ],
    },
    {
        id: 2,
        choirId: 1,
        title: 'Holy, Holy, Holy',
        composer: 'Reginald Heber',
        arranger: 'John B. Dykes',
        language: 'English',
        year: 1826,
        isPublished: true,
        isDemo: true,
        lyrics: [
            'Holy, holy, holy! Lord God Almighty!',
            'Early in the morning our song shall rise to thee',
            'Holy, holy, holy! Merciful and mighty',
            'God in three Persons, blessed Trinity!',
            '',
            'Holy, holy, holy! All the saints adore thee',
            'Casting down their golden crowns around the glassy sea',
            'Cherubim and seraphim falling down before thee',
            'Which wert, and art, and evermore shalt be',
        ],
    },
    {
        id: 3,
        choirId: 2,
        title: 'How Great Thou Art',
        composer: 'Carl Boberg',
        arranger: 'Stuart K. Hine',
        language: 'English',
        year: 1885,
        isPublished: true,
        isDemo: true,
        lyrics: [
            'O Lord my God, when I in awesome wonder',
            'Consider all the worlds thy hands have made',
            'I see the stars, I hear the rolling thunder',
            'Thy power throughout the universe displayed',
            '',
            'Then sings my soul, my Saviour God to thee',
            'How great thou art, how great thou art',
            'Then sings my soul, my Saviour God to thee',
            'How great thou art, how great thou art',
        ],
    },
    {
        id: 4,
        choirId: 2,
        title: 'It Is Well With My Soul',
        composer: 'Horatio G. Spafford',
        arranger: 'Philip P. Bliss',
        language: 'English',
        year: 1876,
        isPublished: true,
        isDemo: true,
        lyrics: [
            'When peace like a river attendeth my way',
            'When sorrows like sea billows roll',
            'Whatever my lot, thou hast taught me to say',
            'It is well, it is well with my soul',
            '',
            'It is well, with my soul',
            'It is well, it is well with my soul',
        ],
    },
    {
        id: 5,
        choirId: 3,
        title: 'Great Is Thy Faithfulness',
        composer: 'Thomas O. Chisholm',
        arranger: 'William M. Runyan',
        language: 'English',
        year: 1923,
        isPublished: true,
        isDemo: true,
        lyrics: [
            'Great is thy faithfulness, O God my Father',
            'There is no shadow of turning with thee',
            'Thou changest not, thy compassions they fail not',
            'As thou hast been, thou forever wilt be',
            '',
            'Summer and winter, and springtime and harvest',
            'Sun, moon and stars in their courses above',
            'Join with all nature in manifold witness',
            'To thy great faithfulness, mercy and love',
        ],
    },
];

export const choirs = [
    {
        id: 1,
        slug: 'celestial-voices',
        name: 'Celestial Voices',
        description:
            'Our flagship choir, blending classical sacred music with contemporary worship across generations of singers.',
        location: 'Main Church',
        leader: 'Dr. Mary Achebe',
        membersCount: 48,
        foundedYear: 1998,
        isPublic: true,
        isDemo: true,
        art: { variant: 'stage', seed: 11 },
        summary:
            'Founded in 1998, Celestial Voices has grown from a small post-service gathering into the heart of our musical worship.',
        milestones: [
            { id: 11, year: '1998', title: 'Choir founded', description: 'A small group begins singing after Sunday service.' },
            { id: 12, year: '2005', title: 'First major concert', description: 'The choir’s first full-length sacred concert.' },
            { id: 13, year: '2026', title: 'CHOIR MKC launch', description: 'The choir joins the unified CHOIR MKC platform.' },
        ],
    },
    {
        id: 2,
        slug: 'harmony-youth',
        name: 'Harmony Youth Choir',
        description:
            'A vibrant community of young voices discovering faith, friendship and the joy of singing together.',
        location: 'Youth Hall',
        leader: 'Mr. David Okafor',
        membersCount: 32,
        foundedYear: 2005,
        isPublic: true,
        isDemo: true,
        art: { variant: 'rows', seed: 27 },
        summary:
            'Beginning in 2005, the Harmony Youth Choir welcomes each new generation of singers with energy and joy.',
        milestones: [
            { id: 21, year: '2005', title: 'Youth program begins', description: 'A choir for the next generation is formed.' },
            { id: 22, year: '2015', title: 'First festival', description: 'Performs at the regional youth festival of praise.' },
            { id: 23, year: '2026', title: 'CHOIR MKC launch', description: 'Joins the unified platform alongside the other choirs.' },
        ],
    },
    {
        id: 3,
        slug: 'grace-mens-ensemble',
        name: "Grace Men's Ensemble",
        description:
            'Deep, resonant harmonies carrying the timeless hymns of the church into every service.',
        location: 'Chapel of Light',
        leader: 'Mr. Jonathan Eze',
        membersCount: 18,
        foundedYear: 2012,
        isPublic: true,
        isDemo: true,
        art: { variant: 'glow', seed: 42 },
        summary:
            'Established in 2012, the Grace Men’s Ensemble brings solemn, soaring Advent and hymn traditions to life.',
        milestones: [
            { id: 31, year: '2012', title: 'Ensemble founded', description: 'A dedicated men’s group is formed.' },
            { id: 32, year: '2019', title: 'Advent tradition', description: 'Begins the annual Advent service of hymns.' },
            { id: 33, year: '2026', title: 'CHOIR MKC launch', description: 'Joins the unified platform.' },
        ],
    },
];

export const performances = [
    {
        id: 1,
        choirId: 1,
        title: 'Sunday Worship Celebration',
        date: isoDate(0), // today (computed at runtime)
        time: '10:00',
        venue: 'Main Church',
        isPublic: true,
        isDemo: true,
        description:
            'A weekly gathering where the Celestial Voices lead the congregation in song, prayer and celebration. All are welcome.',
        songIds: [1, 2, 3],
    },
    {
        id: 2,
        choirId: 2,
        title: 'Evening Festival of Praise',
        date: isoDate(7),
        time: '18:30',
        venue: 'Cathedral Hall',
        isPublic: true,
        isDemo: true,
        description:
            'A candlelit evening of hymns and anthems presented by the Harmony Youth Choir and friends.',
        songIds: [3, 4, 5],
    },
    {
        id: 3,
        choirId: 3,
        title: 'Men’s Ensemble Advent Service',
        date: isoDate(21),
        time: '19:00',
        venue: 'Chapel of Light',
        isPublic: true,
        isDemo: true,
        description: "The Grace Men's Ensemble welcomes the season with solemn, soaring Advent hymns.",
        songIds: [2, 5, 1],
    },
    {
        id: 4,
        choirId: 1,
        title: 'Spring Sacred Concert',
        date: isoDate(-30),
        time: '17:00',
        venue: 'Main Church',
        isPublic: true,
        isDemo: true,
        description: 'A reflective spring concert of sacred choral works from the choir’s archive.',
        songIds: [1, 4, 2],
    },
];

export const historyMilestones = [
    { id: 101, year: '1998', title: 'Choir founded', description: 'A small group of singers gathers after Sunday service with a simple dream: to lift their voices together in worship.' },
    { id: 102, year: '2005', title: 'First major performance', description: 'The choir presents its first full-length sacred concert to a packed sanctuary.' },
    { id: 103, year: '2012', title: 'New generation of members', description: 'A youth program begins, welcoming a new generation of singers.' },
    { id: 104, year: '2020', title: 'Digital music archive begins', description: 'Songs, recordings and stories are gathered into a digital archive.' },
    { id: 105, year: '2026', title: 'CHOIR MKC platform', description: 'The CHOIR MKC platform launches, uniting multiple choirs in one digital home.' },
];

export const gallery = [
    { id: 1, choirId: 1, title: 'Sunday Worship, 2024', art: { variant: 'stage', seed: 4 }, isDemo: true },
    { id: 2, choirId: 1, title: 'Advent Rehearsal', art: { variant: 'rows', seed: 9 }, isDemo: true },
    { id: 3, choirId: 2, title: 'Youth Choir Rehearsal', art: { variant: 'rows', seed: 13 }, isDemo: true },
    { id: 4, choirId: 2, title: 'Festival of Praise', art: { variant: 'glow', seed: 18 }, isDemo: true },
    { id: 5, choirId: 3, title: 'Advent Service', art: { variant: 'glow', seed: 23 }, isDemo: true },
    { id: 6, choirId: 3, title: 'Morning Light Singers', art: { variant: 'stage', seed: 28 }, isDemo: true },
    { id: 7, choirId: 1, title: 'Community Carols', art: { variant: 'rows', seed: 33 }, isDemo: true },
    { id: 8, choirId: 2, title: 'Together in Song', art: { variant: 'glow', seed: 38 }, isDemo: true },
];

export const heroSlides = [
    { id: 1, art: { variant: 'stage', seed: 1 }, caption: 'United in Song' },
    { id: 2, art: { variant: 'rows', seed: 2 }, caption: 'Every Voice Matters' },
    { id: 3, art: { variant: 'glow', seed: 3 }, caption: 'Songs That Endure' },
    { id: 4, art: { variant: 'stage', seed: 6 }, caption: 'A Legacy of Worship' },
    { id: 5, art: { variant: 'rows', seed: 8 }, caption: 'One Community' },
];

/* ----------------------------- helpers ----------------------------- */

export function getChoirById(id) {
    if (id === undefined || id === null) return null;
    const nid = Number(id);
    return choirs.find((c) => c.id === nid || c.slug === String(id)) ?? null;
}

export function getPerformanceById(id) {
    const nid = Number(id);
    return performances.find((p) => p.id === nid) ?? null;
}

export function getSongById(id) {
    const nid = Number(id);
    return songs.find((s) => s.id === nid) ?? null;
}

export function getSongsForPerformance(performance) {
    if (!performance?.songIds) return [];
    return performance.songIds
        .map((id) => songs.find((s) => s.id === id))
        .filter(Boolean);
}

export function getChoirPerformances(choirId) {
    return performances.filter((p) => p.choirId === Number(choirId));
}

export function getChoirSongs(choirId) {
    return songs.filter((s) => s.choirId === Number(choirId));
}

export function getChoirGallery(choirId) {
    const items = gallery.filter((g) => g.choirId === Number(choirId));
    return items.length ? items : gallery;
}

export function getChoirMilestones(choirId) {
    const choir = getChoirById(choirId);
    return choir?.milestones ?? historyMilestones;
}

/** Next upcoming performance (today included) or null. */
export function getUpcomingPerformance() {
    const sorted = [...performances].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.find((p) => !isPast(p.date)) ?? sorted[sorted.length - 1] ?? null;
}

export function getTodaysPerformance() {
    return performances.find((p) => isSameDay(p.date)) ?? null;
}

function isPast(iso) {
    const d = new Date(iso + 'T00:00:00');
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
}

export function isSameDay(iso, date = new Date()) {
    if (!iso) return false;
    const d = new Date(iso + 'T00:00:00');
    return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
    );
}

/** Neighbouring song within a supplied list (for prev/next on detail pages). */
export function getAdjacentSong(list, currentId) {
    const arr = list && list.length ? list : songs;
    const idx = arr.findIndex((s) => s.id === Number(currentId));
    if (idx === -1) return { prev: null, next: null };
    return {
        prev: idx > 0 ? arr[idx - 1] : null,
        next: idx < arr.length - 1 ? arr[idx + 1] : null,
    };
}
