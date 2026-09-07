'use strict';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

// Read the same published collection as Hexo's blog index. Drafts are excluded
// by Hexo. Use Stellar's own article-card classes without a separate stylesheet.
hexo.extend.tag.register('sjeary_recent_posts', function () {
  const posts = hexo.locals.get('posts').sort('date', -1).limit(3).toArray();
  if (posts.length === 0) return '<p>还没有发布文章，之后再来看看吧。</p>';
  return '<div class="post-list post">' + posts.map(post => {
    const href = `/${post.path}`.replace(/index\.html$/, '');
    const date = post.date.format('YYYY-MM-DD');
    return `<div class="post-card-wrap"><a class="post-card post" href="${escape(href)}"><article class="md-text"><h2 class="post-title">${escape(post.title)}</h2><div class="excerpt"><p>${escape(post.description)}</p></div><div class="meta cap"><time datetime="${date}">${date}</time></div></article></a></div>`;
  }).join('') + '</div>';
});
