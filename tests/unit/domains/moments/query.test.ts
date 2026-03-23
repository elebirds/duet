import { describe, expect, it } from "vitest";
import { filterMomentsByVisibility } from "../../../../src/domains/moments/content/query";

describe("filterMomentsByVisibility", () => {
	it("hides private moments from anonymous viewers", () => {
		const items = [
			{ id: "a", data: { visibility: "public" as const } },
			{ id: "b", data: { visibility: "private" as const } },
		];

		expect(
			filterMomentsByVisibility(items, false).map((item) => item.id),
		).toEqual(["a"]);
	});

	it("keeps private moments for authorized viewers", () => {
		const items = [
			{ id: "a", data: { visibility: "public" as const } },
			{ id: "b", data: { visibility: "private" as const } },
		];

		expect(
			filterMomentsByVisibility(items, true).map((item) => item.id),
		).toEqual(["a", "b"]);
	});
});
