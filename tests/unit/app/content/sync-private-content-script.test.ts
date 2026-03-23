import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const scriptPath = fileURLToPath(
	new URL(
		"../../../../scripts/content/sync-private-content.mjs",
		import.meta.url,
	),
);

function runSyncScript(extraEnv: Record<string, string>) {
	const env = { ...process.env, ...extraEnv };
	delete env.DUET_CONTENT_LOCAL_PATH;
	delete env.DUET_CONTENT_REPO;
	delete env.CONTENT_REPO_TOKEN;

	return execFileSync(process.execPath, [scriptPath], {
		cwd: repoRoot,
		env: { ...env, ...extraEnv },
		encoding: "utf8",
	}).trim();
}

describe("sync-private-content script", () => {
	it("defaults to demo mode when no private content env is present", () => {
		expect(runSyncScript({})).toBe("[duet] content sync mode: demo");
	});

	it("uses local mode when a local content path is provided", () => {
		expect(
			runSyncScript({
				DUET_CONTENT_LOCAL_PATH: "/tmp/memories-off",
			}),
		).toBe("[duet] content sync mode: local");
	});

	it("stays in demo mode when a token exists without a repo", () => {
		expect(
			runSyncScript({
				CONTENT_REPO_TOKEN: "secret",
			}),
		).toBe("[duet] content sync mode: demo");
	});

	it("uses token mode only when repo and token are both available", () => {
		expect(
			runSyncScript({
				DUET_CONTENT_REPO: "hhm/memories-off",
				CONTENT_REPO_TOKEN: "secret",
			}),
		).toBe("[duet] content sync mode: token");
	});
});
