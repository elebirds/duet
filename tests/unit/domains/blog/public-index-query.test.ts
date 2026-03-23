import { describe, expect, it } from "vitest";
import {
	filterIndexableBlogPosts,
	filterVisibleBlogPosts,
} from "../../../../src/domains/blog/content/query";

describe("filterVisibleBlogPosts", () => {
	it("hides private posts from anonymous viewers", () => {
		const entries = [
			{ id: "public", data: { draft: false, visibility: "public" as const } },
			{
				id: "private",
				data: { draft: false, visibility: "private" as const },
			},
		];

		expect(
			filterVisibleBlogPosts(entries, false).map((entry) => entry.id),
		).toEqual(["public"]);
	});

	it("keeps private posts for authorized viewers", () => {
		const entries = [
			{ id: "public", data: { draft: false, visibility: "public" as const } },
			{
				id: "private",
				data: { draft: false, visibility: "private" as const },
			},
		];

		expect(
			filterVisibleBlogPosts(entries, true).map((entry) => entry.id),
		).toEqual(["public", "private"]);
	});
});

describe("filterIndexableBlogPosts", () => {
	it("drops private and draft posts from public outputs", () => {
		const entries = [
			{ id: "public", data: { draft: false, visibility: "public" as const } },
			{
				id: "private",
				data: { draft: false, visibility: "private" as const },
			},
			{ id: "draft", data: { draft: true, visibility: "public" as const } },
		];

		expect(filterIndexableBlogPosts(entries).map((entry) => entry.id)).toEqual([
			"public",
		]);
	});
});
