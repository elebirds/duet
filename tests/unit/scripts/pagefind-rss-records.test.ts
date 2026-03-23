import { describe, expect, it } from "vitest";
import { extractPagefindRecordsFromRss } from "../../../scripts/search/pagefind-rss-records.mjs";

describe("extractPagefindRecordsFromRss", () => {
	it("builds public search records from rss items", () => {
		const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <language>zh-CN</language>
    <item>
      <title>Private &amp; Public</title>
      <link>https://example.com/posts/private-post/</link>
      <description>Short &lt;em&gt;desc&lt;/em&gt;</description>
      <content:encoded>&lt;h2&gt;Heading&lt;/h2&gt;&lt;p&gt;Body &amp;amp; more&lt;/p&gt;</content:encoded>
    </item>
  </channel>
</rss>`;

		const records = extractPagefindRecordsFromRss(rss);

		expect(records).toHaveLength(1);
		expect(records[0]).toMatchObject({
			url: "/posts/private-post/",
			language: "zh-CN",
			meta: {
				title: "Private & Public",
			},
		});
		expect(records[0].content).toContain("Private & Public");
		expect(records[0].content).toContain("Short desc");
		expect(records[0].content).toContain("Heading");
		expect(records[0].content).toContain("Body & more");
		expect(records[0].content).not.toContain("<h2>");
	});

	it("defaults the rss language to en and preserves relative links", () => {
		const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <item>
      <title>Plain Post</title>
      <link>/posts/plain-post/</link>
      <description>Just text</description>
    </item>
  </channel>
</rss>`;

		const records = extractPagefindRecordsFromRss(rss);

		expect(records).toEqual([
			{
				url: "/posts/plain-post/",
				language: "en",
				meta: {
					title: "Plain Post",
				},
				content: "Plain Post\n\nJust text",
			},
		]);
	});
});
