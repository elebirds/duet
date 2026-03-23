import { describe, expect, it } from "vitest";
import { resolveLayoutVariant } from "../../../../src/app/shell/layout-variants";

describe("resolveLayoutVariant", () => {
	it("falls back to list for unsupported variants", () => {
		expect(resolveLayoutVariant("unknown")).toBe("list");
		expect(resolveLayoutVariant("grid")).toBe("grid");
	});
});
