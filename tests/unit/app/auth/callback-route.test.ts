import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const exchangeGithubCodeForAccessToken = vi.fn();
const fetchGithubViewer = vi.fn();
const encodeViewerSession = vi.fn();

vi.mock("../../../../src/app/auth/github", () => ({
	exchangeGithubCodeForAccessToken,
	fetchGithubViewer,
}));

vi.mock("../../../../src/app/auth/cookies", async () => {
	const actual = await vi.importActual<
		typeof import("../../../../src/app/auth/cookies")
	>("../../../../src/app/auth/cookies");

	return {
		...actual,
		encodeViewerSession,
	};
});

function createCookies(initial: Record<string, string>) {
	const store = new Map(Object.entries(initial));
	const deleted: string[] = [];

	return {
		get(name: string) {
			const value = store.get(name);
			return value ? { value } : undefined;
		},
		delete(name: string) {
			store.delete(name);
			deleted.push(name);
		},
		set(name: string, value: string) {
			store.set(name, value);
		},
		deleted,
	};
}

function redirect(location: string) {
	return new Response(null, {
		status: 302,
		headers: {
			Location: location,
		},
	});
}

describe("auth callback route", () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.stubEnv("DUET_GITHUB_CLIENT_ID", "abc");
		vi.stubEnv("DUET_GITHUB_CLIENT_SECRET", "secret");
		vi.stubEnv("DUET_SESSION_SECRET", "session-secret");
		vi.stubEnv("DUET_GITHUB_ALLOWLIST", "hhm");
		encodeViewerSession.mockResolvedValue("signed-session");
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.clearAllMocks();
		consoleErrorSpy.mockRestore();
	});

	it("redirects back to moments when oauth exchange fails after state validation", async () => {
		exchangeGithubCodeForAccessToken.mockRejectedValue(
			new Error("GitHub token exchange failed: bad_verification_code."),
		);

		const { GET } = await import("../../../../src/pages/auth/callback");
		const cookies = createCookies({
			duet_oauth_state: "state-123",
		});

		const response = await GET({
			cookies,
			redirect,
			request: new Request(
				"http://localhost:4321/auth/callback/?code=oauth-code&state=state-123",
			),
		} as never);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("/moments/?auth=retry");
		expect(cookies.deleted).toContain("duet_oauth_state");
		expect(cookies.deleted).toContain("duet_viewer");
	});

	it("redirects stale callback requests to a recoverable moments state", async () => {
		const { GET } = await import("../../../../src/pages/auth/callback");
		const cookies = createCookies({});

		const response = await GET({
			cookies,
			redirect,
			request: new Request(
				"http://localhost:4321/auth/callback/?code=oauth-code&state=state-123",
			),
		} as never);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("/moments/?auth=expired");
	});
});
