export function getPrivateViewerAllowlist(
	env: Record<string, string | undefined>,
) {
	return (env.DUET_GITHUB_ALLOWLIST ?? "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}
