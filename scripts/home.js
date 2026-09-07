'use strict';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

hexo.extend.injector.register('head_end', '<link rel="stylesheet" href="/css/sjeary.css">');

// Read the same published collection as Hexo's blog index. Drafts are excluded
// by Hexo, and future dates respect the site's `future` setting.
hexo.extend.tag.register('sjeary_recent_posts', function () {
  const posts = hexo.locals.get('posts').sort('date', -1).limit(3).toArray();
  if (posts.length === 0) return '<p class="sjeary-empty">还没有发布文章，之后再来看看吧。</p>';
  return '<div class="sjeary-posts">' + posts.map(post => {
    const href = `/${post.path}`.replace(/index\.html$/, '');
    const date = post.date.format('YYYY-MM-DD');
    return `<a class="sjeary-post" href="${escape(href)}"><div><time datetime="${date}">${date}</time><h3>${escape(post.title)}</h3><p>${escape(post.description)}</p></div><span class="sjeary-post-arrow" aria-hidden="true">↗</span></a>`;
  }).join('') + '</div>';
});
