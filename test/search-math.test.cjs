'use strict';

const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const Hexo = require('hexo');
const hexo = new Hexo(process.cwd(), { silent: true });
let entries;
let original;

before(async () => {
  await hexo.init();
  await hexo.load();
  let json = '';
  for await (const chunk of hexo.route.get('search.json')) json += chunk;
  entries = JSON.parse(json);
  const generator = hexo.extend.generator.get('search_json_generator');
  const generated = await generator.call(hexo, hexo.locals.toObject());
  original = JSON.parse(generated.data);
});
after(async () => { await hexo.exit(); });

test('search snippets omit rendered formula duplicates while articles keep MathML', () => {
  const articles = entries.filter(entry => entry.content?.includes('［公式］'));
  assert.ok(articles.length > 0, 'At least one technical article exercises the filter');
  for (const entry of articles) {
    assert.ok(entry.content.includes('［公式］'));
    assert.doesNotMatch(entry.content, /\\(?:frac|mathbb|mathbf|boldsymbol|begin)\b/);
    const previous = original.find(item => item.path === entry.path);
    assert.ok(entry.content.length < previous.content.length);
    const { content: a, anchors: b, ...metadata } = entry;
    const { content: c, anchors: d, ...originalMetadata } = previous;
    assert.deepEqual(metadata, originalMetadata);
  }
  hexo.locals.get('posts').forEach(post => {
    if (!post.content?.includes('class="katex"')) return;
    assert.match(post.content, /class="katex-mathml"/);
    assert.match(post.content, /<annotation encoding="application\/x-tex">/);
  });
});

test('search headings still point to the correct offsets and original section IDs', () => {
  for (const entry of entries) {
    const previous = original.find(item => item.path === entry.path);
    assert.deepEqual(entry.anchors?.map(anchor => anchor.id), previous.anchors?.map(anchor => anchor.id));
    for (const anchor of entry.anchors || []) {
      assert.equal(entry.content.slice(anchor.offset, anchor.offset + anchor.text.length), anchor.text);
    }
  }
});

test('ordinary pages and literal code examples remain searchable', () => {
  for (const entry of entries.filter(item => !item.path.startsWith('/blog/20'))) {
    assert.deepEqual(entry, original.find(item => item.path === entry.path));
  }
  const jit = entries.find(item => item.path.includes('/jit-pixel-dit/'));
  assert.ok(jit.content.includes('target_velocity'));
  const gs = entries.find(item => item.path.includes('/3d-gaussian-splatting/'));
  assert.ok(gs.content.includes('torch.optim.Adam'));
});
