import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import {
	blogPostSchema,
	momentEntrySchema,
	siteEntrySchema,
} from "./app/content/contracts";
import {
	loadDemoMomentsEntries,
} from "./app/content/loaders/demo-moments-loader";
import {
	loadDemoPostsEntries,
	loadDemoSpecEntries,
} from "./app/content/loaders/demo-posts-loader";
import {
	loadDemoSiteEntries,
} from "./app/content/loaders/demo-site-loader";

const posts = defineCollection({
	loader: loadDemoPostsEntries,
	schema: blogPostSchema,
});

const spec = defineCollection({
	loader: loadDemoSpecEntries,
	schema: z.object({}),
});

const site = defineCollection({
	loader: loadDemoSiteEntries,
	schema: siteEntrySchema,
});

const moments = defineCollection({
	loader: loadDemoMomentsEntries,
	schema: momentEntrySchema,
});

export const collections = {
	posts,
	spec,
	site,
	moments,
};
