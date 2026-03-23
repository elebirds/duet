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
