import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const momentCardSource = readFileSync(
	new URL(
		"../../../../src/domains/moments/components/MomentCard.astro",
		import.meta.url,
	),
	"utf8",
);
const materialSymbolsCollection = JSON.parse(
	readFileSync(
		new URL(
			"../../../../node_modules/@iconify-json/material-symbols/icons.json",
			import.meta.url,
		),
		"utf8",
	),
) as {
	icons: Record<string, unknown>;
};

describe("MomentCard icon contract", () => {
	it("only references icons that exist in the material-symbols collection", () => {
		const iconNames = [
			...momentCardSource.matchAll(/material-symbols:([a-z0-9-]+)/g),
		].map((match) => match[1]);

		expect(iconNames.length).toBeGreaterThan(0);

		for (const iconName of iconNames) {
			expect(materialSymbolsCollection.icons[iconName]).toBeDefined();
		}
	});
});
