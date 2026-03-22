# Duet Auth and Moments Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `duet` 增加 GitHub OAuth + allowlist 会话能力，并落地 `Moments` 的 `SSR` 路由与 `public/private` 内容过滤。

**Architecture:** 这一阶段建立身份提供者抽象、会话判定层和 `Moments` 业务域。`/moments` 路由整体采用 `SSR`，未登录只读公开动态，登录且命中 allowlist 后再暴露私密动态。公开索引链路持续只消费 `public manifest`。

**Tech Stack:** Astro 6 Middleware, Astro SSR, TypeScript, Zod, GitHub OAuth, Vitest

---

依赖前置计划：

1. [2026-03-23-duet-foundation-content.md](/Users/hhm/code/duet/docs/superpowers/plans/2026-03-23-duet-foundation-content.md)

## Chunk 1: Auth Contracts and Session Plumbing

### Task 1: 建立 allowlist 与会话判定契约

**Files:**
- Create: `src/app/auth/allowlist.ts`
- Create: `src/app/auth/session.ts`
- Create: `tests/unit/app/auth/session.test.ts`
- Modify: `src/env.d.ts`

- [ ] **Step 1: 写出失败的会话判定测试**

```ts
// tests/unit/app/auth/session.test.ts
import { describe, expect, it } from "vitest";
import { canViewPrivateContent } from "@/app/auth/session";

describe("canViewPrivateContent", () => {
	it("rejects anonymous sessions", () => {
		expect(canViewPrivateContent(null, ["hhm"])).toBe(false);
	});

	it("accepts allowlisted github login", () => {
		expect(
			canViewPrivateContent(
				{ provider: "github", login: "hhm" },
				["hhm"],
			),
		).toBe(true);
	});
});
```

- [ ] **Step 2: 运行测试确认鉴权模块尚不存在**

Run: `pnpm vitest run tests/unit/app/auth/session.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 allowlist 与会话判定**

```ts
// src/app/auth/session.ts
export type ViewerSession = {
	provider: "github";
	login: string;
	name?: string;
} | null;

export function canViewPrivateContent(
	session: ViewerSession,
	allowlist: string[],
) {
	if (!session) return false;
	return allowlist.includes(session.login);
}
```

```ts
// src/app/auth/allowlist.ts
export function getPrivateViewerAllowlist(env: Record<string, string | undefined>) {
	return (env.DUET_GITHUB_ALLOWLIST ?? "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}
```

- [ ] **Step 4: 验证契约**

Run: `pnpm vitest run tests/unit/app/auth/session.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/app/auth/allowlist.ts src/app/auth/session.ts src/env.d.ts tests/unit/app/auth/session.test.ts
git commit -m "feat: add auth session contract"
```

### Task 2: 接入 Astro middleware 会话上下文

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/auth/cookies.ts`
- Create: `src/types/astro.d.ts`
- Create: `tests/unit/app/auth/cookies.test.ts`

- [ ] **Step 1: 写出失败的 cookie 编解码测试**

```ts
// tests/unit/app/auth/cookies.test.ts
import { describe, expect, it } from "vitest";
import { encodeViewerSession, decodeViewerSession } from "@/app/auth/cookies";

describe("viewer session cookie", () => {
	it("round-trips github login", () => {
		const encoded = encodeViewerSession({ provider: "github", login: "hhm" });
		expect(decodeViewerSession(encoded)).toMatchObject({ login: "hhm" });
	});
});
```

- [ ] **Step 2: 运行测试确认 cookie helper 尚不存在**

Run: `pnpm vitest run tests/unit/app/auth/cookies.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 cookie helper 与 middleware**

```ts
// src/app/auth/cookies.ts
import { Buffer } from "node:buffer";
import type { ViewerSession } from "@/app/auth/session";

export function encodeViewerSession(session: Exclude<ViewerSession, null>) {
	return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function decodeViewerSession(raw: string | undefined): ViewerSession {
	if (!raw) return null;
	try {
		return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
	} catch {
		return null;
	}
}
```

```ts
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { decodeViewerSession } from "@/app/auth/cookies";
import { getPrivateViewerAllowlist } from "@/app/auth/allowlist";
import { canViewPrivateContent } from "@/app/auth/session";

export const onRequest = defineMiddleware(async (context, next) => {
	const session = decodeViewerSession(context.cookies.get("duet_viewer")?.value);
	const allowlist = getPrivateViewerAllowlist(import.meta.env);

	context.locals.viewerSession = session;
	context.locals.canViewPrivateContent = canViewPrivateContent(session, allowlist);

	return next();
});
```

- [ ] **Step 4: 验证基础会话能力**

Run: `pnpm vitest run tests/unit/app/auth/cookies.test.ts && pnpm astro check`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/middleware.ts src/app/auth/cookies.ts src/types/astro.d.ts tests/unit/app/auth/cookies.test.ts
git commit -m "feat: add viewer session middleware"
```

## Chunk 2: GitHub OAuth and Moments SSR

### Task 3: 建立 GitHub OAuth provider 抽象与回调路由

**Files:**
- Create: `src/app/auth/github.ts`
- Create: `src/pages/auth/login.ts`
- Create: `src/pages/auth/callback.ts`
- Create: `src/pages/auth/logout.ts`
- Create: `tests/unit/app/auth/github.test.ts`
- Modify: `src/env.d.ts`

- [ ] **Step 1: 写出失败的 GitHub OAuth URL 生成测试**

```ts
// tests/unit/app/auth/github.test.ts
import { describe, expect, it } from "vitest";
import { buildGithubAuthorizeUrl } from "@/app/auth/github";

describe("buildGithubAuthorizeUrl", () => {
	it("includes client id and callback url", () => {
		const url = buildGithubAuthorizeUrl({
			clientId: "abc",
			redirectUri: "https://duet.test/auth/callback",
			state: "state-123",
		});

		expect(url).toContain("client_id=abc");
		expect(url).toContain(encodeURIComponent("https://duet.test/auth/callback"));
		expect(url).toContain("state=state-123");
	});
});
```

- [ ] **Step 2: 运行测试确认 provider 尚不存在**

Run: `pnpm vitest run tests/unit/app/auth/github.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 provider 抽象与路由**

```ts
// src/app/auth/github.ts
export function buildGithubAuthorizeUrl(input: {
	clientId: string;
	redirectUri: string;
	state: string;
}) {
	const url = new URL("https://github.com/login/oauth/authorize");
	url.searchParams.set("client_id", input.clientId);
	url.searchParams.set("redirect_uri", input.redirectUri);
	url.searchParams.set("state", input.state);
	url.searchParams.set("scope", "read:user");
	return url.toString();
}
```

路由要求：

- `src/pages/auth/login.ts`：生成 `state` 并重定向到 GitHub
- `src/pages/auth/callback.ts`：交换 token，读取 GitHub 用户信息，命中 allowlist 后写入 `duet_viewer` cookie，再重定向到 `/moments/`
- `src/pages/auth/logout.ts`：删除 cookie 并回到 `/moments/`
- token 交换与用户信息读取优先使用原生 `fetch`，避免为首版 OAuth 引入额外 SDK

- [ ] **Step 4: 验证 OAuth 路由最低可用性**

Run: `pnpm vitest run tests/unit/app/auth/github.test.ts && pnpm astro check`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/app/auth/github.ts src/pages/auth/login.ts src/pages/auth/callback.ts src/pages/auth/logout.ts src/env.d.ts tests/unit/app/auth/github.test.ts
git commit -m "feat: add github oauth routes"
```

### Task 4: 建立 Moments 域模型与 SSR 页面

**Files:**
- Create: `src/domains/moments/content/query.ts`
- Create: `src/domains/moments/components/MomentsFeed.astro`
- Create: `src/domains/moments/components/MomentCard.astro`
- Create: `src/pages/moments.astro`
- Create: `tests/unit/domains/moments/query.test.ts`
- Modify: `src/content.config.ts`
- Modify: `src/utils/url-utils.ts`

- [ ] **Step 1: 写出失败的可见性过滤测试**

```ts
// tests/unit/domains/moments/query.test.ts
import { describe, expect, it } from "vitest";
import { filterMomentsByVisibility } from "@/domains/moments/content/query";

describe("filterMomentsByVisibility", () => {
	it("hides private moments from anonymous viewers", () => {
		const items = [
			{ id: "a", data: { visibility: "public" } },
			{ id: "b", data: { visibility: "private" } },
		] as const;

		expect(filterMomentsByVisibility(items, false).map((item) => item.id)).toEqual(["a"]);
	});
});
```

- [ ] **Step 2: 运行测试确认 Moments 域尚不存在**

Run: `pnpm vitest run tests/unit/domains/moments/query.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 Moments 查询与页面**

```ts
// src/domains/moments/content/query.ts
import { getCollection } from "astro:content";

export function filterMomentsByVisibility<T extends { data: { visibility: "public" | "private" } }>(
	items: T[],
	canViewPrivateContent: boolean,
) {
	return items.filter((item) => canViewPrivateContent || item.data.visibility === "public");
}

export async function getMomentsFeed(canViewPrivateContent: boolean) {
	const items = await getCollection("moments");
	const sorted = items.sort((a, b) => Number(b.data.published) - Number(a.data.published));
	return filterMomentsByVisibility(sorted, canViewPrivateContent);
}
```

```astro
--- // src/pages/moments.astro
export const prerender = false;
import MainGridLayout from "@/layouts/MainGridLayout.astro";
import MomentsFeed from "@/domains/moments/components/MomentsFeed.astro";
import { getMomentsFeed } from "@/domains/moments/content/query";

const items = await getMomentsFeed(Astro.locals.canViewPrivateContent === true);
---
<MainGridLayout title="Moments">
	<MomentsFeed items={items} canViewPrivateContent={Astro.locals.canViewPrivateContent === true} />
</MainGridLayout>
```

- [ ] **Step 4: 验证 Moments 路由行为**

Run: `pnpm vitest run tests/unit/domains/moments/query.test.ts && pnpm astro check`
Expected: PASS；`src/pages/moments.astro` 显式 `prerender = false`

- [ ] **Step 5: 提交**

```bash
git add src/domains/moments/content/query.ts src/domains/moments/components/MomentsFeed.astro src/domains/moments/components/MomentCard.astro src/pages/moments.astro src/content.config.ts src/utils/url-utils.ts tests/unit/domains/moments/query.test.ts
git commit -m "feat: add moments ssr feed"
```

### Task 5: 为公开索引链路加私密内容防线

**Files:**
- Create: `tests/unit/app/content/public-index-contract.test.ts`
- Modify: `src/pages/rss.xml.ts`
- Modify: `astro.config.mjs`
- Modify: `src/components/Navbar.astro`

- [ ] **Step 1: 写出失败的公开索引契约测试**

```ts
// tests/unit/app/content/public-index-contract.test.ts
import { describe, expect, it } from "vitest";
import { excludePrivateEntries } from "@/domains/moments/content/query";

describe("public index contract", () => {
	it("drops private items before indexing", () => {
		expect(
			excludePrivateEntries([
				{ id: "public-1", data: { visibility: "public" } },
				{ id: "private-1", data: { visibility: "private" } },
			]).map((item) => item.id),
		).toEqual(["public-1"]);
	});
});
```

- [ ] **Step 2: 运行测试确认公开索引 helper 尚未暴露**

Run: `pnpm vitest run tests/unit/app/content/public-index-contract.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现防线并补充页面约束**

实现要求：

- 在 `src/domains/moments/content/query.ts` 导出 `excludePrivateEntries`
- `src/pages/rss.xml.ts` 继续仅消费 `posts`
- `src/components/Navbar.astro` 只在公开页面加载 Pagefind，不在 `/moments` 页面输出动态搜索逻辑
- 如果后续接 sitemap 过滤逻辑，统一从 `public manifest` 读取，不做运行时拼装

- [ ] **Step 4: 验证防线**

Run: `pnpm vitest run tests/unit/app/content/public-index-contract.test.ts && pnpm build`
Expected: PASS；构建结果不包含私密 `Moments` 数据

- [ ] **Step 5: 提交**

```bash
git add src/pages/rss.xml.ts astro.config.mjs src/components/Navbar.astro tests/unit/app/content/public-index-contract.test.ts src/domains/moments/content/query.ts
git commit -m "test: enforce public index content boundaries"
```

## Definition of Done

- GitHub OAuth 登录、回调、登出链路存在
- `Astro.locals.canViewPrivateContent` 可在 `SSR` 页面中使用
- `/moments/` 未登录仅展示公开内容
- allowlist 账号登录后可看到私密内容
- 私密 `Moments` 不进入 Pagefind、RSS、sitemap 公开链路

## Execution Notes

- 本计划不重做首页视觉
- 本计划不引入数据库
- 若 GitHub OAuth 交换 token 需要额外依赖，优先用原生 `fetch`

## Next Plan

完成本计划后，继续执行 [2026-03-23-duet-shell-home.md](/Users/hhm/code/duet/docs/superpowers/plans/2026-03-23-duet-shell-home.md)。
