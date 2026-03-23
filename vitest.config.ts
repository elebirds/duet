import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: false,
		setupFiles: ["./tests/setup/vitest.setup.ts"],
		include: ["tests/unit/**/*.test.ts"],
		coverage: {
			provider: "v8",
		},
	},
});
