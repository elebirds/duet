function escapeXml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export function extractSiteOriginFromSitemapIndex(sitemapIndexXml) {
	const match = sitemapIndexXml.match(/<loc>(.*?)<\/loc>/i);

	if (!match) {
		throw new Error("Unable to determine site origin from sitemap index.");
	}

	return new URL(match[1]).origin;
}

export function renderSitemapUrlSet(paths, siteOrigin) {
	const normalizedOrigin = siteOrigin.endsWith("/")
		? siteOrigin.slice(0, -1)
		: siteOrigin;
	const items = paths
		.map(
			(path) =>
				`<url><loc>${escapeXml(`${normalizedOrigin}${path}`)}</loc></url>`,
		)
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
}

export function appendCustomSitemapToIndex(sitemapIndexXml, sitemapUrl) {
	if (sitemapIndexXml.includes(sitemapUrl)) {
		return sitemapIndexXml;
	}

	return sitemapIndexXml.replace(
		"</sitemapindex>",
		`<sitemap><loc>${escapeXml(sitemapUrl)}</loc></sitemap></sitemapindex>`,
	);
}
