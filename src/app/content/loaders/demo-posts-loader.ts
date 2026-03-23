import { glob } from "astro/loaders";

type ManifestEntry = {
	id: string;
	visibility?: "public" | "private";
};

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

export async function buildPublicManifest<T extends ManifestEntry>(
	entries: readonly T[],
) {
	return entries.filter((entry) => entry.visibility !== "private");
}
