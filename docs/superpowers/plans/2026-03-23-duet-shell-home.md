# Duet Shell and Home Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前“博客中心型”页面骨架重构为门户壳层，并落地新的个人主页、导航数据入口和 `CV/Portfolio` 占位路由。

**Architecture:** 这一阶段从全站骨架入手，把 `MainGridLayout + SideBar + config.ts` 的耦合拆开，建立 `shell`、`site` 数据查询和首页专用组件树。视觉允许更新，但必须建立在已经完成的内容底座之上，不回退到“首页直接复用博客列表”的结构。

**Tech Stack:** Astro 6, Svelte 5, Tailwind CSS, TypeScript, Astro Content Layer

---

依赖前置计划：

1. [2026-03-23-duet-foundation-content.md](/Users/hhm/code/duet/docs/superpowers/plans/2026-03-23-duet-foundation-content.md)

## Chunk 1: Shell Refactor

### Task 1: 拆分全站配置并建立 site 查询层

**Files:**
- Create: `src/app/config/site.ts`
- Create: `src/domains/site/content/query.ts`
- Create: `tests/unit/domains/site/query.test.ts`
- Modify: `src/config.ts`
- Modify: `src/types/config.ts`

- [ ] **Step 1: 写出失败的 site 查询测试**

```ts
// tests/unit/domains/site/query.test.ts
import { describe, expect, it } from "vitest";
import { mergeSiteConfig } from "@/domains/site/content/query";

describe("mergeSiteConfig", () => {
	it("prefers content entries over baked-in defaults", () => {
		expect(
			mergeSiteConfig(
				{ title: "Duet", subtitle: "Portal" },
				{ title: "Memories Off" },
			).title,
		).toBe("Memories Off");
	});
});
```

- [ ] **Step 2: 运行测试确认 site 查询层尚不存在**

Run: `pnpm vitest run tests/unit/domains/site/query.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现站点配置查询层**

```ts
// src/domains/site/content/query.ts
export function mergeSiteConfig<T extends Record<string, unknown>>(
	defaults: T,
	overrides: Partial<T>,
) {
	return { ...defaults, ...overrides };
}
```

重构要求：

- `src/config.ts` 逐步降级为默认值文件，而不是唯一数据源
- `src/app/config/site.ts` 提供读取站点配置的统一入口
- `src/domains/site/content/query.ts` 负责将 `site` collection 数据合并到默认配置

- [ ] **Step 4: 验证**

Run: `pnpm vitest run tests/unit/domains/site/query.test.ts && pnpm astro check`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/app/config/site.ts src/domains/site/content/query.ts src/config.ts src/types/config.ts tests/unit/domains/site/query.test.ts
git commit -m "refactor: split site config from content query"
```

### Task 2: 建立新的 shell 布局层

**Files:**
- Create: `src/app/shell/SiteShell.astro`
- Create: `src/app/shell/PageContainer.astro`
- Create: `src/app/shell/PortalSidebar.astro`
- Create: `src/app/shell/nav-links.ts`
- Create: `tests/unit/app/shell/nav-links.test.ts`
- Modify: `src/layouts/MainGridLayout.astro`
- Modify: `src/components/Navbar.astro`
- Modify: `src/components/widget/SideBar.astro`

- [ ] **Step 1: 写出失败的导航链接规范测试**

```ts
// tests/unit/app/shell/nav-links.test.ts
import { describe, expect, it } from "vitest";
import { normalizeNavLinks } from "@/app/shell/nav-links";

describe("normalizeNavLinks", () => {
	it("preserves internal links and flags external ones", () => {
		expect(
			normalizeNavLinks([
				{ name: "Home", url: "/" },
				{ name: "GitHub", url: "https://github.com/example" },
			]),
		).toEqual([
			{ name: "Home", url: "/", external: false },
			{ name: "GitHub", url: "https://github.com/example", external: true },
		]);
	});
});
```

- [ ] **Step 2: 运行测试确认 shell helper 尚不存在**

Run: `pnpm vitest run tests/unit/app/shell/nav-links.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现新的 shell 组件树**

要求：

- `SiteShell.astro` 作为全站骨架，只负责导航、容器、页脚与可选侧栏插槽
- `MainGridLayout.astro` 退化为 Blog 专用布局，不能再默认作为全站骨架
- `PortalSidebar.astro` 不直接耦合 Blog 分类与标签
- `Navbar.astro` 从统一的 site 查询入口读导航

最小 helper：

```ts
// src/app/shell/nav-links.ts
export function normalizeNavLinks(
	links: Array<{ name: string; url: string; external?: boolean }>,
) {
	return links.map((link) => ({
		...link,
		external: link.external ?? /^https?:\/\//.test(link.url),
	}));
}
```

- [ ] **Step 4: 验证 shell 重构不破坏 Blog 页面**

Run: `pnpm vitest run tests/unit/app/shell/nav-links.test.ts && pnpm astro check && pnpm build`
Expected: PASS；Blog 页面仍可渲染

- [ ] **Step 5: 提交**

```bash
git add src/app/shell src/layouts/MainGridLayout.astro src/components/Navbar.astro src/components/widget/SideBar.astro tests/unit/app/shell/nav-links.test.ts
git commit -m "refactor: introduce portal shell layout"
```

## Chunk 2: Home and Placeholder Routes

### Task 3: 实现门户首页

**Files:**
- Create: `src/domains/home/components/HomeHero.astro`
- Create: `src/domains/home/components/HomeRouteGrid.astro`
- Create: `src/domains/home/components/HomeProfilePanel.astro`
- Create: `src/domains/home/model.ts`
- Modify: `src/pages/[...page].astro`
- Create: `src/pages/index.astro`
- Create: `tests/unit/domains/home/home-model.test.ts`

- [ ] **Step 1: 写出失败的首页模型测试**

```ts
// tests/unit/domains/home/home-model.test.ts
import { describe, expect, it } from "vitest";
import { buildHomeRouteCards } from "@/domains/home/model";

describe("buildHomeRouteCards", () => {
	it("filters disabled routes", () => {
		expect(
			buildHomeRouteCards([
				{ title: "Blog", href: "/posts/", enabled: true },
				{ title: "CV", href: "/cv/", enabled: false },
			]),
		).toEqual([{ title: "Blog", href: "/posts/", enabled: true }]);
	});
});
```

- [ ] **Step 2: 运行测试确认首页模型尚不存在**

Run: `pnpm vitest run tests/unit/domains/home/home-model.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现首页专用组件**

要求：

- 新建 `src/pages/index.astro`
- 首页不再复用 `src/pages/[...page].astro`
- 首页展示个人信息摘要、Blog / Moments / Projects 的入口卡片
- 不直接输出文章列表

可用的最小模型函数：

```ts
// src/domains/home/model.ts
export function buildHomeRouteCards<T extends { enabled?: boolean }>(items: T[]) {
	return items.filter((item) => item.enabled !== false);
}
```

- [ ] **Step 4: 验证首页切换成功**

Run: `pnpm vitest run tests/unit/domains/home/home-model.test.ts && pnpm build`
Expected: PASS；首页构建产物来自 `src/pages/index.astro`

- [ ] **Step 5: 提交**

```bash
git add src/pages/index.astro src/domains/home tests/unit/domains/home/home-model.test.ts
git commit -m "feat: add portal home page"
```

### Task 4: 增加 `CV` / `Portfolio` 占位路由

**Files:**
- Create: `src/pages/cv.astro`
- Create: `src/pages/portfolio.astro`
- Create: `src/domains/site/components/PlaceholderPage.astro`
- Create: `src/domains/site/placeholders.ts`
- Modify: `src/constants/link-presets.ts`
- Modify: `src/types/config.ts`
- Create: `tests/unit/domains/site/placeholder-routes.test.ts`

- [ ] **Step 1: 写出失败的占位路由测试**

```ts
// tests/unit/domains/site/placeholder-routes.test.ts
import { describe, expect, it } from "vitest";
import { placeholderRouteMeta } from "@/domains/site/placeholders";

describe("placeholderRouteMeta", () => {
	it("marks cv and portfolio as placeholders", () => {
		expect(placeholderRouteMeta.cv.enabled).toBe(false);
		expect(placeholderRouteMeta.portfolio.enabled).toBe(false);
	});
});
```

- [ ] **Step 2: 运行测试确认占位元数据尚不存在**

Run: `pnpm vitest run tests/unit/domains/site/placeholder-routes.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现占位路由**

要求：

- `cv.astro` 与 `portfolio.astro` 使用统一 `PlaceholderPage.astro`
- 页面只说明“该模块尚未上线”，不做正式设计
- 导航中是否展示占位入口，交由 site 数据配置决定，默认关闭

- [ ] **Step 4: 验证占位路由**

Run: `pnpm vitest run tests/unit/domains/site/placeholder-routes.test.ts && pnpm astro check`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/pages/cv.astro src/pages/portfolio.astro src/domains/site/components/PlaceholderPage.astro src/constants/link-presets.ts src/types/config.ts tests/unit/domains/site/placeholder-routes.test.ts
git commit -m "feat: add cv and portfolio placeholders"
```

### Task 5: 进行视觉收口，但不破坏结构边界

**Files:**
- Create: `docs/superpowers/checklists/home-qa.md`
- Modify: `src/styles/main.css`
- Modify: `src/styles/variables.styl`
- Modify: `src/components/Footer.astro`
- Modify: `src/domains/home/components/*.astro`

- [ ] **Step 1: 写出最小视觉验收清单**

创建一个开发检查清单文件：

```md
<!-- docs/superpowers/checklists/home-qa.md -->
- Home 在 390px 宽度下无横向溢出
- Home 在 1280px 宽度下首屏不复用博客列表
- Blog 页面仍保留目录与文章阅读体验
- 导航在移动端和桌面端均可访问
```

- [ ] **Step 2: 执行视觉调整**

要求：

- 保持门户风格与博客风格统一，但首页不能只是“更大号的博客卡片”
- 不改动 `Moments` 权限逻辑
- 不在这个任务里重新设计文章详情页的排版结构

- [ ] **Step 3: 运行构建与手工验收**

Run: `pnpm build`
Expected: PASS；按清单完成手工检查

- [ ] **Step 4: 提交**

```bash
git add src/styles/main.css src/styles/variables.styl src/components/Footer.astro src/domains/home/components docs/superpowers/checklists/home-qa.md
git commit -m "style: refine portal home presentation"
```

## Definition of Done

- 全站存在明确的 `shell` 层
- Blog 专用布局不再充当全站默认布局
- 首页为独立门户页，而不是文章列表页
- `CV` / `Portfolio` 有占位路由但无半成品正式设计
- 导航来源已可从 `site` 数据域统一控制

## Execution Notes

- 先保证结构正确，再做视觉
- 不要在这个计划里返工 `Moments` 的 `SSR` 鉴权链路
- 如首页视觉方案需要更大调整，单独开新 spec，不在本计划里扩 scope
