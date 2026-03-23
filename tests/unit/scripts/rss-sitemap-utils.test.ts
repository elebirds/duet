import { describe, expect, it } from "vitest";
import {
	appendCustomSitemapToIndex,
	extractSiteOriginFromSitemapIndex,
	renderSitemapUrlSet,
} from "../../../scripts/search/rss-sitemap-utils.mjs";

describe("rss sitemap utils", () => {
	it("renders a sitemap urlset for public post paths", () => {
		const xml = renderSitemapUrlSet(
			["/posts/one/", "/posts/two/"],
			"https://example.com",
		);

		expect(xml).toContain("<loc>https://example.com/posts/one/</loc>");
		expect(xml).toContain("<loc>https://example.com/posts/two/</loc>");
		expect(xml).toContain("<urlset");
	});

	it("extracts the site origin from the generated sitemap index", () => {
		const siteOrigin = extractSiteOriginFromSitemapIndex(
			'<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://example.com/sitemap-0.xml</loc></sitemap></sitemapindex>',
		);

		expect(siteOrigin).toBe("https://example.com");
	});

	it("appends a custom sitemap entry exactly once", () => {
		const input =
			'<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://example.com/sitemap-0.xml</loc></sitemap></sitemapindex>';
		const customUrl = "https://example.com/sitemap-posts.xml";

		const firstPass = appendCustomSitemapToIndex(input, customUrl);
		const secondPass = appendCustomSitemapToIndex(firstPass, customUrl);

		expect(firstPass).toContain(`<loc>${customUrl}</loc>`);
		expect(secondPass.match(/sitemap-posts\.xml/g)).toHaveLength(1);
	});
});
