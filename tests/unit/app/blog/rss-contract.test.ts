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
