import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
	new URL("../../../../src/pages/[...page].astro", import.meta.url),
	"utf8",
);

describe("blog list route contract", () => {
	it("switches list rendering to SSR and reads viewer visibility", () => {
		expect(source).not.toContain("getStaticPaths");
		expect(source).toContain("export const prerender = false");
		expect(source).toContain("Astro.locals.canViewPrivateContent");
		expect(source).toContain("getVisibleBlogPosts");
		expect(source).toContain("Astro.response.status = 404");
	});
});
