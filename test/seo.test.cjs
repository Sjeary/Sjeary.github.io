'use strict';

const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { load } = require('cheerio');
const Hexo = require('hexo');
const hexo = new Hexo(process.cwd(), { silent: true });
const paths = [
  '', 'about/', 'blog/',
  'blog/2025/07/diffusion-sde-flow/',
  'blog/2025/08/facm/',
  'blog/2025/12/jit-pixel-dit/',
  'blog/2026/05/3d-gaussian-splatting/'
];
const urls = paths.map(path => `https://sjeary.com/${path}`);

before(async () => { await hexo.init(); await hexo.load(); });
after(async () => { await hexo.exit(); });

async function readRoute(path) {
  const stream = hexo.route.get(path);
  assert.ok(stream, `Missing route: ${path}`);
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
}

test('public content pages have one production canonical URL and retain article math', async () => {
  for (const [index, path] of paths.entries()) {
    const $ = load(await readRoute(`${path}index.html`));
    assert.equal($('link[rel="canonical"]').length, 1, path);
    assert.equal($('link[rel="canonical"]').attr('href'), urls[index], path);
    assert.equal($('meta[property="og:url"]').attr('content'), urls[index], path);
    if (path.startsWith('blog/20')) assert.ok($('math').length > 0, path);
  }
});

test('utility and archive pages keep their noindex policy without canonical URLs', async () => {
  for (const path of ['404.html', 'settings/index.html', 'archives/index.html']) {
    const $ = load(await readRoute(path));
    assert.match($('meta[name="robots"]').attr('content'), /\b(?:none|noindex)\b/);
    assert.equal($('link[rel="canonical"]').length, 0, path);
  }
});

test('sitemap lists each public content URL once, with a robots discovery link', async () => {
  const $ = load(await readRoute('sitemap.xml'), { xml: true });
  assert.equal($('urlset').attr('xmlns'), 'http://www.sitemaps.org/schemas/sitemap/0.9');
  const entries = $('url > loc').map((_, node) => $(node).text()).get();
  assert.deepEqual(entries.sort(), [...urls].sort());
  for (const node of $('lastmod').toArray()) assert.match($(node).text(), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(await readRoute('robots.txt'), /Sitemap: https:\/\/sjeary\.com\/sitemap\.xml/);
});
