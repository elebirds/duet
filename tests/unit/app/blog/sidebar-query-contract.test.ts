import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tagsSource = readFileSync(
	new URL("../../../../src/components/widget/Tags.astro", import.meta.url),
	"utf8",
);
const categoriesSource = readFileSync(
	new URL(
		"../../../../src/components/widget/Categories.astro",
		import.meta.url,
	),
	"utf8",
);

describe("blog sidebar query contract", () => {
	it("uses viewer-aware query helpers", () => {
		expect(tagsSource).toContain("getVisibleBlogTagList");
		expect(tagsSource).toContain("Astro.locals.canViewPrivateContent");
		expect(categoriesSource).toContain("getVisibleBlogCategoryList");
		expect(categoriesSource).toContain("Astro.locals.canViewPrivateContent");
	});
});
