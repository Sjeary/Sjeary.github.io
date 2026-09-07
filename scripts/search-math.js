'use strict';

const { load } = require('cheerio');
const { buildSearchIndex } = require('hexo-theme-stellar/scripts/lib/search_index');
const { normalize_path } = require('hexo-theme-stellar/scripts/lib/path_utils');

// Rebuild only math-bearing search entries with Stellar's own anchor builder.
// The original post HTML, including accessible MathML, remains untouched.
hexo.extend.filter.register('after_generate', async function () {
  if (this.stellar?.config.search.provider !== 'local') return;
  const stream = this.route.get('search.json');
  if (!stream) return;

  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const entries = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const documents = new Map();
  for (const collection of ['posts', 'pages']) {
    this.locals.get(collection).forEach(document => {
      documents.set(normalize_path(this.config.root + document.path), document);
    });
  }

  let changed = false;
  for (const entry of entries) {
    // Respect the theme's scope, exclusions, and include_content setting.
    if (typeof entry.content !== 'string') continue;
    const document = documents.get(normalize_path(entry.path));
    if (!document?.content?.includes('class="katex"')) continue;
    const $ = load(document.content, null, false);
    // Plain-text search cannot represent fractions and matrices faithfully.
    // A marker avoids duplicate HTML/MathML text and exposed LaTeX commands.
    $('.katex').replaceWith('［公式］');
    const index = buildSearchIndex($.html());
    entry.content = index.content;
    if (index.anchors.length) entry.anchors = index.anchors;
    else delete entry.anchors;
    changed = true;
  }
  if (changed) this.route.set('search.json', JSON.stringify(entries));
});
