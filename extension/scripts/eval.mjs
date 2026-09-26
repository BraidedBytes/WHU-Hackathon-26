import '../config.js';
import '../lib/detect.js';

// Keep these aligned with the web UI team's /demo/testset.json film choices.
const films = [
  { tmdbId: 745, title: 'The Sixth Sense', originalTitle: 'The Sixth Sense', year: 1999,
    overview: 'A child psychologist helps a boy who says he sees ghosts.',
    characters: ['Malcolm Crowe', 'Cole Sear'], cast: ['Bruce Willis', 'Haley Joel Osment'], status: 'want' },
  { tmdbId: 299534, title: 'Avengers: Endgame', originalTitle: 'Avengers: Endgame', year: 2019,
    overview: 'The Avengers try to undo the damage caused by Thanos.',
    characters: ['Tony Stark', 'Steve Rogers', 'Thanos'],
    cast: ['Robert Downey Jr.', 'Chris Evans'], status: 'want' },
];

const config = globalThis.SPOILSPORT_CONFIG;
if (!config?.OPENAI_API_KEY || !config?.MODEL) throw new Error('Set OPENAI_API_KEY and MODEL in extension/config.js');
const fixtureUrl = process.argv[2] || 'http://localhost:3000/demo/testset.json';
const fixtures = await fetch(fixtureUrl).then((response) => {
  if (!response.ok) throw new Error(`Testset returned ${response.status}`);
  return response.json();
});
if (!Array.isArray(fixtures)) throw new Error('Testset must be an array');

const detect = globalThis.SpoilsportDetect;
const matchers = detect.buildMatchers(films, {});
const predictions = new Map(fixtures.map((fixture) => [String(fixture.id), false]));
const candidates = fixtures.map((fixture) => ({
  id: String(fixture.id), text: String(fixture.text || '').slice(0, 600),
  filmIds: detect.prefilter(String(fixture.text || ''), matchers),
})).filter((item) => item.filmIds.length);

for (let offset = 0; offset < candidates.length; offset += 20) {
  const batch = candidates.slice(offset, offset + 20);
  const request = detect.buildClassifyRequest(batch, films, config.MODEL);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error(`OpenAI returned ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const verdicts = JSON.parse(data.choices?.[0]?.message?.content || '{}').results;
  if (!Array.isArray(verdicts)) throw new Error('Malformed classifier response');
  for (const verdict of verdicts) predictions.set(verdict.id, verdict.spoiler && verdict.confidence >= 0.5);
}

const counts = { spoiler: { correct: 0, total: 0 }, safe: { correct: 0, total: 0 } };
for (const fixture of fixtures) {
  const expected = fixture.expected === true || String(fixture.expected).toLowerCase() === 'spoiler';
  const actual = predictions.get(String(fixture.id)) || false;
  const group = counts[expected ? 'spoiler' : 'safe'];
  group.total++;
  if (actual === expected) group.correct++;
  else console.log(`WRONG ${fixture.id}: expected=${expected ? 'spoiler' : 'safe'} actual=${actual ? 'spoiler' : 'safe'}\n  ${fixture.text}`);
}
for (const [label, { correct, total }] of Object.entries(counts)) {
  console.log(`${label}: ${correct}/${total} (${total ? Math.round(100 * correct / total) : 0}%)`);
}
