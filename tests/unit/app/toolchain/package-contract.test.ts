import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(
	readFileSync(new URL("../../../../package.json", import.meta.url), "utf8"),
);
const nodeVersion = readFileSync(
	new URL("../../../../.node-version", import.meta.url),
	"utf8",
).trim();
const buildWorkflow = readFileSync(
	new URL("../../../../.github/workflows/build.yml", import.meta.url),
	"utf8",
);
const astroConfig = readFileSync(
	new URL("../../../../astro.config.mjs", import.meta.url),
	"utf8",
);

describe("toolchain contract", () => {
	it("pins node 24 and astro toolchain versions", () => {
		expect(nodeVersion).toBe("24");
		expect(pkg.dependencies.astro).toBe("6.0.8");
		expect(pkg.dependencies["@astrojs/check"]).toBe("0.9.8");
		expect(pkg.dependencies["@astrojs/rss"]).toBe("4.0.17");
		expect(pkg.dependencies["@astrojs/sitemap"]).toBe("3.7.1");
		expect(pkg.dependencies["@astrojs/svelte"]).toBe("8.0.3");
		expect(pkg.dependencies.tailwindcss).toBe("4.2.2");
		expect(pkg.dependencies["@tailwindcss/vite"]).toBe("4.2.2");
		expect(pkg.dependencies["@tailwindcss/typography"]).toBe("^0.5.19");
		expect(pkg.dependencies["@astrojs/tailwind"]).toBeUndefined();
		expect(pkg.devDependencies["postcss-import"]).toBeUndefined();
		expect(pkg.devDependencies["postcss-nesting"]).toBeUndefined();
		expect(pkg.engines.node).toBe(">=24.0.0");
		expect(pkg.packageManager).toMatch(/^pnpm@/);
	});

	it("keeps CI aligned with the Node 24 and full build contract", () => {
		expect(buildWorkflow).toMatch(/node:\s*\[\s*24\s*\]/);
		expect(buildWorkflow).toContain("run: pnpm build");
		expect(buildWorkflow).not.toContain("run: pnpm astro build");
	});

	it("uses the Tailwind 4 Vite integration instead of the legacy Astro integration", () => {
		expect(astroConfig).toContain('import tailwindcss from "@tailwindcss/vite"');
		expect(astroConfig).toContain("plugins: [tailwindcss()");
		expect(astroConfig).not.toContain('@astrojs/tailwind');
		expect(
			existsSync(
				new URL("../../../../postcss.config.mjs", import.meta.url),
			),
		).toBe(false);
	});
});
