import { describe, expect, it } from "vitest";

describe("vitest harness", () => {
	it("runs unit tests in the duet workspace", () => {
		expect(import.meta.env.MODE).toBe("test");
	});
});
