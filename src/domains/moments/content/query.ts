import type { CollectionEntry } from "astro:content";

export type MomentEntry = CollectionEntry<"moments">;

export function filterMomentsByVisibility<
	T extends { data: { visibility: "public" | "private" } },
>(items: T[], canViewPrivateContent: boolean) {
	return items.filter((item) => {
		return canViewPrivateContent || item.data.visibility === "public";
	});
}

export function excludePrivateEntries<
	T extends { data: { visibility: "public" | "private" } },
>(items: T[]) {
	return filterMomentsByVisibility(items, false);
}

function sortMomentsByPublished<T extends { data: { published: Date } }>(
	items: T[],
) {
	return [...items].sort(
		(a, b) => Number(b.data.published) - Number(a.data.published),
	);
}

export async function getMomentsFeed(canViewPrivateContent: boolean) {
	const { getCollection } = await import("astro:content");
	const items = await getCollection("moments");

	return filterMomentsByVisibility(
		sortMomentsByPublished(items),
		canViewPrivateContent,
	);
}
