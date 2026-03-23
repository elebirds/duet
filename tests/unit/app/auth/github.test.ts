import { describe, expect, it, vi } from "vitest";
import {
	buildGithubAuthorizeUrl,
	exchangeGithubCodeForAccessToken,
	fetchGithubViewer,
} from "../../../../src/app/auth/github";

describe("buildGithubAuthorizeUrl", () => {
	it("includes client id, callback url, state, and scope", () => {
		const url = buildGithubAuthorizeUrl({
			clientId: "abc",
			redirectUri: "https://duet.test/auth/callback/",
			state: "state-123",
		});

		expect(url).toContain("client_id=abc");
		expect(url).toContain(
			encodeURIComponent("https://duet.test/auth/callback/"),
		);
		expect(url).toContain("state=state-123");
		expect(url).toContain("scope=read%3Auser");
	});
});

describe("exchangeGithubCodeForAccessToken", () => {
	it("posts the oauth code and returns the access token", async () => {
		const fetcher = vi.fn(
			async () =>
				new Response(JSON.stringify({ access_token: "gho_test" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
		);

		await expect(
			exchangeGithubCodeForAccessToken(
				{
					clientId: "abc",
					clientSecret: "secret",
					code: "oauth-code",
					redirectUri: "https://duet.test/auth/callback/",
				},
				fetcher,
			),
		).resolves.toBe("gho_test");

		expect(fetcher).toHaveBeenCalledWith(
			"https://github.com/login/oauth/access_token",
			expect.objectContaining({
				method: "POST",
			}),
		);
	});
});

describe("fetchGithubViewer", () => {
	it("returns the github login and optional display name", async () => {
		const fetcher = vi.fn(
			async () =>
				new Response(JSON.stringify({ login: "hhm", name: "HHM" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
		);

		await expect(fetchGithubViewer("gho_test", fetcher)).resolves.toEqual({
			login: "hhm",
			name: "HHM",
		});

		expect(fetcher).toHaveBeenCalledWith(
			"https://api.github.com/user",
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Bearer gho_test",
				}),
			}),
		);
	});
});
