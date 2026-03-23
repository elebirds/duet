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

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object";
}

function isGithubViewer(
	value: unknown,
): value is { login: string; name?: string | null } {
	if (!isRecord(value)) {
		return false;
	}

	const candidate = value;

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

function formatGithubOauthError(payload: unknown) {
	if (!isRecord(payload) || typeof payload.error !== "string") {
		return null;
	}

	const description =
		typeof payload.error_description === "string"
			? ` ${payload.error_description}`
			: "";

	return `GitHub token exchange failed: ${payload.error}.${description}`.trim();
}

export async function exchangeGithubCodeForAccessToken(
	input: GithubTokenExchangeInput,
	fetcher: typeof fetch = fetch,
) {
	let response: Response;

	try {
		response = await fetcher("https://github.com/login/oauth/access_token", {
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
		});
	} catch (error) {
		throw new Error(
			"GitHub token exchange failed because the upstream request could not be completed.",
			{
				cause: error,
			},
		);
	}

	if (!response.ok) {
		throw new Error(
			`GitHub token exchange failed with status ${response.status}.`,
		);
	}

	const payload = await response.json();
	const formattedError = formatGithubOauthError(payload);

	if (formattedError) {
		throw new Error(formattedError);
	}

	if (!isRecord(payload) || typeof payload.access_token !== "string") {
		throw new Error("GitHub token exchange did not return an access token.");
	}

	return payload.access_token;
}

export async function fetchGithubViewer(
	accessToken: string,
	fetcher: typeof fetch = fetch,
): Promise<GithubViewer> {
	let response: Response;

	try {
		response = await fetcher("https://api.github.com/user", {
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${accessToken}`,
				"User-Agent": "duet-auth",
			},
		});
	} catch (error) {
		throw new Error(
			"GitHub user lookup failed because the upstream request could not be completed.",
			{
				cause: error,
			},
		);
	}

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
