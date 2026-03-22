import { describe, expect, it } from "vitest";
import {
	findContentEntryBySlug,
	getContentEntrySlug,
} from "../../../src/utils/content-entry-id";

describe("content entry id helpers", () => {
	it("normalizes markdown ids into route slugs", () => {
		expect(getContentEntrySlug("about.md")).toBe("about");
		expect(getContentEntrySlug("posts/hello-world.mdx")).toBe(
			"posts/hello-world",
		);
		expect(getContentEntrySlug("posts/guide/index.md")).toBe("posts/guide");
	});

	it("finds entries by normalized slug without depending on file suffixes", () => {
		const entry = findContentEntryBySlug(
			[
				{ id: "about.md", title: "About" },
				{ id: "posts/guide/index.md", title: "Guide" },
			],
			"about",
		);

		expect(entry).toEqual({ id: "about.md", title: "About" });
		expect(
			findContentEntryBySlug(
				[
					{ id: "about.md", title: "About" },
					{ id: "posts/guide/index.md", title: "Guide" },
				],
				"posts/guide",
			),
		).toEqual({ id: "posts/guide/index.md", title: "Guide" });
	});
});
