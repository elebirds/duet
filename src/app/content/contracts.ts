import { z } from "astro/zod";

export const blogPostSchema = z.object({
	title: z.string(),
	published: z.coerce.date(),
	updated: z.coerce.date().optional(),
	draft: z.boolean().optional().default(false),
	visibility: z.enum(["public", "private"]).default("public"),
	description: z.string().optional().default(""),
	image: z.string().optional().default(""),
	tags: z.array(z.string()).optional().default([]),
	category: z.string().optional().nullable().default(""),
	lang: z.string().optional().default(""),
	prevTitle: z.string().default(""),
	prevSlug: z.string().default(""),
	nextTitle: z.string().default(""),
	nextSlug: z.string().default(""),
});

export const siteProfileSchema = z.object({
	kind: z.literal("profile"),
	name: z.string(),
	bio: z.string().default(""),
	avatar: z.string().default(""),
	links: z.array(
		z.object({
			name: z.string(),
			url: z.url(),
			icon: z.string(),
		}),
	),
});

export const siteHomeSchema = z.object({
	kind: z.literal("home"),
	headline: z.string(),
	intro: z.string(),
	featuredRoutes: z.array(
		z.object({
			title: z.string(),
			href: z.string(),
			description: z.string(),
		}),
	),
});

export const siteEntrySchema = z.discriminatedUnion("kind", [
	siteHomeSchema,
	siteProfileSchema,
]);

export const momentEntrySchema = z.object({
	published: z.coerce.date(),
	visibility: z.enum(["public", "private"]).default("public"),
	lang: z.string().default(""),
	summary: z.string().default(""),
});
