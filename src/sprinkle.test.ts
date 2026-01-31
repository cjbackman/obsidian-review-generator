import { describe, it, expect } from "vitest";
import { buildSprinklePrompt } from "./sprinkle";

describe("buildSprinklePrompt", () => {
	it("includes both user prompt and selected text in output", () => {
		const result = buildSprinklePrompt("Summarize this", "Hello world");

		expect(result).toContain("Summarize this");
		expect(result).toContain("Hello world");
	});

	it("handles empty user prompt", () => {
		const result = buildSprinklePrompt("", "Some selected text");

		expect(result).toContain("Some selected text");
		expect(result).not.toContain("## Instruction");
	});

	it("handles whitespace-only user prompt", () => {
		const result = buildSprinklePrompt("   ", "Some selected text");

		expect(result).toContain("Some selected text");
		expect(result).not.toContain("## Instruction");
	});

	it("handles multi-line selected text", () => {
		const multiLine = "Line one\nLine two\nLine three";
		const result = buildSprinklePrompt("Rewrite this", multiLine);

		expect(result).toContain("Line one\nLine two\nLine three");
		expect(result).toContain("Rewrite this");
	});

	it("instructs model to output markdown only", () => {
		const result = buildSprinklePrompt("Do something", "text");

		expect(result.toLowerCase()).toContain("markdown only");
	});

	it("instructs model to not include preamble", () => {
		const result = buildSprinklePrompt("Do something", "text");

		expect(result.toLowerCase()).toContain("no preamble");
	});
});
