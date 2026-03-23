import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
	new URL("../../../../src/pages/posts/[...slug].astro", import.meta.url),
	"utf8",
);

describe("blog post detail route contract", () => {
	it("does not use getStaticPaths and checks viewer visibility", () => {
		expect(source).not.toContain("getStaticPaths");
		expect(source).toContain("export const prerender = false");
		expect(source).toContain("Astro.locals.canViewPrivateContent");
		expect(source).toContain("Astro.params.slug");
		expect(source).toContain("Astro.response.status = 404");
	});
});
