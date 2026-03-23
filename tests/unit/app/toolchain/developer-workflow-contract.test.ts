import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gitignore = readFileSync(
	new URL("../../../../.gitignore", import.meta.url),
	"utf8",
);
const readme = readFileSync(
	new URL("../../../../README.md", import.meta.url),
	"utf8",
);
const makefilePath = new URL("../../../../Makefile", import.meta.url);
const initScriptPath = new URL("../../../../scripts/init.sh", import.meta.url);
const envExamplePath = new URL("../../../../.env.example", import.meta.url);

describe("developer workflow contract", () => {
	it("ignores local env files and coverage artifacts", () => {
		expect(gitignore).toContain(".env.local");
		expect(gitignore).toContain(".env.*.local");
		expect(gitignore).toContain("coverage/");
	});

	it("ships a checked-in env example for auth and content modes", () => {
		expect(existsSync(envExamplePath)).toBe(true);

		const envExample = readFileSync(envExamplePath, "utf8");

		expect(envExample).toContain("http://localhost:4321/auth/callback/");
		expect(envExample).toContain(
			"DUET_GITHUB_CLIENT_ID=your-github-oauth-app-client-id",
		);
		expect(envExample).toContain(
			"DUET_GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret",
		);
		expect(envExample).toContain(
			"DUET_SESSION_SECRET=replace-with-a-long-random-string",
		);
		expect(envExample).toContain("DUET_GITHUB_ALLOWLIST=your-github-login");
		expect(envExample).toContain("DUET_CONTENT_LOCAL_PATH=");
		expect(envExample).toContain("DUET_CONTENT_REPO=");
		expect(envExample).toContain("CONTENT_REPO_TOKEN=");
	});

	it("provides make targets for init and common development tasks", () => {
		expect(existsSync(makefilePath)).toBe(true);

		const makefile = readFileSync(makefilePath, "utf8");

		expect(makefile).toContain("init:");
		expect(makefile).toContain("dev:");
		expect(makefile).toContain("test:");
		expect(makefile).toContain("check:");
		expect(makefile).toContain("build:");
		expect(makefile).toContain("verify:");
		expect(makefile).toContain("scripts/init.sh");
	});

	it("initializes fnm, installs dependencies, and seeds .env.local", () => {
		expect(existsSync(initScriptPath)).toBe(true);

		const initScript = readFileSync(initScriptPath, "utf8");

		expect(initScript).toContain("fnm use");
		expect(initScript).toContain("pnpm install");
		expect(initScript).toContain(".env.example");
		expect(initScript).toContain(".env.local");
	});

	it("documents the new bootstrap entrypoints in the readme", () => {
		expect(readme).toContain("make init");
		expect(readme).toContain("./scripts/init.sh");
		expect(readme).toContain(".env.local");
		expect(readme).toContain("http://localhost:4321/auth/callback/");
		expect(readme).toContain("/moments/");
	});
});
