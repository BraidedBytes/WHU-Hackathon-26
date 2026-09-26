import test from 'node:test';
import assert from 'node:assert/strict';
import '../lib/detect.js';

const films = [{
  tmdbId: 42,
  title: 'The Quick Star',
  originalTitle: 'The Quick Star',
  year: 2026,
  overview: 'A pilot searches for home.',
  characters: ['Mara Vossberg'],
  cast: ['Alia Reed'],
  status: 'want',
}, {
  tmdbId: 77,
  title: 'Control Film',
  status: 'watched',
}];

test('matches protected films with Unicode boundaries and proper-name case', () => {
  const matchers = globalThis.SpoilsportDetect.buildMatchers(films, {});
  assert.deepEqual(globalThis.SpoilsportDetect.prefilter('Mara Vossberg reveals the ending', matchers), [42]);
  assert.deepEqual(globalThis.SpoilsportDetect.prefilter('Vossberg reveals the ending', matchers), [42]);
  assert.deepEqual(globalThis.SpoilsportDetect.prefilter('alia reed is excellent', matchers), [42]);
  assert.deepEqual(globalThis.SpoilsportDetect.prefilter('A quick star shines', matchers), []);
  assert.deepEqual(globalThis.SpoilsportDetect.prefilter('Control Film ending', matchers), []);
  assert.deepEqual(globalThis.SpoilsportDetect.prefilter('ÉVossberg', matchers), []);
});

test('builds a schema constrained request with only snippets and film context', () => {
  const request = globalThis.SpoilsportDetect.buildClassifyRequest(
    [{ id: 'x', text: 'Mara Voss survives', filmIds: [42], url: 'https://secret.example/' }],
    films,
    'gpt-4o-mini',
  );
  assert.equal(request.model, 'gpt-4o-mini');
  assert.equal(request.response_format.type, 'json_schema');
  assert.equal(JSON.stringify(request).includes('https://secret.example/'), false);
  assert.match(request.messages[0].content, /Mara Voss/);
});
