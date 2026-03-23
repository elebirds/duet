import type { ViewerSession } from "./session";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const signingKeys = new Map<string, Promise<CryptoKey>>();

export const VIEWER_SESSION_COOKIE_NAME = "duet_viewer";
export const OAUTH_STATE_COOKIE_NAME = "duet_oauth_state";

function encodeBase64Url(bytes: Uint8Array) {
	let binary = "";

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary)
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replace(/=+$/u, "");
}

function decodeBase64Url(value: string) {
	const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
	const padding =
		normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
	const binary = atob(`${normalized}${padding}`);

	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getSigningKey(secret: string) {
	const normalizedSecret = secret.trim();
	let key = signingKeys.get(normalizedSecret);

	if (!key) {
		key = crypto.subtle.importKey(
			"raw",
			textEncoder.encode(normalizedSecret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign", "verify"],
		);
		signingKeys.set(normalizedSecret, key);
	}

	return key;
}

function isViewerSession(
	value: unknown,
): value is Exclude<ViewerSession, null> {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as Record<string, unknown>;

	return (
		candidate.provider === "github" &&
		typeof candidate.login === "string" &&
		candidate.login.length > 0 &&
		(typeof candidate.name === "undefined" ||
			typeof candidate.name === "string")
	);
}

async function signPayload(payload: string, secret: string) {
	const signature = await crypto.subtle.sign(
		"HMAC",
		await getSigningKey(secret),
		textEncoder.encode(payload),
	);

	return encodeBase64Url(new Uint8Array(signature));
}

export async function encodeViewerSession(
	session: Exclude<ViewerSession, null>,
	secret: string,
) {
	if (!secret.trim()) {
		throw new Error(
			"DUET_SESSION_SECRET is required to encode viewer sessions.",
		);
	}

	const payload = encodeBase64Url(textEncoder.encode(JSON.stringify(session)));
	const signature = await signPayload(payload, secret);

	return `${payload}.${signature}`;
}

export async function decodeViewerSession(
	raw: string | undefined,
	secret: string | undefined,
): Promise<ViewerSession> {
	if (!raw || !secret?.trim()) {
		return null;
	}

	const [payload, signature, ...rest] = raw.split(".");

	if (!payload || !signature || rest.length > 0) {
		return null;
	}

	try {
		const isValid = await crypto.subtle.verify(
			"HMAC",
			await getSigningKey(secret),
			decodeBase64Url(signature),
			textEncoder.encode(payload),
		);

		if (!isValid) {
			return null;
		}

		const parsed = JSON.parse(textDecoder.decode(decodeBase64Url(payload)));

		return isViewerSession(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
