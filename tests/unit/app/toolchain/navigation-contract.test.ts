import { describe, expect, it } from "vitest";
import { navBarConfig } from "../../../../src/config";
import { LinkPreset } from "../../../../src/types/config";

describe("navigation contract", () => {
	it("places the moments entry between archive and about", () => {
		expect(navBarConfig.links[1]).toBe(LinkPreset.Archive);
		expect(navBarConfig.links[2]).toEqual({
			name: "Moments",
			url: "/moments/",
		});
		expect(navBarConfig.links[3]).toBe(LinkPreset.About);
	});
});
