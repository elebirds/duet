# Duet Private Posts Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `duet` 的博客文章增加 `public/private` 可见性，并让列表、归档、详情、侧栏统计与公开索引链路都遵守同一套 private-first 权限语义。

**Architecture:** 这一阶段不引入新身份模型，而是复用现有 `Astro.locals.canViewPrivateContent`、GitHub OAuth 与 signed cookie。实现上拆成三层：内容契约、viewer-aware 查询层、SSR 博客路由；公开链路继续只消费 `public-only` 查询结果，避免泄漏私密 slug。

**Tech Stack:** Astro 6, Astro Content Collections, TypeScript, Vitest

---

依赖前置文档：

1. [2026-03-23-duet-private-posts-design.md](../specs/2026-03-23-duet-private-posts-design.md)

## Chunk 1: Contracts and Query Layer

### Task 1: 为 posts 增加 visibility 契约

**Files:**
- Modify: `src/app/content/contracts.ts`
- Modify: `tests/unit/app/content/demo-loader.test.ts`
- Create: `tests/unit/domains/blog/visibility-contract.test.ts`

- [ ] **Step 1: 写出失败的内容契约测试**

```ts
// tests/unit/domains/blog/visibility-contract.test.ts
import { describe, expect, it } from "vitest";
import { blogPostSchema } from "../../../../src/app/content/contracts";

describe("blog post visibility contract", () => {
	it("defaults visibility to public", () => {
		const parsed = blogPostSchema.parse({
			title: "Private-first",
			published: "2026-03-23",
		});

		expect(parsed.visibility).toBe("public");
	});
});
```

- [ ] **Step 2: 运行测试确认 schema 还不支持 visibility**

Run: `pnpm vitest run tests/unit/domains/blog/visibility-contract.test.ts`
Expected: FAIL with missing `visibility`

- [ ] **Step 3: 为 blogPostSchema 增加 visibility 字段**

```ts
visibility: z.enum(["public", "private"]).default("public")
```

要求：

- 只给 `posts` 增加 `visibility`
- 不改变 `draft` 语义
- 旧文章未声明时默认视为 `public`

- [ ] **Step 4: 更新 demo loader 契约测试**

要求：

- 在 `tests/unit/app/content/demo-loader.test.ts` 中验证 demo posts 的 `visibility` 默认值仍为 `public`
- 不要求立刻新增 demo 私密文章内容文件

- [ ] **Step 5: 验证**

Run: `pnpm vitest run tests/unit/domains/blog/visibility-contract.test.ts tests/unit/app/content/demo-loader.test.ts`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/app/content/contracts.ts tests/unit/app/content/demo-loader.test.ts tests/unit/domains/blog/visibility-contract.test.ts
git commit -m "feat: add blog visibility contract"
```

### Task 2: 建立 public-only 与 viewer-aware 查询层

**Files:**
- Modify: `src/domains/blog/content/query.ts`
- Modify: `tests/unit/domains/blog/query.test.ts`
- Create: `tests/unit/domains/blog/public-index-query.test.ts`

- [ ] **Step 1: 写出失败的查询层测试**

```ts
// tests/unit/domains/blog/public-index-query.test.ts
import { describe, expect, it } from "vitest";
import {
	filterIndexableBlogPosts,
	filterVisibleBlogPosts,
} from "../../../../src/domains/blog/content/query";

describe("filterVisibleBlogPosts", () => {
	it("hides private posts from anonymous viewers", () => {
		const entries = [
			{ id: "public", data: { draft: false, visibility: "public" as const } },
			{ id: "private", data: { draft: false, visibility: "private" as const } },
		];

		expect(filterVisibleBlogPosts(entries, false).map((entry) => entry.id)).toEqual(["public"]);
	});
});

describe("filterIndexableBlogPosts", () => {
	it("drops private and draft posts from public outputs", () => {
		const entries = [
			{ id: "public", data: { draft: false, visibility: "public" as const } },
			{ id: "private", data: { draft: false, visibility: "private" as const } },
			{ id: "draft", data: { draft: true, visibility: "public" as const } },
		];

		expect(filterIndexableBlogPosts(entries).map((entry) => entry.id)).toEqual(["public"]);
	});
});
```

- [ ] **Step 2: 运行测试确认新的 helper 尚不存在**

Run: `pnpm vitest run tests/unit/domains/blog/query.test.ts tests/unit/domains/blog/public-index-query.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现可见性查询 helper**

最小目标：

```ts
export function filterVisibleBlogPosts<T extends { data: { draft?: boolean; visibility: "public" | "private" } }>(
	entries: T[],
	canViewPrivateContent: boolean,
) {
	return entries.filter((entry) => {
		if (entry.data.draft === true) {
			return !import.meta.env.PROD;
		}

		return canViewPrivateContent || entry.data.visibility === "public";
	});
}

export function filterIndexableBlogPosts<T extends { data: { draft?: boolean; visibility: "public" | "private" } }>(
	entries: T[],
) {
	return entries.filter(
		(entry) => entry.data.draft !== true && entry.data.visibility === "public",
	);
}
```

要求：

- 保留 `attachAdjacentPosts`
- 新增面向 SSR 的查询：
  - `getVisibleBlogPosts(canViewPrivateContent: boolean)`
  - `getVisibleBlogPostList(canViewPrivateContent: boolean)`
  - `getVisibleBlogTagList(canViewPrivateContent: boolean)`
  - `getVisibleBlogCategoryList(canViewPrivateContent: boolean)`
- 新增面向公开链路的查询：
  - `getIndexableBlogPosts()`
- 前后篇关系必须基于当前 viewer 可见集合计算

- [ ] **Step 4: 验证**

Run: `pnpm vitest run tests/unit/domains/blog/query.test.ts tests/unit/domains/blog/public-index-query.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/domains/blog/content/query.ts tests/unit/domains/blog/query.test.ts tests/unit/domains/blog/public-index-query.test.ts
git commit -m "refactor: add viewer-aware blog queries"
```

## Chunk 2: Blog SSR Routes

### Task 3: 将首页分页与归档切到 SSR 可见集合

**Files:**
- Modify: `src/pages/[...page].astro`
- Modify: `src/pages/archive.astro`
- Modify: `src/components/widget/Tags.astro`
- Modify: `src/components/widget/Categories.astro`
- Create: `tests/unit/app/blog/sidebar-query-contract.test.ts`

- [ ] **Step 1: 写出失败的侧栏契约测试**

```ts
// tests/unit/app/blog/sidebar-query-contract.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tagsSource = readFileSync(
	new URL("../../../../src/components/widget/Tags.astro", import.meta.url),
	"utf8",
);
const categoriesSource = readFileSync(
	new URL("../../../../src/components/widget/Categories.astro", import.meta.url),
	"utf8",
);

describe("blog sidebar query contract", () => {
	it("uses viewer-aware query helpers", () => {
		expect(tagsSource).toContain("getVisibleBlogTagList");
		expect(categoriesSource).toContain("getVisibleBlogCategoryList");
	});
});
```

- [ ] **Step 2: 运行测试确认侧栏仍走旧查询**

Run: `pnpm vitest run tests/unit/app/blog/sidebar-query-contract.test.ts`
Expected: FAIL

- [ ] **Step 3: 改造首页分页、归档、标签、分类**

要求：

- `src/pages/[...page].astro` 移除 `getStaticPaths()`，改成 SSR
- 首页分页从 `Astro.url` 读取页码，并根据 `Astro.locals.canViewPrivateContent` 选择可见集合
- `src/pages/archive.astro` 使用 `getVisibleBlogPostList(Astro.locals.canViewPrivateContent === true)`
- `Tags.astro` 与 `Categories.astro` 必须读取 viewer-aware 查询 helper
- 匿名用户不能从侧栏计数推断出私密文章数量

- [ ] **Step 4: 验证**

Run: `pnpm vitest run tests/unit/app/blog/sidebar-query-contract.test.ts && pnpm astro check`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/pages/[...page].astro src/pages/archive.astro src/components/widget/Tags.astro src/components/widget/Categories.astro tests/unit/app/blog/sidebar-query-contract.test.ts
git commit -m "refactor: switch blog list views to SSR visibility"
```

### Task 4: 将文章详情切到 SSR 并实现匿名 404

**Files:**
- Modify: `src/pages/posts/[...slug].astro`
- Create: `tests/unit/app/blog/post-detail-route-contract.test.ts`

- [ ] **Step 1: 写出失败的详情页契约测试**

```ts
// tests/unit/app/blog/post-detail-route-contract.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
	new URL("../../../../src/pages/posts/[...slug].astro", import.meta.url),
	"utf8",
);

describe("blog post detail route contract", () => {
	it("does not use getStaticPaths and checks viewer visibility", () => {
		expect(source).not.toContain("getStaticPaths");
		expect(source).toContain("Astro.locals.canViewPrivateContent");
		expect(source).toContain("Astro.redirect");
	});
});
```

- [ ] **Step 2: 运行测试确认详情页仍是静态路由**

Run: `pnpm vitest run tests/unit/app/blog/post-detail-route-contract.test.ts`
Expected: FAIL

- [ ] **Step 3: 将详情页改为 SSR**

要求：

- 移除 `getStaticPaths()`
- 根据 `Astro.params.slug` 从 viewer-aware 集合查找文章
- 未找到时返回 `404`
- 私密文章对匿名访问者必须表现为 `404`
- 前后篇关系必须基于当前 viewer 可见集合
- 保持现有 `jsonLd`、封面图、目录、版权信息

- [ ] **Step 4: 验证**

Run: `pnpm vitest run tests/unit/app/blog/post-detail-route-contract.test.ts && pnpm astro check`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/pages/posts/[...slug].astro tests/unit/app/blog/post-detail-route-contract.test.ts
git commit -m "refactor: switch blog detail route to SSR"
```

## Chunk 3: Public Index Boundaries

### Task 5: 让 RSS 与公开索引只消费 public-only 查询

**Files:**
- Modify: `src/pages/rss.xml.ts`
- Modify: `tests/unit/app/content/public-index-contract.test.ts`
- Create: `tests/unit/app/blog/rss-contract.test.ts`

- [ ] **Step 1: 写出失败的 RSS 契约测试**

```ts
// tests/unit/app/blog/rss-contract.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
	new URL("../../../../src/pages/rss.xml.ts", import.meta.url),
	"utf8",
);

describe("rss contract", () => {
	it("uses public-only blog queries", () => {
		expect(source).toContain("getIndexableBlogPosts");
		expect(source).not.toContain("getPublishedBlogPosts");
	});
});
```

- [ ] **Step 2: 运行测试确认 RSS 仍使用旧查询**

Run: `pnpm vitest run tests/unit/app/blog/rss-contract.test.ts`
Expected: FAIL

- [ ] **Step 3: 调整公开链路**

要求：

- `src/pages/rss.xml.ts` 改用 `getIndexableBlogPosts()`
- `tests/unit/app/content/public-index-contract.test.ts` 同时验证 blog 私密内容不进入公开索引 helper
- 不为私密文章生成任何 RSS item

- [ ] **Step 4: 验证**

Run: `pnpm vitest run tests/unit/app/blog/rss-contract.test.ts tests/unit/app/content/public-index-contract.test.ts && pnpm build`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/pages/rss.xml.ts tests/unit/app/blog/rss-contract.test.ts tests/unit/app/content/public-index-contract.test.ts
git commit -m "fix: exclude private blog posts from public outputs"
```

## Completion Criteria

- [ ] `posts` schema 支持 `visibility: "public" | "private"`
- [ ] 首页分页、归档、详情都依据 `Astro.locals.canViewPrivateContent` 渲染
- [ ] 匿名访问私密文章详情返回 `404`
- [ ] `Tags` / `Categories` 不泄漏私密文章统计
- [ ] RSS 与公开索引不包含私密文章
- [ ] `pnpm vitest run`
- [ ] `pnpm astro check`
- [ ] `pnpm build`
