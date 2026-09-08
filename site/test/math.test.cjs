'use strict';

const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const Hexo = require('hexo');
const cheerio = require('cheerio');
const hexo = new Hexo(process.cwd(), { silent: true });

before(async () => { await hexo.init(); });
after(async () => { await hexo.exit(); });
const render = text => cheerio.load(hexo.render.renderSync({ text, engine: 'md' }));

test('Chinese prose, subscripts and multiline matrices render as math', () => {
  const $ = render(String.raw`行内公式$x_t+\epsilon_\theta$需要保留。

$$
\begin{aligned}
\Sigma &= RSS^\top R^\top \\
J &= \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}
\end{aligned}
$$`);
  assert.equal($('.katex').length, 2);
  assert.equal($('.katex-display').length, 1);
  assert.equal($('p.katex-block > .katex-display').length, 1);
  assert.equal($('math').length, 2);
  assert.equal($('em').length, 0);
  assert.match($('annotation').first().text(), /epsilon_\\theta/);
});

test('code examples keep literal math syntax and ordinary Markdown works', () => {
  const $ = render('`$x_t$`\n\n```tex\n$$ x_t $$\n```\n\n## 阅读\n\n[博客](/blog/)');
  assert.equal($('.katex').length, 0);
  assert.match($.text(), /\$x_t\$/);
  assert.equal($('h2').text(), '阅读');
  assert.equal($('a').last().attr('href'), '/blog/');
});

test('invalid LaTeX fails rendering instead of silently showing a broken equation', () => {
  assert.throws(() => render(String.raw`$\notARealCommand{x}$`), /Undefined control sequence/);
});
