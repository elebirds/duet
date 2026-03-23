import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { excludePrivateEntries } from "../../../../src/domains/moments/content/query";

const navbarSource = readFileSync(
	new URL("../../../../src/components/Navbar.astro", import.meta.url),
	"utf8",
);

describe("public index contract", () => {
	it("drops private items before indexing", () => {
		expect(
			excludePrivateEntries([
				{ id: "public-1", data: { visibility: "public" as const } },
				{ id: "private-1", data: { visibility: "private" as const } },
			]).map((item) => item.id),
		).toEqual(["public-1"]);
	});

	it("avoids request-derived routing checks in the navbar", () => {
		expect(navbarSource).not.toContain("Astro.url");
		expect(navbarSource).toContain("disablePublicSearch");
	});
});
