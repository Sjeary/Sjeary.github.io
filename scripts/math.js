'use strict';

const markedKatex = require('marked-katex-extension');

// Use the installed Markdown extension; Stellar supplies the KaTeX styles.
hexo.extend.filter.register('marked:use', function (use) {
  const extension = markedKatex({ nonStandard: true, throwOnError: true, trust: false });
  const block = extension.extensions.find(item => item.level === 'block');
  const render = block.renderer;
  // Reuse Stellar's native scroll container for equations on narrow screens.
  block.renderer = token => `<p class="katex-block">${render(token)}</p>\n`;
  use(extension);
});
