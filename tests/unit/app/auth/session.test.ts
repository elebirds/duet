import { describe, expect, it } from "vitest";
import { getPrivateViewerAllowlist } from "../../../../src/app/auth/allowlist";
import { canViewPrivateContent } from "../../../../src/app/auth/session";

describe("canViewPrivateContent", () => {
	it("rejects anonymous sessions", () => {
		expect(canViewPrivateContent(null, ["hhm"])).toBe(false);
	});

	it("accepts allowlisted github login", () => {
		expect(
			canViewPrivateContent({ provider: "github", login: "hhm" }, ["hhm"]),
		).toBe(true);
	});
});

describe("getPrivateViewerAllowlist", () => {
	it("parses a comma-separated allowlist from env", () => {
		expect(
			getPrivateViewerAllowlist({
				DUET_GITHUB_ALLOWLIST: " hhm, duet , , ",
			}),
		).toEqual(["hhm", "duet"]);
	});
});
