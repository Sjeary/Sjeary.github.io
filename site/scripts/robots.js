'use strict';

hexo.extend.generator.register('robots', function () {
  const origin = this.config.url.replace(/\/+$/, '');
  return {
    path: 'robots.txt',
    data: `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
  };
});
