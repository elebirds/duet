# Duet 私密文章设计文档

- 日期：2026-03-23
- 状态：Draft
- 适用分支：`codex/auth-moments`
- 依赖：
  - [Duet 架构设计文档](./2026-03-23-duet-architecture-design.md)

## 1. 背景

当前 `duet` 已经建立了 `Moments` 的 `public/private` 可见性模型：

- 未登录用户只能看到公开 `Moments`
- allowlist 登录用户可以看到私密 `Moments`
- 私密 `Moments` 不进入 RSS、Pagefind、sitemap 等公开链路

但 `posts` 仍保持传统博客模板的公开静态模型：

- 列表页、详情页、归档页默认按公开静态内容构建
- `draft` 只表达“生产环境不发布”，不表达“已发布但仅作者可见”
- 博客公开链路与受保护内容链路还没有统一

用户已明确确认：`posts` 也需要区分 `public/private`，并采用与 `Moments` 一致的权限语义。

## 2. 目标

1. 为 `posts` 增加 `visibility: "public" | "private"` 内容元数据。
2. 未登录访客只能看到公开文章。
3. allowlist 登录后，访客可以看到私密文章列表与私密文章详情。
4. 私密文章不进入 RSS、sitemap、Pagefind 与任何公开索引链路。
5. 保持 `draft` 与 `private` 两个概念严格分离。

## 3. 非目标

1. 本阶段不实现“私密文章全文搜索”。
2. 本阶段不为 `posts` 增加更细粒度 ACL。
3. 本阶段不为不同文章设置不同 allowlist。
4. 本阶段不引入数据库、会话存储或后台管理界面。
5. 本阶段不扩展为“多用户博客平台”。

## 4. 术语与语义

## 4.1 `draft`

`draft` 的语义保持不变：

- 表示内容仍在编辑中
- 生产环境中对所有人都不可见
- 不因登录态变化而可见

## 4.2 `visibility`

新增字段：

```ts
visibility: "public" | "private"
```

语义如下：

- `public`：可进入公开页面与公开索引
- `private`：仅 allowlist 登录后可见，不进入任何公开索引

## 4.3 访问规则

| 场景 | 匿名访客 | allowlist 登录访客 |
| --- | --- | --- |
| 公开文章列表 | 可见 | 可见 |
| 私密文章列表 | 不可见 | 可见 |
| 公开文章详情 | 可见 | 可见 |
| 私密文章详情 | `404` | 可见 |
| RSS / sitemap / Pagefind | 不包含私密文章 | 仍不包含私密文章 |

这里故意规定“匿名访问私密文章详情返回 `404`”，而不是 `401/403`。原因是第一阶段优先避免向匿名访客暴露“该私密 slug 存在”的事实。

## 5. 核心决策

| 决策项 | 结论 |
| --- | --- |
| 私密文章权限模型 | 复用现有 GitHub OAuth + allowlist 会话 |
| `posts` 路由策略 | 列表、归档、详情统一切到 SSR |
| 公开索引 | 继续只消费 `public-only` 查询结果 |
| 匿名访问私密文章 | 返回 `404` |
| 私密文章搜索 | 第一阶段不支持 |

## 6. 内容契约变更

## 6.1 `posts` schema

在 `blogPostSchema` 中新增：

```ts
visibility: z.enum(["public", "private"]).default("public")
```

推荐作者元数据写法：

```yaml
---
title: Private Note
published: 2026-03-23
visibility: private
draft: false
---
```

## 6.2 向后兼容

- 旧文章未声明 `visibility` 时，默认按 `public` 处理
- 旧文章的公开行为保持不变

## 7. 查询层设计

`posts` 查询应拆成两类，而不是继续只保留“公开博客文章”一种查询。

## 7.1 `public-only` 查询

用途：

- RSS
- sitemap
- Pagefind
- 任何静态公开索引链路

过滤规则：

- `draft !== true`
- `visibility === "public"`

## 7.2 `viewer-aware` 查询

用途：

- 首页分页
- 归档页
- 分类与标签统计
- 文章详情页
- 上一篇 / 下一篇

过滤规则：

- `draft !== true`
- 若 `canViewPrivateContent === false`，只保留 `public`
- 若 `canViewPrivateContent === true`，保留 `public + private`

## 7.3 一致性原则

所有基于文章集合计算出来的派生结果，都必须基于“当前查看者可见集合”生成，包括：

- 首页分页
- 归档列表
- 标签计数
- 分类计数
- 前后篇关系

不能出现“详情页可见，但列表里没有”或“前后篇跳到匿名不可见文章”的不一致状态。

## 8. 路由策略

## 8.1 为什么博客路由要切到 SSR

当前博客页面依赖 `getStaticPaths()` 与公开静态集合，这与“同一路由因登录态不同而展示不同内容”直接冲突。

一旦 `posts` 支持 `private/public`，以下页面都需要根据 `Astro.locals.canViewPrivateContent` 判断：

- 首页分页 `/`
- 归档页 `/archive`
- 文章详情页 `/posts/[slug]`

因此第一阶段推荐把这些博客主路由统一改为 SSR。

这不是为了“动态化整站”，而是为了保持权限边界一致，并避免静态产物预先枚举私密 slug。

## 8.2 路由矩阵

| 路由 | 渲染方式 | 说明 |
| --- | --- | --- |
| `/` | SSR | 依据登录态渲染公开 / 全量可见文章列表 |
| `/archive` | SSR | 依据登录态渲染归档、标签、分类 |
| `/posts/[slug]` | SSR | 私密文章匿名返回 `404` |
| `/moments` | SSR | 保持现有行为 |
| `/rss.xml` | SSG | 仅公开文章 |
| `/sitemap.xml` | SSG | 仅公开文章 |

## 9. 页面行为

## 9.1 首页与归档

- 匿名访客只看到公开文章
- allowlist 登录访客可同时看到公开文章与私密文章
- 私密文章可以在 UI 上增加轻量标识，但第一阶段不是必须

## 9.2 文章详情

- 若 slug 对应公开文章，则正常显示
- 若 slug 对应私密文章且访客未登录，则返回 `404`
- 若 slug 对应私密文章且访客已登录，则正常显示

## 9.3 上一篇 / 下一篇

上一页 / 下一页关系必须基于“当前查看者可见集合”实时计算：

- 匿名用户不应看到指向私密文章的导航
- 登录用户可以在私密文章之间正常跳转

## 10. 公开边界

私密文章在任何公开链路都必须被排除：

1. RSS 不输出私密文章
2. sitemap 不列出私密文章 URL
3. Pagefind 不索引私密文章内容
4. 任何公开页面里的结构化数据、OG、导航聚合都不应泄漏私密 slug

第一阶段尤其要防止两类泄漏：

- 静态构建阶段通过 `getStaticPaths()` 预生成私密详情页
- 搜索与订阅链路从“全量文章集合”错误取数

## 11. 对现有鉴权模型的复用

本设计不新增新的身份模型，而是直接复用已经为 `Moments` 建立的运行时上下文：

- `Astro.locals.viewerSession`
- `Astro.locals.canViewPrivateContent`

也就是说：

- GitHub OAuth 流程不变
- allowlist 来源不变
- cookie 签名模型不变
- 新增的只是 `posts` 对这两个上下文值的消费

## 12. 测试策略

需要增加三类回归测试：

## 12.1 内容契约测试

- `blogPostSchema` 支持 `visibility`
- 默认值为 `public`

## 12.2 查询层测试

- 匿名时私密文章被过滤
- 登录时私密文章可见
- `public-only` 查询不会泄漏私密文章
- 前后篇关系在不同可见性下保持正确

## 12.3 页面与索引契约测试

- 私密文章不会进入 RSS
- 私密文章不会进入静态搜索索引输入
- 匿名访问私密 slug 返回 `404`

## 13. 风险与折中

## 13.1 从 SSG 切到 SSR 的代价

博客列表和详情页不再是纯静态页面，这会牺牲一部分“极致静态站”心智。

但这一代价是可接受的，原因是：

- 只有这样才能保证同一路由的权限语义一致
- 当前项目已经引入 OAuth、middleware 与 `Moments` SSR，站点本身已经不是纯 SSG 产品
- 安全边界比保留旧模板的静态实现更重要

## 13.2 私密全文搜索暂不支持

这是有意为之。第一阶段先把“可见性”和“公开边界”做对，避免为了作者态全文搜索，把私密内容重新暴露给 Pagefind 或静态索引。

如果后续需要“登录后全文搜索私密文章”，应设计独立的服务端搜索通道，而不是复用公开 Pagefind 索引。

## 14. 实施顺序建议

1. 扩展 `posts` schema，补内容契约测试
2. 重构博客查询层为 `public-only` 与 `viewer-aware`
3. 将首页、归档、详情页改为 SSR
4. 改造 RSS / sitemap / Pagefind 只走公开查询
5. 补私密详情匿名 `404` 的路由测试与回归验证

## 15. 完成标准

满足以下条件时，认为私密文章设计完成：

1. `posts` 支持 `visibility: private`
2. 匿名访客看不到私密文章列表和详情
3. allowlist 登录访客能看到私密文章列表和详情
4. 私密文章不进入 RSS、sitemap、Pagefind
5. 博客页面的前后篇、归档、分类、标签统计与当前可见性一致
