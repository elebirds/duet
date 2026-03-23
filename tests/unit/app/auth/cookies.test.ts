import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
	decodeViewerSession,
	encodeViewerSession,
} from "../../../../src/app/auth/cookies";

const secret = "duet-secret";

describe("viewer session cookie", () => {
	it("round-trips a signed github login", async () => {
		const encoded = await encodeViewerSession(
			{ provider: "github", login: "hhm" },
			secret,
		);

		await expect(decodeViewerSession(encoded, secret)).resolves.toMatchObject({
			login: "hhm",
		});
	});

	it("rejects a tampered payload", async () => {
		const encoded = await encodeViewerSession(
			{ provider: "github", login: "hhm" },
			secret,
		);
		const [, signature] = encoded.split(".");
		const tamperedPayload = Buffer.from(
			JSON.stringify({ provider: "github", login: "intruder" }),
		).toString("base64url");

		await expect(
			decodeViewerSession(`${tamperedPayload}.${signature}`, secret),
		).resolves.toBeNull();
	});
});
