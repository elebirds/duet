export type ContentSourceMode = "demo" | "token" | "local";

export type ResolvedContentSourceMode = {
	mode: ContentSourceMode;
	localPath: string | null;
	repo: string | null;
	token: string | null;
};

export function resolveContentSourceMode(
	env: Record<string, string | undefined>,
): ResolvedContentSourceMode {
	const localPath = env.DUET_CONTENT_LOCAL_PATH ?? null;
	const repo = env.DUET_CONTENT_REPO ?? null;
	const token = env.CONTENT_REPO_TOKEN ?? null;

	if (localPath) {
		return {
			mode: "local",
			localPath,
			repo,
			token,
		};
	}

	if (repo && token) {
		return {
			mode: "token",
			localPath: null,
			repo,
			token,
		};
	}

	return {
		mode: "demo",
		localPath: null,
		repo: null,
		token: null,
	};
}
