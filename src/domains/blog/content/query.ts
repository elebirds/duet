import type { CollectionEntry } from "astro:content";
import { getContentEntrySlug } from "../../../utils/content-entry-id";

export type BlogPostEntry = CollectionEntry<"posts">;
export type BlogPostListEntry = {
	slug: string;
	data: BlogPostEntry["data"];
};

export type BlogTag = {
	name: string;
	count: number;
};

export type BlogCategory = {
	name: string;
	count: number;
	url: string;
};

type AdjacentPostEntry = {
	id: string;
	data: {
		title: string;
		published: Date;
		prevSlug?: string;
		prevTitle?: string;
		nextSlug?: string;
		nextTitle?: string;
	};
};

export function getBlogPostSlug(postOrId: string | { id: string }): string {
	return getContentEntrySlug(
		typeof postOrId === "string" ? postOrId : postOrId.id,
	);
}

export function attachAdjacentPosts<T extends AdjacentPostEntry>(
	entries: T[],
): T[] {
	for (let i = 1; i < entries.length; i++) {
		entries[i].data.nextSlug = getBlogPostSlug(entries[i - 1]);
		entries[i].data.nextTitle = entries[i - 1].data.title;
	}

	for (let i = 0; i < entries.length - 1; i++) {
		entries[i].data.prevSlug = getBlogPostSlug(entries[i + 1]);
		entries[i].data.prevTitle = entries[i + 1].data.title;
	}

	return entries;
}

function sortPostsByPublished<T extends { data: { published: Date } }>(
	entries: T[],
): T[] {
	return [...entries].sort(
		(a, b) => Number(b.data.published) - Number(a.data.published),
	);
}

async function getVisibleBlogPosts(): Promise<BlogPostEntry[]> {
	const { getCollection } = await import("astro:content");
	return getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
}

export async function getPublishedBlogPosts(): Promise<BlogPostEntry[]> {
	return attachAdjacentPosts(sortPostsByPublished(await getVisibleBlogPosts()));
}

export async function getPublishedBlogPostList(): Promise<BlogPostListEntry[]> {
	return sortPostsByPublished(await getVisibleBlogPosts()).map((post) => ({
		slug: getBlogPostSlug(post),
		data: post.data,
	}));
}

export async function getBlogTagList(): Promise<BlogTag[]> {
	const countMap: Record<string, number> = {};

	for (const post of await getVisibleBlogPosts()) {
		for (const tag of post.data.tags) {
			countMap[tag] = (countMap[tag] ?? 0) + 1;
		}
	}

	return Object.keys(countMap)
		.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
		.map((name) => ({
			name,
			count: countMap[name],
		}));
}

export async function getBlogCategoryList(): Promise<BlogCategory[]> {
	const [{ default: I18nKey }, { i18n }, { getCategoryUrl }] =
		await Promise.all([
			import("../../../i18n/i18nKey"),
			import("../../../i18n/translation"),
			import("../../../utils/url-utils"),
		]);
	const countMap: Record<string, number> = {};

	for (const post of await getVisibleBlogPosts()) {
		if (!post.data.category) {
			const uncategorized = i18n(I18nKey.uncategorized);
			countMap[uncategorized] = (countMap[uncategorized] ?? 0) + 1;
			continue;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		countMap[categoryName] = (countMap[categoryName] ?? 0) + 1;
	}

	return Object.keys(countMap)
		.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
		.map((name) => ({
			name,
			count: countMap[name],
			url: getCategoryUrl(name),
		}));
}
