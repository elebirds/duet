export type ViewerSession = {
	provider: "github";
	login: string;
	name?: string;
} | null;

export function canViewPrivateContent(
	session: ViewerSession,
	allowlist: string[],
) {
	if (!session) {
		return false;
	}

	return allowlist.includes(session.login);
}
