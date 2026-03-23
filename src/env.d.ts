/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly DUET_CONTENT_LOCAL_PATH?: string;
	readonly DUET_CONTENT_REPO?: string;
	readonly DUET_GITHUB_ALLOWLIST?: string;
	readonly DUET_GITHUB_CLIENT_ID?: string;
	readonly DUET_GITHUB_CLIENT_SECRET?: string;
	readonly DUET_SESSION_SECRET?: string;
	readonly CONTENT_REPO_TOKEN?: string;
}

declare namespace App {
	interface Locals {
		canViewPrivateContent: boolean;
		viewerSession: import("./app/auth/session").ViewerSession;
	}
}
