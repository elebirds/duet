import { describe, expect, it } from "vitest";
import { placeholderRouteMeta } from "../../../../src/domains/site/placeholders";

describe("placeholderRouteMeta", () => {
	it("marks cv and portfolio as placeholders", () => {
		expect(placeholderRouteMeta.cv.enabled).toBe(false);
		expect(placeholderRouteMeta.portfolio.enabled).toBe(false);
	});
});
