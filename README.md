# Sjeary 的个人网站

使用 Hexo 8.1.2 与 Stellar 1.44.0 正式版，包含独立主页、个人介绍和博客。内容通过 Markdown 维护，主题通过 npm 安装并锁定版本。主题源码保持原样。

## 本地预览

需要 Node.js 22 或更高版本（建议使用当前 LTS）和 npm。

```sh
npm ci
npm run dev
```

打开终端显示的本地地址，默认是 `http://127.0.0.1:4000`。

## 修改内容

| 内容 | 文件 |
| --- | --- |
| 主页 | `source/index.md` |
| 个人介绍 | `source/about/index.md` |
| 博客文章 | `source/_posts/` |
| 网站名称、域名、时区 | `_config.yml` |
| 导航、主题颜色、侧栏布局 | `_config.stellar.yml` |
| 侧栏文字 | `source/_data/widgets.yml` |
| 昵称头像 | `source/assets/avatar.svg` |

首次预览使用昵称 Sjeary，不包含未经确认的经历或联系方式。“关于我”的待补充内容和博客示例需在正式发布前确认或替换。

新增文章：

```sh
npm run new:post -- "文章标题"
```

在生成的 Markdown 文件中填写 `title`、`date`、`description`、`categories` 和 `tags`。文章正文写在第二行 `---` 分隔线之后。时区在 `_config.yml` 中设置；未来时间的文章不会提前发布。暂不发布的文章可放在 `source/_drafts/`。

## 页面结构

- `/`：个人主页。
- `/about/`：个人介绍。
- `/blog/`：文章列表。
- `/blog/YYYY/MM/文章名/`：文章。
- 分类、标签与归档页由 Hexo / Stellar 生成。

主页和博客列表是不同页面。`index_generator.path: blog` 负责博客列表，`source/index.md` 负责根路径主页。

## 构建与上线

```sh
npm run build
```

构建结果在 `public/`，可以部署到 GitHub Pages、Cloudflare Pages 或其他静态托管服务。当前项目没有设置任何远程仓库，也不会自动发布或修改 DNS。

绑定 `sjeary.com` 时，先在选定的托管平台添加自定义域名，再按该平台给出的要求修改 DNS 记录并启用 HTTPS。将 `www.sjeary.com` 重定向到主域名。不要删除不相关的邮箱或子域名记录。

如果选用 GitHub Pages，需先确定目标 GitHub 仓库，在仓库中配置 Pages 的构建发布流程。自定义域名填 `sjeary.com`，DNS 记录按 [GitHub 官方说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) 配置。

## 主题说明

Stellar 官网目前还提供新版本文档；本项目固定使用 npm 的正式发布版 1.44.0。升级时先核对对应版本的配置文档，在本地确认后再上线。

- [Hexo 文档](https://hexo.io/zh-cn/docs/)
- [Stellar 文档](https://xaoxuu.com/wiki/stellar/)
- [Stellar 1.44.0 默认配置](https://github.com/xaoxuu/hexo-theme-stellar/blob/1.44.0/_config.yml)

Stellar 使用 MIT 许可证；主题及依赖的许可证随 npm 包提供。页面底部保留 Hexo / Stellar 署名。个人文章没有预先授予额外的开放许可。
