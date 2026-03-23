export function getContentEntrySlug(entryId: string): string {
	return entryId.replace(/\.(md|mdx)$/i, "").replace(/\/index$/i, "");
}

export function findContentEntryBySlug<T extends { id: string }>(
	entries: readonly T[],
	slug: string,
): T | undefined {
	return entries.find((entry) => getContentEntrySlug(entry.id) === slug);
}
