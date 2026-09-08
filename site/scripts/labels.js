'use strict';

// Customize wording through Hexo i18n; all UI stays in the installed theme.
hexo.extend.filter.register('before_generate', function () {
  const i18n = hexo.theme.i18n;
  i18n.set('zh-CN', { ...i18n.get('zh-CN'), 'btn.docs': '浏览主页' });
});
