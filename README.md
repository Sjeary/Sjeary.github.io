# Sjeary 的个人主页与技术博客

网站使用 Hexo 和 Stellar，正式域名为 [sjeary.com](https://sjeary.com)。

## 编辑和预览

日常维护的源码位于 `site/`，文章位于 `site/source/_posts/`。

```sh
cd site
npm ci --ignore-scripts
npm run dev
```

详细内容结构、公式和图片说明见 [维护指南](site/README.md)。仓库根目录中的旧 HTML、资源文件和 2022 年页面保留用于查阅；当前网站只发布 `site/public/` 的构建结果。

## 发布

推送到 `master` 后，GitHub Actions 使用 Node.js 24 安装锁定的依赖、构建网站并部署到 GitHub Pages。`.github/workflows/deploy-pages.yml` 管理发布流程。旧站历史与新版博客的开发历史均保留。

Pages 的发布来源应设为 **GitHub Actions**，自定义域名设为 **sjeary.com**。使用 Actions 时，仓库根目录的旧 `CNAME` 文件不会自动绑定域名，需要在 Pages 设置中保存域名。

域名 DNS 由 Squarespace 管理时，把根域名 `@` 的 A 记录指向：

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

`www` 使用 CNAME 指向 `sjeary.github.io`。替换与网站冲突的旧 A/CNAME 记录，保留其他服务的记录。完成域名验证和证书签发后，在 Pages 设置中启用 **Enforce HTTPS**。

参考：[GitHub Pages 自定义域名文档](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。
