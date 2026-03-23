import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
	new URL("../../../../src/pages/archive.astro", import.meta.url),
	"utf8",
);

describe("blog archive route contract", () => {
	it("switches archive rendering to SSR and reads viewer visibility", () => {
		expect(source).toContain("export const prerender = false");
		expect(source).toContain("Astro.locals.canViewPrivateContent");
		expect(source).toContain("getVisibleBlogPostList");
		expect(source).not.toContain("getPublishedBlogPostList");
	});
});
