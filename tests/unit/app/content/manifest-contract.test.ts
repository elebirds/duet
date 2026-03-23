import { describe, expect, it } from "vitest";
import { buildPublicManifest } from "../../../../src/app/content/loaders/demo-posts-loader";

describe("public manifest", () => {
	it("does not include private entries", async () => {
		const manifest = await buildPublicManifest([
			{ id: "public-1", visibility: "public" },
			{ id: "private-1", visibility: "private" },
		]);

		expect(manifest.map((item) => item.id)).toEqual(["public-1"]);
	});
});
