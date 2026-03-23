type GithubTokenExchangeInput = {
	clientId: string;
	clientSecret: string;
	code: string;
	redirectUri: string;
};

type GithubAuthorizeUrlInput = {
	clientId: string;
	redirectUri: string;
	state: string;
};

type GithubViewer = {
	login: string;
	name?: string;
};

function isGithubViewer(
	value: unknown,
): value is { login: string; name?: string | null } {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as Record<string, unknown>;

	return (
		typeof candidate.login === "string" &&
		(typeof candidate.name === "undefined" ||
			typeof candidate.name === "string" ||
			candidate.name === null)
	);
}

export function buildGithubAuthorizeUrl(input: GithubAuthorizeUrlInput) {
	const url = new URL("https://github.com/login/oauth/authorize");

	url.searchParams.set("client_id", input.clientId);
	url.searchParams.set("redirect_uri", input.redirectUri);
	url.searchParams.set("state", input.state);
	url.searchParams.set("scope", "read:user");

	return url.toString();
}

export async function exchangeGithubCodeForAccessToken(
	input: GithubTokenExchangeInput,
	fetcher: typeof fetch = fetch,
) {
	const response = await fetcher(
		"https://github.com/login/oauth/access_token",
		{
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				client_id: input.clientId,
				client_secret: input.clientSecret,
				code: input.code,
				redirect_uri: input.redirectUri,
			}),
		},
	);

	if (!response.ok) {
		throw new Error(
			`GitHub token exchange failed with status ${response.status}.`,
		);
	}

	const payload = await response.json();

	if (
		!payload ||
		typeof payload !== "object" ||
		typeof payload.access_token !== "string"
	) {
		throw new Error("GitHub token exchange did not return an access token.");
	}

	return payload.access_token;
}

export async function fetchGithubViewer(
	accessToken: string,
	fetcher: typeof fetch = fetch,
): Promise<GithubViewer> {
	const response = await fetcher("https://api.github.com/user", {
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${accessToken}`,
			"User-Agent": "duet-auth",
		},
	});

	if (!response.ok) {
		throw new Error(
			`GitHub user lookup failed with status ${response.status}.`,
		);
	}

	const payload = await response.json();

	if (!isGithubViewer(payload)) {
		throw new Error("GitHub user lookup returned an invalid profile.");
	}

	return {
		login: payload.login,
		name: payload.name ?? undefined,
	};
}
