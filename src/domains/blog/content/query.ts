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
		draft?: boolean;
		visibility?: "public" | "private";
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

function isDraftVisible(draft: boolean | undefined) {
	return draft === true ? !import.meta.env.PROD : true;
}

function isPublicVisibility(visibility: "public" | "private" | undefined) {
	return visibility !== "private";
}

export function filterVisibleBlogPosts<
	T extends {
		data: { draft?: boolean; visibility?: "public" | "private" };
	},
>(entries: T[], canViewPrivateContent: boolean): T[] {
	return entries.filter((entry) => {
		if (!isDraftVisible(entry.data.draft)) {
			return false;
		}

		return canViewPrivateContent || isPublicVisibility(entry.data.visibility);
	});
}

export function filterIndexableBlogPosts<
	T extends {
		data: { draft?: boolean; visibility?: "public" | "private" };
	},
>(entries: T[]): T[] {
	return entries.filter((entry) => {
		return (
			entry.data.draft !== true && isPublicVisibility(entry.data.visibility)
		);
	});
}

async function getAllBlogPosts(): Promise<BlogPostEntry[]> {
	const { getCollection } = await import("astro:content");
	return getCollection("posts");
}

export async function getVisibleBlogPosts(
	canViewPrivateContent: boolean,
): Promise<BlogPostEntry[]> {
	return attachAdjacentPosts(
		sortPostsByPublished(
			filterVisibleBlogPosts(await getAllBlogPosts(), canViewPrivateContent),
		),
	);
}

export async function getIndexableBlogPosts(): Promise<BlogPostEntry[]> {
	return attachAdjacentPosts(
		sortPostsByPublished(filterIndexableBlogPosts(await getAllBlogPosts())),
	);
}

export async function getPublishedBlogPosts(): Promise<BlogPostEntry[]> {
	return getIndexableBlogPosts();
}

export async function getVisibleBlogPostList(
	canViewPrivateContent: boolean,
): Promise<BlogPostListEntry[]> {
	return sortPostsByPublished(
		filterVisibleBlogPosts(await getAllBlogPosts(), canViewPrivateContent),
	).map((post) => ({
		slug: getBlogPostSlug(post),
		data: post.data,
	}));
}

export async function getPublishedBlogPostList(): Promise<BlogPostListEntry[]> {
	return getVisibleBlogPostList(false);
}

export async function getVisibleBlogTagList(
	canViewPrivateContent: boolean,
): Promise<BlogTag[]> {
	const countMap: Record<string, number> = {};

	for (const post of filterVisibleBlogPosts(
		await getAllBlogPosts(),
		canViewPrivateContent,
	)) {
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

export async function getBlogTagList(): Promise<BlogTag[]> {
	return getVisibleBlogTagList(false);
}

export async function getVisibleBlogCategoryList(
	canViewPrivateContent: boolean,
): Promise<BlogCategory[]> {
	const [{ default: I18nKey }, { i18n }, { getCategoryUrl }] =
		await Promise.all([
			import("../../../i18n/i18nKey"),
			import("../../../i18n/translation"),
			import("../../../utils/url-utils"),
		]);
	const countMap: Record<string, number> = {};

	for (const post of filterVisibleBlogPosts(
		await getAllBlogPosts(),
		canViewPrivateContent,
	)) {
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

export async function getBlogCategoryList(): Promise<BlogCategory[]> {
	return getVisibleBlogCategoryList(false);
}
