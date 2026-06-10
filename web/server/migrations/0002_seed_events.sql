-- Seed: the events that happened before the API existed, taken from the
-- website's events.ts. Artworks for these live in the static site build
-- (web/src/assets/events/), not in /media — image_url stays NULL here.
INSERT INTO events (
    id, slug, title, description, date_time_start, date_time_end,
    location_name, location_city, location_latitude, location_longitude,
    ticket_link, genre, age_restriction, image_url, image_alt, acts,
    published, created_by, created_at, updated_at
) VALUES
(
    '0a890c2e-44fb-4f3c-94b8-0f25f1b1f6ad', 'genesis', 'genesis',
    'A new impulse emerges.
Impedanz enters the floor with a premiere designed to resonate deep. Expect raw grooves, hypnotic rhythms and bodies in sync from open to close.
Driven by detail, shaped by sound and grounded in awareness – this is only the beginning.',
    '2025-04-25T23:00:00+02:00', '2025-04-26T07:00:00+02:00',
    'City Club Augsburg', 'Augsburg', 48.365419, 10.895053,
    NULL, 'Hypnotic, Minimal, Hardgroove 135-155BPM', '18+',
    NULL, 'A glowing polygon looking like the explosion of a star',
    '[{"artists":[{"name":"Tyrellativ","url":"https://www.instagram.com/tyrellativ/"},{"name":"Artifex","url":"https://www.instagram.com/artifex.wav/"}],"artistJoiner":"b2b"},{"artists":[{"name":"TONSAMMLER","url":"https://www.instagram.com/ton.sammler/"},{"name":"Animar","url":"https://www.instagram.com/animar.imp/"}],"artistJoiner":"b2b"},{"artists":[{"name":"Fio_licious","url":"https://www.instagram.com/fio_licious/"},{"name":"balanced crohn","url":"https://www.instagram.com/pepe_8_6_1/"}],"artistJoiner":"b2b"},{"artists":[{"name":"kardioversion","url":"https://www.instagram.com/kardioversion.music/"},{"name":"DJCANDYFLIP","url":"https://www.instagram.com/dj.candyflip/"}],"artistJoiner":"b2b"}]',
    1, NULL, '2025-04-01T00:00:00+02:00', '2025-04-01T00:00:00+02:00'
),
(
    '6a4f2c81-8e7c-4a9e-b9d3-52f9c4d4e2b1', 'duality', 'duality', '',
    '2025-07-12T23:00:00+02:00', '2025-07-13T07:00:00+02:00',
    'City Club Augsburg', 'Augsburg', 48.365419, 10.895053,
    NULL, 'Techno', '18+',
    NULL, 'A black and white glitched image with a few colorful elements',
    '[{"artists":[{"name":"HYPNOSTA","url":"https://www.instagram.com/_hypnosta_/"}]},{"artists":[{"name":"PEPE","url":"https://www.instagram.com/pepe_8_6_1/"}]},{"artists":[{"name":"TONSAMMLER","url":"https://www.instagram.com/ton.sammler/"},{"name":"Animar","url":"https://www.instagram.com/animar.imp/"}],"artistJoiner":"b2b"}]',
    1, NULL, '2025-06-01T00:00:00+02:00', '2025-06-01T00:00:00+02:00'
),
(
    'c1d2aa90-13b4-4f57-8a26-7e8d9b3a5c44', 'trinity', 'trinity', '',
    '2025-09-12T23:00:00+02:00', '2025-09-13T07:00:00+02:00',
    'City Club Augsburg', 'Augsburg', 48.365419, 10.895053,
    NULL, 'Techno', '18+',
    NULL, 'A green stylized version of the trinity explosion.',
    '[{"artists":[{"name":"TONSAMMLER","url":"https://www.instagram.com/ton.sammler/"},{"name":"Animar","url":"https://www.instagram.com/animar.imp/"}],"artistJoiner":"b2b"},{"artists":[{"name":"kardioversion","url":"https://www.instagram.com/kardioversion.music/"},{"name":"DJCANDYFLIP","url":"https://www.instagram.com/dj.candyflip/"}],"artistJoiner":"b2b"},{"artists":[{"name":"PEPE","url":"https://www.instagram.com/pepe_8_6_1/"},{"name":"drischa","url":"https://www.instagram.com/dri.scha/"}],"artistJoiner":"b2b"}]',
    1, NULL, '2025-08-01T00:00:00+02:00', '2025-08-01T00:00:00+02:00'
),
(
    'f3b8d6c2-9a1e-4d05-bb7f-1c6a2e8f9d33', 'galaxy', 'galaxy', '',
    '2025-12-12T20:00:00+01:00', '2025-12-13T06:00:00+01:00',
    'City Club Augsburg', 'Augsburg', 48.365419, 10.895053,
    NULL, 'Techno, Hardtrance, Hardgroove, 140-160BPM', '18+',
    NULL, 'A stylized image of a galaxy with red and blue colors.',
    '[{"artists":[{"name":"DJanis","url":"https://www.instagram.com/janisweil"}]},{"artists":[{"name":"dr.penn","url":"https://www.instagram.com/dr.penn_.wav/"},{"name":"nile","url":"https://www.instagram.com/nile.techno/"}],"artistJoiner":"b2b"},{"artists":[{"name":"babybangs","url":"https://www.instagram.com/leoxleopard"},{"name":"Fio_licious","url":"https://www.instagram.com/fio_licious/"}],"artistJoiner":"b2b"},{"artists":[{"name":"drischa","url":"https://www.instagram.com/dri.scha/"},{"name":"PEPE","url":"https://www.instagram.com/_pepe_matteo_/"}],"artistJoiner":"b2b"},{"artists":[{"name":"Animar","url":"https://www.instagram.com/animar.imp/"},{"name":"TONSAMMLER","url":"https://www.instagram.com/ton.sammler/"}],"artistJoiner":"b2b"},{"artists":[{"name":"effymichelle","url":"https://www.instagram.com/effymichelle/"},{"name":"pflanzenschranz","url":"https://www.instagram.com/pflanzenschranz/"}],"artistJoiner":"b2b"}]',
    1, NULL, '2025-11-01T00:00:00+01:00', '2025-11-01T00:00:00+01:00'
),
(
    '2e7c5b14-6d3f-4e88-9c0a-8b5f4d2a1e66', 'apokalypsis', 'apokalypsis', '',
    '2025-12-20T23:00:00+01:00', '2025-12-21T06:00:00+01:00',
    'Karo10', 'Augsburg', 48.369852, 10.898206,
    NULL, 'Techno, Pop', '18+',
    NULL, 'A orthographic view of the floors where the party takes place.',
    '[]',
    1, NULL, '2025-12-01T00:00:00+01:00', '2025-12-01T00:00:00+01:00'
);
