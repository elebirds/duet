# Duet Foundation and Content Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将仓库升级到 `Astro 6 + Node 24`，建立可测试的内容底座，并把现有 Blog 迁移到新的 `app/domains` 结构且保持公开博客可正常构建。

**Architecture:** 先升级工具链并补上测试基础设施，再引入 `Astro 6 Content Layer`、内容来源模式解析、标准化 demo 内容源和 Blog 域查询层。第一阶段不接私有仓库真实拉取，只先把公开示例内容和标准化接口做对，为后续 `memories-off` 接入与 `Moments` SSR 留接口。

**Tech Stack:** Astro 6, Svelte 5, Tailwind CSS, TypeScript, Zod, Vitest, Pagefind

---

本规格覆盖多个相对独立的子系统，已拆为 3 份计划：

1. 当前文件：基础底座、内容层、Blog 迁移
2. `2026-03-23-duet-auth-moments.md`：鉴权与 `Moments`
3. `2026-03-23-duet-shell-home.md`：门户壳层与首页

## Chunk 1: Toolchain and Test Harness

### Task 1: 建立 Vitest 基础设施

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup/vitest.setup.ts`
- Create: `tests/unit/app/smoke/vitest-smoke.test.ts`
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: 写出失败的测试入口**

```ts
// tests/unit/app/smoke/vitest-smoke.test.ts
import { describe, expect, it } from "vitest";

describe("vitest harness", () => {
	it("runs unit tests in the duet workspace", () => {
		expect(import.meta.env.MODE).toBe("test");
	});
});
```

- [ ] **Step 2: 运行测试确认当前仓库还没有测试基础设施**

Run: `pnpm vitest run tests/unit/app/smoke/vitest-smoke.test.ts`
Expected: FAIL，报错 `Command "vitest" not found` 或缺少配置文件。

- [ ] **Step 3: 以最小实现补齐测试基础设施**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: false,
		setupFiles: ["./tests/setup/vitest.setup.ts"],
		include: ["tests/unit/**/*.test.ts"],
		coverage: {
			provider: "v8",
		},
	},
});
```

```ts
// tests/setup/vitest.setup.ts
process.env.TZ = "UTC";
```

```json
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.2.4",
    "@vitest/coverage-v8": "^3.2.4"
  }
}
```

- [ ] **Step 4: 运行测试确认基础设施可用**

Run: `pnpm vitest run tests/unit/app/smoke/vitest-smoke.test.ts`
Expected: PASS，输出 `1 passed`

- [ ] **Step 5: 提交**

```bash
git add package.json pnpm-lock.yaml tsconfig.json vitest.config.ts tests/setup/vitest.setup.ts tests/unit/app/smoke/vitest-smoke.test.ts
git commit -m "test: add vitest harness"
```

### Task 2: 固化 Node 24 / Astro 6 工具链契约

**Files:**
- Create: `.nvmrc`
- Create: `.node-version`
- Create: `tests/unit/app/toolchain/package-contract.test.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `astro.config.mjs`
- Modify: `README.md`

- [ ] **Step 1: 写出失败的工具链契约测试**

```ts
// tests/unit/app/toolchain/package-contract.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(readFileSync(new URL("../../../../package.json", import.meta.url), "utf8"));

describe("toolchain contract", () => {
	it("pins astro 6 and node 24", () => {
		expect(pkg.dependencies.astro).toMatch(/^6\./);
		expect(pkg.engines.node).toBe(">=24.0.0");
		expect(pkg.packageManager).toMatch(/^pnpm@/);
	});
});
```

- [ ] **Step 2: 运行测试确认契约尚未满足**

Run: `pnpm vitest run tests/unit/app/toolchain/package-contract.test.ts`
Expected: FAIL，`astro` 版本仍为 `5.x`，`engines.node` 还不存在。

- [ ] **Step 3: 升级依赖与运行时声明**

```json
// package.json
{
  "engines": {
    "node": ">=24.0.0"
  },
  "dependencies": {
    "astro": "^6.0.3",
    "@astrojs/check": "^0.10.0",
    "@astrojs/rss": "^5.0.0",
    "@astrojs/sitemap": "^4.0.0",
    "@astrojs/svelte": "^8.0.0",
    "@astrojs/tailwind": "^7.0.0"
  }
}
```

```text
# .nvmrc
24
```

```text
# .node-version
24
```

说明：

- 运行 `pnpm up astro @astrojs/check @astrojs/rss @astrojs/sitemap @astrojs/svelte @astrojs/tailwind`
- 然后运行 `pnpm install`
- 如 Astro 6 升级要求调整 `astro.config.mjs` 或集成初始化顺序，同步修正
- README 的最低环境要求同步更新为 `Node 24`

- [ ] **Step 4: 验证升级后的最小健康度**

Run: `pnpm vitest run tests/unit/app/toolchain/package-contract.test.ts && pnpm astro check`
Expected: PASS；`astro check` 无类型错误

- [ ] **Step 5: 提交**

```bash
git add .nvmrc .node-version package.json pnpm-lock.yaml astro.config.mjs README.md tests/unit/app/toolchain/package-contract.test.ts
git commit -m "chore: upgrade toolchain to astro 6 and node 24"
```

## Chunk 2: Content Layer and Blog Domain

### Task 3: 引入内容来源模式与运行时契约

**Files:**
- Create: `src/app/content/source-mode.ts`
- Create: `tests/unit/app/content/source-mode.test.ts`
- Modify: `src/env.d.ts`
- Modify: `package.json`

- [ ] **Step 1: 写出失败的内容来源解析测试**

```ts
// tests/unit/app/content/source-mode.test.ts
import { describe, expect, it } from "vitest";
import { resolveContentSourceMode } from "@/app/content/source-mode";

describe("resolveContentSourceMode", () => {
	it("defaults to demo mode without private repo env", () => {
		expect(resolveContentSourceMode({})).toEqual({
			mode: "demo",
			localPath: null,
			repo: null,
			token: null,
		});
	});

	it("prefers local mode when local path is provided", () => {
		expect(
			resolveContentSourceMode({
				DUET_CONTENT_LOCAL_PATH: "/tmp/memories-off",
			}),
		).toMatchObject({ mode: "local", localPath: "/tmp/memories-off" });
	});
});
```

- [ ] **Step 2: 运行测试确认实现尚不存在**

Run: `pnpm vitest run tests/unit/app/content/source-mode.test.ts`
Expected: FAIL，报错 `Cannot find module '@/app/content/source-mode'`

- [ ] **Step 3: 实现最小可用的来源模式解析**

```ts
// src/app/content/source-mode.ts
export type ContentSourceMode = "demo" | "token" | "local";

export function resolveContentSourceMode(env: Record<string, string | undefined>) {
	const localPath = env.DUET_CONTENT_LOCAL_PATH ?? null;
	const repo = env.DUET_CONTENT_REPO ?? null;
	const token = env.CONTENT_REPO_TOKEN ?? null;

	if (localPath) {
		return { mode: "local" as const, localPath, repo, token };
	}

	if (repo && token) {
		return { mode: "token" as const, localPath: null, repo, token };
	}

	return { mode: "demo" as const, localPath: null, repo: null, token: null };
}
```

同时在 `src/env.d.ts` 中声明：

```ts
interface ImportMetaEnv {
	readonly DUET_CONTENT_LOCAL_PATH?: string;
	readonly DUET_CONTENT_REPO?: string;
	readonly CONTENT_REPO_TOKEN?: string;
}
```

- [ ] **Step 4: 验证契约**

Run: `pnpm vitest run tests/unit/app/content/source-mode.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/app/content/source-mode.ts src/env.d.ts tests/unit/app/content/source-mode.test.ts package.json
git commit -m "feat: add content source mode contract"
```

### Task 4: 迁移到 Astro 6 Content Layer，并提供 demo loader

**Files:**
- Create: `src/content.config.ts`
- Create: `src/app/content/contracts.ts`
- Create: `src/app/content/loaders/demo-site-loader.ts`
- Create: `src/app/content/loaders/demo-posts-loader.ts`
- Create: `src/app/content/loaders/demo-moments-loader.ts`
- Create: `tests/unit/app/content/demo-loader.test.ts`
- Delete: `src/content/config.ts`

- [ ] **Step 1: 写出失败的 demo loader 测试**

```ts
// tests/unit/app/content/demo-loader.test.ts
import { describe, expect, it } from "vitest";
import { loadDemoSiteEntries } from "@/app/content/loaders/demo-site-loader";

describe("demo site loader", () => {
	it("returns home and profile entries", async () => {
		const entries = await loadDemoSiteEntries();
		expect(entries.map((entry) => entry.id).sort()).toEqual(["home", "profile"]);
	});
});
```

- [ ] **Step 2: 运行测试确认 loader 尚不存在**

Run: `pnpm vitest run tests/unit/app/content/demo-loader.test.ts`
Expected: FAIL，报错缺少 loader 模块

- [ ] **Step 3: 创建 Content Layer 契约与 demo loader**

```ts
// src/app/content/contracts.ts
import { z } from "astro:content";

export const siteProfileSchema = z.object({
	name: z.string(),
	bio: z.string().default(""),
	avatar: z.string().default(""),
	links: z.array(
		z.object({
			name: z.string(),
			url: z.string().url(),
			icon: z.string(),
		}),
	),
});

export const siteHomeSchema = z.object({
	headline: z.string(),
	intro: z.string(),
	featuredRoutes: z.array(
		z.object({
			title: z.string(),
			href: z.string(),
			description: z.string(),
		}),
	),
});
```

```ts
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { loadDemoPostsEntries } from "@/app/content/loaders/demo-posts-loader";
import { loadDemoSiteEntries } from "@/app/content/loaders/demo-site-loader";
import { loadDemoMomentsEntries } from "@/app/content/loaders/demo-moments-loader";

const posts = defineCollection({
	loader: loadDemoPostsEntries,
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().default(false),
		description: z.string().default(""),
		image: z.string().default(""),
		tags: z.array(z.string()).default([]),
		category: z.string().nullable().default(""),
		lang: z.string().default(""),
	}),
});

export const collections = {
	posts,
	site: defineCollection({ loader: loadDemoSiteEntries, schema: ({ id }) => (id === "profile" ? siteProfileSchema : siteHomeSchema) }),
	moments: defineCollection({
		loader: loadDemoMomentsEntries,
		schema: z.object({
			published: z.date(),
			visibility: z.enum(["public", "private"]).default("public"),
			lang: z.string().default(""),
			summary: z.string().default(""),
		}),
	}),
};
```

loader 的第一版可以直接从当前 `src/content/posts/**` 与内置对象数组读取，目标是先打通 `Content Layer`，不要在这个任务里接真实私仓。

- [ ] **Step 4: 验证 loader 工作正常**

Run: `pnpm vitest run tests/unit/app/content/demo-loader.test.ts && pnpm astro check`
Expected: PASS，且 `astro check` 不再引用旧的 `src/content/config.ts`

- [ ] **Step 5: 提交**

```bash
git add src/content.config.ts src/app/content/contracts.ts src/app/content/loaders tests/unit/app/content/demo-loader.test.ts
git rm src/content/config.ts
git commit -m "feat: migrate to astro content layer"
```

### Task 5: 建立 Blog 域查询层并迁移现有页面

**Files:**
- Create: `src/domains/blog/content/query.ts`
- Create: `tests/unit/domains/blog/query.test.ts`
- Modify: `src/pages/[...page].astro`
- Modify: `src/pages/archive.astro`
- Modify: `src/pages/posts/[...slug].astro`
- Modify: `src/pages/rss.xml.ts`
- Modify: `src/components/PostPage.astro`
- Modify: `src/utils/url-utils.ts`
- Delete: `src/utils/content-utils.ts`

- [ ] **Step 1: 写出失败的 Blog 查询测试**

```ts
// tests/unit/domains/blog/query.test.ts
import { describe, expect, it } from "vitest";
import { attachAdjacentPosts } from "@/domains/blog/content/query";

describe("attachAdjacentPosts", () => {
	it("fills next and previous titles in descending date order", () => {
		const entries = [
			{ slug: "new", data: { title: "New", published: new Date("2026-03-02") } },
			{ slug: "old", data: { title: "Old", published: new Date("2026-03-01") } },
		] as const;

		const result = attachAdjacentPosts([...entries]);
		expect(result[0].data.prevSlug).toBe("old");
		expect(result[1].data.nextSlug).toBe("new");
	});
});
```

- [ ] **Step 2: 运行测试确认新查询层尚不存在**

Run: `pnpm vitest run tests/unit/domains/blog/query.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现域内查询层并替换旧工具**

```ts
// src/domains/blog/content/query.ts
import { getCollection, type CollectionEntry } from "astro:content";

export type BlogListEntry = CollectionEntry<"posts">;

export function attachAdjacentPosts(entries: BlogListEntry[]) {
	for (let i = 1; i < entries.length; i++) {
		entries[i].data.nextSlug = entries[i - 1].slug;
		entries[i].data.nextTitle = entries[i - 1].data.title;
	}

	for (let i = 0; i < entries.length - 1; i++) {
		entries[i].data.prevSlug = entries[i + 1].slug;
		entries[i].data.prevTitle = entries[i + 1].data.title;
	}

	return entries;
}

export async function getPublishedBlogPosts() {
	const posts = await getCollection("posts", ({ data }) => import.meta.env.DEV || data.draft !== true);
	const sorted = posts.sort((a, b) => Number(b.data.published) - Number(a.data.published));
	return attachAdjacentPosts(sorted);
}
```

页面迁移要求：

- `src/pages/[...page].astro` 改为从 `@/domains/blog/content/query` 取分页数据
- `src/pages/archive.astro` 改为从域查询层读取文章列表
- `src/pages/posts/[...slug].astro` 改为从域查询层读取详情列表
- `src/pages/rss.xml.ts` 只依赖域查询层
- 删除 `src/utils/content-utils.ts`

- [ ] **Step 4: 验证 Blog 迁移不破坏现有构建**

Run: `pnpm vitest run tests/unit/domains/blog/query.test.ts && pnpm astro check && pnpm build`
Expected: PASS；首页、归档、文章详情和 RSS 均能构建

- [ ] **Step 5: 提交**

```bash
git add src/domains/blog/content/query.ts src/pages/[...page].astro src/pages/archive.astro src/pages/posts/[...slug].astro src/pages/rss.xml.ts src/components/PostPage.astro src/utils/url-utils.ts tests/unit/domains/blog/query.test.ts
git rm src/utils/content-utils.ts
git commit -m "refactor: move blog content logic into domain layer"
```

### Task 6: 建立标准化内容脚本骨架

**Files:**
- Create: `scripts/content/build-demo-content.mjs`
- Create: `scripts/content/sync-private-content.mjs`
- Create: `tests/unit/app/content/manifest-contract.test.ts`
- Modify: `package.json`

- [ ] **Step 1: 写出失败的 manifest 契约测试**

```ts
// tests/unit/app/content/manifest-contract.test.ts
import { describe, expect, it } from "vitest";
import { buildPublicManifest } from "@/app/content/loaders/demo-posts-loader";

describe("public manifest", () => {
	it("does not include private entries", async () => {
		const manifest = await buildPublicManifest([
			{ id: "public-1", visibility: "public" },
			{ id: "private-1", visibility: "private" },
		]);

		expect(manifest.map((item) => item.id)).toEqual(["public-1"]);
	});
});
```

- [ ] **Step 2: 运行测试确认 manifest helper 尚不存在**

Run: `pnpm vitest run tests/unit/app/content/manifest-contract.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现脚本骨架和最小 helper**

```json
// package.json
{
  "scripts": {
    "content:demo": "node scripts/content/build-demo-content.mjs",
    "content:sync": "node scripts/content/sync-private-content.mjs"
  }
}
```

```js
// scripts/content/build-demo-content.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outDir = resolve(".duet/content");
await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "README.txt"), "demo content cache\n");
```

```js
// scripts/content/sync-private-content.mjs
const mode = process.env.DUET_CONTENT_LOCAL_PATH ? "local" : process.env.CONTENT_REPO_TOKEN ? "token" : "demo";
console.log(`[duet] content sync mode: ${mode}`);
```

注意：这个任务只建脚手架，不接 GitHub API。真实私仓同步放到后续实现中补全。

- [ ] **Step 4: 验证脚本和测试**

Run: `pnpm vitest run tests/unit/app/content/manifest-contract.test.ts && pnpm content:demo && pnpm content:sync`
Expected: PASS；生成 `.duet/content/README.txt`；`content:sync` 打印当前模式

- [ ] **Step 5: 提交**

```bash
git add package.json scripts/content/build-demo-content.mjs scripts/content/sync-private-content.mjs tests/unit/app/content/manifest-contract.test.ts
git commit -m "feat: add content manifest script scaffolds"
```

## Definition of Done

- `pnpm test`
- `pnpm astro check`
- `pnpm build`
- 公开 Blog 页面与 RSS 能正常构建
- 仓库已切到 `Astro 6 + Node 24`
- `Content Layer` 已替换旧的 `src/content/config.ts`
- Blog 内容查询已从 `src/utils/content-utils.ts` 迁移到 `src/domains/blog/content/query.ts`

## Execution Notes

- 不要在本计划里引入真实 OAuth、`Moments` SSR 或首页视觉重做
- 不要在本计划里直接依赖 Vercel Edge Runtime
- 如果 `astro build` 因集成包版本差异失败，优先修正版本组合，不要绕过错误

## Next Plan

完成本计划后，继续执行 [2026-03-23-duet-auth-moments.md](/Users/hhm/code/duet/docs/superpowers/plans/2026-03-23-duet-auth-moments.md)。
