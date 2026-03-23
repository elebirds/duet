import type { APIRoute } from "astro";
import { OAUTH_STATE_COOKIE_NAME } from "../../app/auth/cookies";
import { buildGithubAuthorizeUrl } from "../../app/auth/github";

export const prerender = false;

function getCookieSecurity(url: URL) {
	return url.protocol === "https:";
}

export const GET: APIRoute = async ({ cookies, redirect, request }) => {
	const clientId = import.meta.env.DUET_GITHUB_CLIENT_ID?.trim();

	if (!clientId) {
		return new Response("Missing DUET_GITHUB_CLIENT_ID.", { status: 503 });
	}

	const state = crypto.randomUUID();
	const redirectUri = new URL("/auth/callback/", request.url).toString();
	const authorizeUrl = buildGithubAuthorizeUrl({
		clientId,
		redirectUri,
		state,
	});
	const requestUrl = new URL(request.url);

	cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
		httpOnly: true,
		maxAge: 60 * 10,
		path: "/",
		sameSite: "lax",
		secure: getCookieSecurity(requestUrl),
	});

	return redirect(authorizeUrl);
};
