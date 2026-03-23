import { describe, expect, it } from "vitest";
import { buildHomeRouteCards } from "../../../../src/domains/home/model";

describe("buildHomeRouteCards", () => {
	it("filters disabled routes", () => {
		expect(
			buildHomeRouteCards([
				{ title: "Blog", href: "/posts/", enabled: true },
				{ title: "CV", href: "/cv/", enabled: false },
			]),
		).toEqual([{ title: "Blog", href: "/posts/", enabled: true }]);
	});
});
