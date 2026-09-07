'use strict';

const { load } = require('cheerio');

// Reuse Stellar's production URL without enabling its browser-side clone warning.
hexo.extend.filter.register('after_render:html', function (html) {
  if (!/<\/head\s*>/i.test(html)) return html;
  const $ = load(html);
  if ($('link[rel="canonical"]').length) return html;
  const robots = $('meta[name="robots"]').map((_, node) => $(node).attr('content')).get().join(',');
  if (/\b(?:noindex|none)\b/i.test(robots)) return html;
  const address = $('meta[property="og:url"]').attr('content');
  if (!address) return html;
  const url = new URL(address);
  if (url.origin !== new URL(this.config.url).origin) return html;
  url.search = '';
  url.hash = '';
  const canonical = $('<link>').attr({ rel: 'canonical', href: url.href }).toString();
  return html.replace(/<\/head\s*>/i, `${canonical}</head>`);
});
