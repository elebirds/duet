import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const middlewareSource = readFileSync(
	new URL("../../../../src/middleware.ts", import.meta.url),
	"utf8",
);

describe("viewer session middleware contract", () => {
	it("short-circuits prerendered requests before reading cookies", () => {
		expect(middlewareSource).toContain("context.isPrerendered");
		expect(middlewareSource.indexOf("context.isPrerendered")).toBeLessThan(
			middlewareSource.indexOf("context.cookies.get"),
		);
	});
});
