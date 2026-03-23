import type { APIRoute } from "astro";
import { getPrivateViewerAllowlist } from "../../app/auth/allowlist";
import {
	encodeViewerSession,
	OAUTH_STATE_COOKIE_NAME,
	VIEWER_SESSION_COOKIE_NAME,
} from "../../app/auth/cookies";
import {
	exchangeGithubCodeForAccessToken,
	fetchGithubViewer,
} from "../../app/auth/github";
import { canViewPrivateContent } from "../../app/auth/session";

export const prerender = false;

function getCookieSecurity(url: URL) {
	return url.protocol === "https:";
}

export const GET: APIRoute = async ({ cookies, redirect, request }) => {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const state = requestUrl.searchParams.get("state");
	const expectedState = cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

	cookies.delete(OAUTH_STATE_COOKIE_NAME, {
		path: "/",
	});

	if (!code || !state || !expectedState || state !== expectedState) {
		return new Response("Invalid OAuth state.", { status: 400 });
	}

	const clientId = import.meta.env.DUET_GITHUB_CLIENT_ID?.trim();
	const clientSecret = import.meta.env.DUET_GITHUB_CLIENT_SECRET?.trim();
	const sessionSecret = import.meta.env.DUET_SESSION_SECRET?.trim();

	if (!clientId || !clientSecret || !sessionSecret) {
		return new Response("Missing GitHub OAuth or session configuration.", {
			status: 503,
		});
	}

	const redirectUri = new URL("/auth/callback/", request.url).toString();
	const accessToken = await exchangeGithubCodeForAccessToken({
		clientId,
		clientSecret,
		code,
		redirectUri,
	});
	const githubViewer = await fetchGithubViewer(accessToken);
	const viewerSession = {
		provider: "github" as const,
		login: githubViewer.login,
		name: githubViewer.name,
	};

	if (
		!canViewPrivateContent(
			viewerSession,
			getPrivateViewerAllowlist(import.meta.env),
		)
	) {
		cookies.delete(VIEWER_SESSION_COOKIE_NAME, {
			path: "/",
		});

		return redirect("/moments/?auth=forbidden");
	}

	cookies.set(
		VIEWER_SESSION_COOKIE_NAME,
		await encodeViewerSession(viewerSession, sessionSecret),
		{
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
			sameSite: "lax",
			secure: getCookieSecurity(requestUrl),
		},
	);

	return redirect("/moments/");
};
