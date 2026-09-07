# Sjeary 的个人网站

使用 Hexo 8.1.2 与 Stellar 2.0.0-rc.1，包含独立主页、个人介绍和博客。主题版本与用户指定的 Stellar 官网展示页一致。内容通过 Markdown 维护，主题通过 npm 安装并锁定版本。主题源码保持原样。

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
| 文章图示 | `source/assets/posts/` |
| 博客原始 PDF 材料 | `source/downloads/research-notes/` |
| 网站名称、域名、时区 | `_config.yml` |
| 导航、主题颜色、侧栏布局 | `_config.stellar.yml` |
| 原生星空封面与个人页面目录 | `source/_data/wiki/sjeary.yml` |
| 最近更新数量 | `source/_data/widgets.yml` |
| 封面按钮文案 | `scripts/labels.js`（仅通过 Hexo 多语言接口替换文字） |
| 昵称头像 | `source/assets/avatar.svg` |

主页和个人介绍已根据已有简历及 GitHub 个人介绍整理，包含教育背景、TGAC 2025 竞赛、开源项目和技术兴趣。联系入口使用 GitHub。更新个人经历时同步检查主页摘要与“关于我”正文。

博客迁入了 [Research-Notes](https://github.com/Sjeary/Research-Notes) 中的四篇学习笔记与技术分享，保留原始日期、参考资料及五份未经修改的 PDF：

| 日期 | 文章 | 分类 | 附件 |
| --- | --- | --- | --- |
| 2026-05-28 | 3D Gaussian Splatting：从三维高斯到可微渲染 | 3D 视觉 | 87 页分享材料 |
| 2025-12-04 | JiT：理解大 Patch 像素空间 DiT | 扩散模型 | 95 页分享材料 |
| 2025-08-21 | FACM：用瞬时速度稳定一致性模型 | 扩散模型 | 48 页理论基础、35 页论文阅读 |
| 2025-07-17 | 扩散模型、SDE 与 Flow 基础 | 扩散模型 | 4 页学习笔记 |

四篇文章已整理成可直接阅读的 Markdown 正文，包含分节讲解、LaTeX 推导、实验表、代码或伪代码及参考资料。3DGS 的 8 张图示从原报告提取，放在对应章节并保留页码与来源；原 PDF 继续作为附件提供。文章区分论文结果、个人分析和补充推导，避免把引用结果写成个人复现实验。

`date` 保留材料原始整理日期，`updated` 记录网页正文的修订日期。学习材料的原作者署名和 LLM 辅助整理说明保留在对应文章中。主页的文章入口为手动精选，发布新文章后可同步更新；侧栏最近更新、博客列表、分类、标签、归档及本地搜索由主题生成。

新增文章：

```sh
npm run new:post -- "文章标题"
```

在生成的 Markdown 文件中填写 `title`、`date`、`description`、`categories` 和 `tags`。文章正文写在第二行 `---` 分隔线之后。时区在 `_config.yml` 中设置；未来时间的文章不会提前发布。暂不发布的文章可放在 `source/_drafts/`。

技术文章支持标准 LaTeX 数学语法：行内使用 `$x_t$`，独立公式使用各占一行的 `$$` 包围公式；代码块里的 `$` 保持原样。`scripts/math.js` 通过 Hexo 的官方扩展接口接入 `marked-katex-extension`，构建时生成 KaTeX HTML / MathML，样式和窄屏公式滚动使用 Stellar 自带支持。无效公式会使构建失败，避免带着错误公式发布。运行 `node --test test/math.test.cjs` 检查公式渲染。

本地搜索摘要将渲染公式显示为 `［公式］`，避免混入重复字符和 LaTeX 源码；完整公式保留在文章正文。`scripts/search-math.js` 在构建后只处理搜索索引，并复用固定版本 Stellar 的章节索引工具重新计算跳转位置。升级主题时运行 `node --test test/search-math.test.cjs` 核对摘要、元数据和章节锚点。

文章图片使用站内绝对路径，例如 `![图片说明](/assets/posts/3d-gaussian-splatting/pipeline.png)`；新增图片时在图下注明出处。普通 Markdown 图片已接入 Stellar 自带的灯箱，点击即可放大查看，关闭后回到原阅读位置，无需改写成主题专用标签。正文代码区分可运行片段和流程伪代码，涉及模型训练的代码仍需对应依赖、数据与实验验证。

## 页面结构

- `/`：个人主页。
- `/about/`：个人介绍。
- `/blog/`：文章列表。
- `/blog/YYYY/MM/文章名/`：文章。
- 分类、标签与归档页由 Hexo / Stellar 生成。

主页和博客列表是不同页面。`index_generator.path: blog` 负责博客列表，`source/index.md` 的 `permalink: /` 负责根路径主页，请保留该设置。侧栏使用主题自带的最近更新组件。

主页直接启用 Stellar 自带的 Wiki Hero 和 Galaxy 星空效果，个人介绍复用同一套原生内容布局；博客使用主题自带的列表与文章模板。配色、导航、目录、卡片和字体配置对照官网展示页，未修改主题 UI 模板、CSS 或浏览器交互。日常编辑 Markdown 后刷新浏览器即可查看。

较窄的窗口会触发 Stellar 原生移动布局，侧栏收进菜单。

## 构建与上线

```sh
npm run build
```

构建结果在 `public/`，可以部署到 GitHub Pages、Cloudflare Pages 或其他静态托管服务。当前项目没有设置任何远程仓库，也不会自动发布或修改 DNS。

绑定 `sjeary.com` 时，先在选定的托管平台添加自定义域名，再按该平台给出的要求修改 DNS 记录并启用 HTTPS。将 `www.sjeary.com` 重定向到主域名。不要删除不相关的邮箱或子域名记录。

如果选用 GitHub Pages，需先确定目标 GitHub 仓库，在仓库中配置 Pages 的构建发布流程。自定义域名填 `sjeary.com`，DNS 记录按 [GitHub 官方说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) 配置。

## 主题说明

本项目固定使用官网展示页标注的 `2.0.0-rc.1` 候选版本。配置已迁移到 v2 格式。可用 `npx hexo stellar doctor` 检查配置，升级时先核对对应版本的文档，在本地确认后再上线。

- [Hexo 文档](https://hexo.io/zh-cn/docs/)
- [Stellar 文档](https://xaoxuu.com/wiki/stellar/)
- [Stellar 2.0.0-rc.1 默认配置](https://github.com/xaoxuu/hexo-theme-stellar/blob/2.0.0-rc.1/_config.yml)

Stellar 使用 MIT 许可证；主题及依赖的许可证随 npm 包提供。页面底部保留 Hexo / Stellar 署名。个人文章没有预先授予额外的开放许可。
