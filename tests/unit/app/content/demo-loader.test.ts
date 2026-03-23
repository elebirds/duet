import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blogPostSchema } from "../../../../src/app/content/contracts";
import { loadDemoMomentsEntries } from "../../../../src/app/content/loaders/demo-moments-loader";
import { loadDemoSiteEntries } from "../../../../src/app/content/loaders/demo-site-loader";

describe("demo content loaders", () => {
	it("returns the expected site shell entries", async () => {
		const entries = await loadDemoSiteEntries();
		expect(entries.map((entry) => entry.id).sort()).toEqual([
			"home",
			"profile",
		]);
	});

	it("returns both public and private demo moments", async () => {
		const entries = await loadDemoMomentsEntries();
		expect(entries.map((entry) => entry.id).sort()).toEqual([
			"private-welcome",
			"public-welcome",
		]);
		expect(
			entries.find((entry) => entry.id === "private-welcome")?.visibility,
		).toBe("private");
	});

	it("defaults demo blog posts to public visibility", () => {
		const parsed = blogPostSchema.parse({
			title: "Demo Post",
			published: "2026-03-23",
		});

		expect(parsed.visibility).toBe("public");
	});

	it("includes a private demo blog post fixture", () => {
		const source = readFileSync(
			new URL(
				"../../../../src/demo-content/posts/private-late-night-note.md",
				import.meta.url,
			),
			"utf8",
		);

		expect(source).toContain("visibility: private");
		expect(source).toContain("title: Private Late Night Note");
	});
});
