import type { APIRoute } from "astro";
import {
	OAUTH_STATE_COOKIE_NAME,
	VIEWER_SESSION_COOKIE_NAME,
} from "../../app/auth/cookies";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
	cookies.delete(VIEWER_SESSION_COOKIE_NAME, {
		path: "/",
	});
	cookies.delete(OAUTH_STATE_COOKIE_NAME, {
		path: "/",
	});

	return redirect("/moments/");
};
