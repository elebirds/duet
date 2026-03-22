/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly DUET_CONTENT_LOCAL_PATH?: string;
	readonly DUET_CONTENT_REPO?: string;
	readonly CONTENT_REPO_TOKEN?: string;
}
