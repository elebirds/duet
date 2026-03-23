import { describe, expect, it } from "vitest";
import {
	attachAdjacentPosts,
	getBlogPostSlug,
} from "../../../../src/domains/blog/content/query";

describe("blog content query", () => {
	it("fills next and previous slugs in descending date order", () => {
		const entries = [
			{
				id: "new.md",
				data: {
					title: "New",
					published: new Date("2026-03-02"),
					prevSlug: "",
					prevTitle: "",
					nextSlug: "",
					nextTitle: "",
				},
			},
			{
				id: "old/index.md",
				data: {
					title: "Old",
					published: new Date("2026-03-01"),
					prevSlug: "",
					prevTitle: "",
					nextSlug: "",
					nextTitle: "",
				},
			},
		];

		const result = attachAdjacentPosts([...entries]);

		expect(result[0].data.prevSlug).toBe("old");
		expect(result[0].data.prevTitle).toBe("Old");
		expect(result[1].data.nextSlug).toBe("new");
		expect(result[1].data.nextTitle).toBe("New");
	});

	it("derives route slugs from post ids", () => {
		expect(getBlogPostSlug("guide/index.md")).toBe("guide");
		expect(getBlogPostSlug("markdown-extended.md")).toBe("markdown-extended");
	});
});
