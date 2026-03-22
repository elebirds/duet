import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(
	readFileSync(new URL("../../../../package.json", import.meta.url), "utf8"),
);

describe("toolchain contract", () => {
	it("pins astro 6 and node 24", () => {
		expect(pkg.dependencies.astro).toMatch(/^6\./);
		expect(pkg.engines.node).toBe(">=24.0.0");
		expect(pkg.packageManager).toMatch(/^pnpm@/);
	});
});
