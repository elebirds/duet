export type NormalizedNavLink = {
	name: string;
	url: string;
	external: boolean;
};

export function normalizeNavLinks(
	links: Array<{ name: string; url: string; external?: boolean }>,
): NormalizedNavLink[] {
	return links.map((link) => ({
		...link,
		external: link.external ?? /^https?:\/\//.test(link.url),
	}));
}
