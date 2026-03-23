import { defineMiddleware } from "astro:middleware";
import { getPrivateViewerAllowlist } from "./app/auth/allowlist";
import {
	decodeViewerSession,
	VIEWER_SESSION_COOKIE_NAME,
} from "./app/auth/cookies";
import { canViewPrivateContent } from "./app/auth/session";

export const onRequest = defineMiddleware(async (context, next) => {
	context.locals.viewerSession = null;
	context.locals.canViewPrivateContent = false;

	if (context.isPrerendered) {
		return next();
	}

	const allowlist = getPrivateViewerAllowlist(import.meta.env);
	const session = await decodeViewerSession(
		context.cookies.get(VIEWER_SESSION_COOKIE_NAME)?.value,
		import.meta.env.DUET_SESSION_SECRET,
	);

	context.locals.viewerSession = session;
	context.locals.canViewPrivateContent = canViewPrivateContent(
		session,
		allowlist,
	);

	return next();
});
