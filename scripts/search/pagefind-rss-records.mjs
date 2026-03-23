import sanitizeHtml from "sanitize-html";

const NAMED_XML_ENTITIES = {
	amp: "&",
	apos: "'",
	gt: ">",
	lt: "<",
	quot: '"',
};

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collapseWhitespace(value) {
	return value.replace(/\s+/g, " ").trim();
}

export function decodeXmlEntities(value) {
	return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
		if (entity.startsWith("#x") || entity.startsWith("#X")) {
			const codePoint = Number.parseInt(entity.slice(2), 16);
			return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
		}

		if (entity.startsWith("#")) {
			const codePoint = Number.parseInt(entity.slice(1), 10);
			return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
		}

		return NAMED_XML_ENTITIES[entity] ?? match;
	});
}

function extractTagContent(xml, tagName) {
	const tagPattern = escapeRegExp(tagName);
	const match = xml.match(
		new RegExp(`<${tagPattern}>([\\s\\S]*?)</${tagPattern}>`, "i"),
	);

	if (!match) {
		return "";
	}

	const content = match[1].trim();

	if (content.startsWith("<![CDATA[") && content.endsWith("]]>")) {
		return content.slice(9, -3);
	}

	return content;
}

function stripHtmlToText(value) {
	if (!value) {
		return "";
	}

	const decodedHtml = decodeXmlEntities(value);
	const plainText = sanitizeHtml(decodedHtml, {
		allowedAttributes: {},
		allowedTags: [],
	});

	return collapseWhitespace(decodeXmlEntities(plainText));
}

function toRelativeUrl(value) {
	if (!value) {
		return "/";
	}

	try {
		const normalizedUrl = new URL(value);
		return `${normalizedUrl.pathname}${normalizedUrl.search}${normalizedUrl.hash}`;
	} catch {
		return value;
	}
}

export function extractPagefindRecordsFromRss(rssXml) {
	const language =
		collapseWhitespace(
			decodeXmlEntities(extractTagContent(rssXml, "language")),
		) || "en";
	const itemMatches = rssXml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];

	return itemMatches
		.map((itemXml) => {
			const title = collapseWhitespace(
				decodeXmlEntities(extractTagContent(itemXml, "title")),
			);
			const description = stripHtmlToText(
				extractTagContent(itemXml, "description"),
			);
			const body = stripHtmlToText(
				extractTagContent(itemXml, "content:encoded"),
			);
			const url = toRelativeUrl(
				decodeXmlEntities(extractTagContent(itemXml, "link")),
			);
			const content = [title, description, body].filter(Boolean).join("\n\n");

			return {
				url,
				language,
				meta: {
					title,
				},
				content,
			};
		})
		.filter((record) => Boolean(record.url) && Boolean(record.content));
}
