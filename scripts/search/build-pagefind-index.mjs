import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as pagefind from "pagefind";
import { extractPagefindRecordsFromRss } from "./pagefind-rss-records.mjs";
import {
	appendCustomSitemapToIndex,
	extractSiteOriginFromSitemapIndex,
	renderSitemapUrlSet,
} from "./rss-sitemap-utils.mjs";

const distRoot = path.resolve("dist");
const clientRoot = path.join(distRoot, "client");
const pagefindRoot = path.join(distRoot, "pagefind");
const rssPath = path.join(clientRoot, "rss.xml");
const sitemapIndexPath = path.join(clientRoot, "sitemap-index.xml");
const sitemapPostsPath = path.join(clientRoot, "sitemap-posts.xml");

async function buildPagefindIndex() {
	const rssXml = await readFile(rssPath, "utf8");
	const records = extractPagefindRecordsFromRss(rssXml);
	const { index } = await pagefind.createIndex();

	try {
		await index.addDirectory({ path: distRoot });

		for (const record of records) {
			const response = await index.addCustomRecord(record);

			if (response.errors.length > 0) {
				throw new Error(response.errors.join("\n"));
			}
		}

		await index.writeFiles({ outputPath: pagefindRoot });
		console.log(
			`Pagefind indexed ${records.length} public blog posts from RSS.`,
		);
	} finally {
		await index.deleteIndex();
		await pagefind.close();
	}
}

async function buildPublicPostSitemap() {
	const sitemapIndexXml = await readFile(sitemapIndexPath, "utf8");
	const rssXml = await readFile(rssPath, "utf8");
	const records = extractPagefindRecordsFromRss(rssXml);
	const siteOrigin = extractSiteOriginFromSitemapIndex(sitemapIndexXml);
	const sitemapPostsXml = renderSitemapUrlSet(
		records.map((record) => record.url),
		siteOrigin,
	);
	const sitemapPostsUrl = `${siteOrigin}/sitemap-posts.xml`;
	const nextSitemapIndexXml = appendCustomSitemapToIndex(
		sitemapIndexXml,
		sitemapPostsUrl,
	);

	await writeFile(sitemapPostsPath, sitemapPostsXml, "utf8");
	await writeFile(sitemapIndexPath, nextSitemapIndexXml, "utf8");
	console.log(`Sitemap indexed ${records.length} public blog posts from RSS.`);
}

Promise.all([buildPagefindIndex(), buildPublicPostSitemap()]).catch((error) => {
	console.error("Failed to build Pagefind index.");
	console.error(error);
	process.exitCode = 1;
});
