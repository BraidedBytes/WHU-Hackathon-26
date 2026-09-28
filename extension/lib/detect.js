(function () {
  const COMMON_LAST_NAMES = new Set(['Other', 'There', 'First', 'After', 'Before', 'About']);
  const SYSTEM_PROMPT = `You judge whether short snippets of web text spoil a film for someone who has NOT
seen it.
SPOILER = reveals plot developments beyond the premise: twists, secret identities,
deaths, who wins or loses, endings, character fates, major late-film events,
surprise cameos.
NOT a spoiler = mentioning the film, opinions, praise of performances, cast lists
("Actor as Character"), release, box-office or awards news, trailer talk, and the
premise as stated in the official overview.
Snippets may refer to a film ONLY through character names, actor names or plot
elements. Use the film list to recognise that.
Films to protect: {JSON array of { id, title, year, overview, characters }}
For each snippet return: spoiler (true/false), filmId of the spoiled film or null,
confidence 0–1. If a snippet plausibly reveals a real plot development, mark it
as a spoiler.`;

  function termName(value) {
    return typeof value === 'string' ? value : value && (value.name || value.character || value.title) || '';
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function buildMatchers(films, extraTermsById = {}) {
    return (Array.isArray(films) ? films : [])
      .filter((film) => film && film.status === 'want' && Number.isInteger(Number(film.tmdbId)))
      .map((film) => {
        const terms = [film.title, film.originalTitle, ...(film.characters || []),
          ...(film.cast || []), ...(extraTermsById[film.tmdbId] || [])];
        for (const character of film.characters || []) {
          const words = termName(character).trim().split(/\s+/u);
          const last = words.at(-1);
          if (words.length > 1 && last.length >= 5 && !COMMON_LAST_NAMES.has(last)) terms.push(last);
        }
        const unique = [...new Set(terms.map((value) => termName(value).trim()).filter(Boolean))];
        const wrap = (term) => `(?<![\\p{L}\\p{N}])(?:${escapeRegex(term)})(?![\\p{L}\\p{N}])`;
        const multi = unique.filter((term) => /\s/u.test(term));
        const single = unique.filter((term) => !/\s/u.test(term));
        return {
          tmdbId: Number(film.tmdbId),
          multi: multi.length ? new RegExp(multi.map(wrap).join('|'), 'iu') : null,
          single: single.length ? new RegExp(single.map(wrap).join('|'), 'u') : null,
        };
      });
  }

  function prefilter(text, matchers) {
    return (matchers || [])
      .filter((matcher) => (matcher.multi && matcher.multi.test(text)) ||
        (matcher.single && matcher.single.test(text)))
      .map((matcher) => matcher.tmdbId);
  }

  function buildClassifyRequest(items, films, model) {
    const relevantIds = new Set(items.flatMap((item) => item.filmIds).map(Number));
    const filmContext = (films || [])
      .filter((film) => film.status === 'want' && relevantIds.has(Number(film.tmdbId)))
      .map((film) => ({ id: Number(film.tmdbId), title: film.title, year: film.year || null,
        overview: film.overview || '', characters: (film.characters || []).map(termName) }));
    const snippets = items.map((item) => ({ id: String(item.id), text: String(item.text).slice(0, 600),
      filmIds: item.filmIds.map(Number) }));
    return {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT.replace(
          '{JSON array of { id, title, year, overview, characters }}', JSON.stringify(filmContext)) },
        { role: 'user', content: JSON.stringify(snippets) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'spoilsport_verdicts', strict: true,
          schema: {
            type: 'object', additionalProperties: false, required: ['results'],
            properties: { results: { type: 'array', items: {
              type: 'object', additionalProperties: false,
              required: ['id', 'spoiler', 'filmId', 'confidence'],
              properties: {
                id: { type: 'string' }, spoiler: { type: 'boolean' },
                filmId: { type: ['integer', 'null'] }, confidence: { type: 'number' },
              },
            } } },
          },
        },
      },
    };
  }

  globalThis.SpoilsportDetect = { buildMatchers, prefilter, buildClassifyRequest };
})();
