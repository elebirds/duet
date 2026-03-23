import { describe, expect, it } from "vitest";
import { normalizeNavLinks } from "../../../../src/app/shell/nav-links";

describe("normalizeNavLinks", () => {
	it("preserves internal links and flags external ones", () => {
		expect(
			normalizeNavLinks([
				{ name: "Home", url: "/" },
				{ name: "GitHub", url: "https://github.com/example" },
			]),
		).toEqual([
			{ name: "Home", url: "/", external: false },
			{ name: "GitHub", url: "https://github.com/example", external: true },
		]);
	});
});
