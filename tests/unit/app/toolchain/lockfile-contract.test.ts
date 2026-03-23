import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(
	readFileSync(new URL("../../../../package.json", import.meta.url), "utf8"),
) as {
	dependencies: Record<string, string>;
};

const lockfile = readFileSync(
	new URL("../../../../pnpm-lock.yaml", import.meta.url),
	"utf8",
);

describe("lockfile contract", () => {
	it("keeps the root tailwindcss specifier in sync with package.json", () => {
		const match = lockfile.match(/tailwindcss:\n\s+specifier: ([^\n]+)/);

		expect(match?.[1]).toBe(pkg.dependencies.tailwindcss);
	});
});
