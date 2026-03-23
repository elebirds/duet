import { describe, expect, it } from "vitest";
import { resolveContentSourceMode } from "../../../../src/app/content/source-mode";

describe("resolveContentSourceMode", () => {
	it("defaults to demo mode without private content env", () => {
		expect(resolveContentSourceMode({})).toEqual({
			mode: "demo",
			localPath: null,
			repo: null,
			token: null,
		});
	});

	it("prefers local mode when a local content path is provided", () => {
		expect(
			resolveContentSourceMode({
				DUET_CONTENT_LOCAL_PATH: "/tmp/memories-off",
				DUET_CONTENT_REPO: "hhm/memories-off",
				CONTENT_REPO_TOKEN: "secret",
			}),
		).toEqual({
			mode: "local",
			localPath: "/tmp/memories-off",
			repo: "hhm/memories-off",
			token: "secret",
		});
	});

	it("uses token mode when repo and token are both available", () => {
		expect(
			resolveContentSourceMode({
				DUET_CONTENT_REPO: "hhm/memories-off",
				CONTENT_REPO_TOKEN: "secret",
			}),
		).toEqual({
			mode: "token",
			localPath: null,
			repo: "hhm/memories-off",
			token: "secret",
		});
	});
});
