import { glob } from "astro/loaders";

export const loadDemoPostsEntries = glob({
	pattern: "**/*.{md,mdx}",
	base: "./src/demo-content/posts",
	generateId: ({ entry }) => entry.replace(/\\/g, "/"),
});

export const loadDemoSpecEntries = glob({
	pattern: "**/*.{md,mdx}",
	base: "./src/demo-content/spec",
	generateId: ({ entry }) => entry.replace(/\\/g, "/"),
});
