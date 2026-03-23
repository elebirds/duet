import { describe, expect, it } from "vitest";
import { mergeSiteConfig } from "../../../../src/domains/site/content/query";

describe("mergeSiteConfig", () => {
	it("prefers content entries over baked-in defaults", () => {
		expect(
			mergeSiteConfig(
				{ title: "Duet", subtitle: "Portal" },
				{ title: "Memories Off" },
			).title,
		).toBe("Memories Off");
	});
});
