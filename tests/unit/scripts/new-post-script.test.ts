import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const scriptPath = fileURLToPath(
	new URL("../../../scripts/new-post.js", import.meta.url),
);

describe("new-post script", () => {
	it("creates new posts inside src/demo-content/posts", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "duet-new-post-"));

		execFileSync(process.execPath, [scriptPath, "hello-world"], {
			cwd: tempDir,
			encoding: "utf8",
		});

		const newPostPath = join(tempDir, "src/demo-content/posts/hello-world.md");

		expect(existsSync(newPostPath)).toBe(true);
		expect(readFileSync(newPostPath, "utf8")).toContain("title: hello-world");
	});
});
