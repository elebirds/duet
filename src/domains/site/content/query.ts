export function mergeSiteConfig<T extends Record<string, unknown>>(
	defaults: T,
	overrides: Partial<T> = {},
) {
	return { ...defaults, ...overrides };
}

type SiteEntryLike<T extends { kind: string }> = T | { data: T };

function unwrapSiteEntry<T extends { kind: string }>(
	entry: SiteEntryLike<T>,
): T {
	return "data" in entry ? entry.data : entry;
}

export function getSiteEntryOverrides<T extends { kind: string }>(
	entries: SiteEntryLike<T>[],
	kind: T["kind"],
): Omit<T, "kind"> | undefined {
	const entry = entries.find((candidate) => {
		return unwrapSiteEntry(candidate).kind === kind;
	});

	if (!entry) {
		return undefined;
	}

	const { kind: _kind, ...overrides } = unwrapSiteEntry(entry);
	return overrides;
}
