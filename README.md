# Duet

Duet 是一个基于 Astro 6 的个人数字门户引擎，目标是把传统博客模板重构为公开引擎与私有内容解耦的双仓库体系。

当前仓库只保留公开引擎与示例内容：

- 渲染层：Astro 6、Svelte 5、Tailwind CSS 4
- 内容层：Astro Content Layer
- 工程契约：Node 24、pnpm 9、Vitest、Biome
- 内容模式：`demo`、`local`、`token`

## 快速开始

1. 运行 `make init`，或直接运行 `./scripts/init.sh`
2. 初始化后检查 `.env.local`，按需填入 GitHub OAuth 与内容来源变量
3. 按需修改 `src/config.ts`
4. 编辑示例内容：
   - 文章在 `src/demo-content/posts/`
   - 站点说明在 `src/demo-content/spec/`
5. 运行 `make dev`，或直接运行 `pnpm dev`

## 本地测试私密内容

如果要测试 GitHub OAuth、`/moments/` 私密内容和后续私密文章，请先：

1. 在 GitHub 创建一个 OAuth App
2. 将回调地址设置为 `http://localhost:4321/auth/callback/`
3. 运行 `make init`，然后编辑 `.env.local`
4. 至少填入：

```sh
DUET_GITHUB_CLIENT_ID=...
DUET_GITHUB_CLIENT_SECRET=...
DUET_SESSION_SECRET=...
DUET_GITHUB_ALLOWLIST=你的_github_login
```

完成后启动开发服务器，访问 `/moments/` 并点击 `Sign in with GitHub` 即可手测登录、私密内容显示和登出链路。

如果要新建文章，运行：

```sh
pnpm new-post my-first-post
```

脚本会在 `src/demo-content/posts/` 下创建 Markdown 文件。

## 内容模式

- `demo`：默认模式，直接使用仓库内的 `src/demo-content/**`
- `local`：设置 `DUET_CONTENT_LOCAL_PATH`
- `token`：同时设置 `DUET_CONTENT_REPO` 与 `CONTENT_REPO_TOKEN`

`content:sync` 目前只提供模式脚手架，不会真正拉取私有仓库。

## 常用命令

| Command | Action |
|:--|:--|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm build` | 生成生产构建 |
| `pnpm preview` | 本地预览构建结果 |
| `pnpm test` | 运行 Vitest |
| `pnpm check` | 运行 Astro 检查 |
| `pnpm format` | 使用 Biome 格式化 `src` |
| `pnpm lint` | 使用 Biome 检查并写回 `src` |
| `pnpm new-post <filename>` | 在 `src/demo-content/posts/` 下创建新文章 |
| `pnpm content:demo` | 生成 demo 内容缓存脚手架 |
| `pnpm content:sync` | 打印当前内容同步模式 |
| `make init` | 初始化 Node / pnpm 依赖并生成 `.env.local` |
| `make verify` | 运行 Biome、Vitest、Astro Check 与完整构建 |

## 部署说明

部署前请先更新 `astro.config.mjs` 里的 `site` 配置，不要保留默认占位值。

## License

MIT
