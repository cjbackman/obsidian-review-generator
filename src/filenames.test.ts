import { describe, it, expect } from "vitest";
import { resolveFilename } from "./filenames";

describe("resolveFilename", () => {
	describe("basic filename generation", () => {
		it("generates YYYY-MM-DD Weekly Review.md format", () => {
			const date = new Date("2025-01-15T12:00:00Z");
			const existingFiles: string[] = [];

			const result = resolveFilename("Weekly Reviews", date, existingFiles, "UTC");

			expect(result).toBe("Weekly Reviews/2025-01-15 Weekly Review.md");
		});

		it("uses the provided output folder", () => {
			const date = new Date("2025-01-15T12:00:00Z");
			const existingFiles: string[] = [];

			const result = resolveFilename("Reviews/Weekly", date, existingFiles, "UTC");

			expect(result).toBe("Reviews/Weekly/2025-01-15 Weekly Review.md");
		});

		it("handles output folder without trailing slash", () => {
			const date = new Date("2025-01-15T12:00:00Z");
			const existingFiles: string[] = [];

			const result = resolveFilename("Weekly Reviews/", date, existingFiles, "UTC");

			expect(result).toBe("Weekly Reviews/2025-01-15 Weekly Review.md");
		});
	});

	describe("collision handling", () => {
		it("adds (2) when base filename exists", () => {
			const date = new Date("2025-01-15T12:00:00Z");
			const existingFiles = ["Weekly Reviews/2025-01-15 Weekly Review.md"];

			const result = resolveFilename("Weekly Reviews", date, existingFiles, "UTC");

			expect(result).toBe("Weekly Reviews/2025-01-15 Weekly Review (2).md");
		});

		it("adds (3) when (2) also exists", () => {
			const date = new Date("2025-01-15T12:00:00Z");
			const existingFiles = [
				"Weekly Reviews/2025-01-15 Weekly Review.md",
				"Weekly Reviews/2025-01-15 Weekly Review (2).md",
			];

			const result = resolveFilename("Weekly Reviews", date, existingFiles, "UTC");

			expect(result).toBe("Weekly Reviews/2025-01-15 Weekly Review (3).md");
		});

		it("handles multiple collisions", () => {
			const date = new Date("2025-01-15T12:00:00Z");
			const existingFiles = [
				"Weekly Reviews/2025-01-15 Weekly Review.md",
				"Weekly Reviews/2025-01-15 Weekly Review (2).md",
				"Weekly Reviews/2025-01-15 Weekly Review (3).md",
				"Weekly Reviews/2025-01-15 Weekly Review (4).md",
			];

			const result = resolveFilename("Weekly Reviews", date, existingFiles, "UTC");

			expect(result).toBe("Weekly Reviews/2025-01-15 Weekly Review (5).md");
		});

		it("handles gaps in numbering", () => {
			const date = new Date("2025-01-15T12:00:00Z");
			// Note: (3) is missing
			const existingFiles = [
				"Weekly Reviews/2025-01-15 Weekly Review.md",
				"Weekly Reviews/2025-01-15 Weekly Review (2).md",
				"Weekly Reviews/2025-01-15 Weekly Review (4).md",
			];

			const result = resolveFilename("Weekly Reviews", date, existingFiles, "UTC");

			// Should use the first available number
			expect(result).toBe("Weekly Reviews/2025-01-15 Weekly Review (3).md");
		});
	});

	describe("date formatting", () => {
		it("pads single-digit months with zero", () => {
			const date = new Date("2025-03-05T12:00:00Z");
			const existingFiles: string[] = [];

			const result = resolveFilename("Weekly Reviews", date, existingFiles, "UTC");

			expect(result).toBe("Weekly Reviews/2025-03-05 Weekly Review.md");
		});

		it("pads single-digit days with zero", () => {
			const date = new Date("2025-12-01T12:00:00Z");
			const existingFiles: string[] = [];

			const result = resolveFilename("Weekly Reviews", date, existingFiles, "UTC");

			expect(result).toBe("Weekly Reviews/2025-12-01 Weekly Review.md");
		});
	});

	describe("edge cases", () => {
		it("handles empty output folder", () => {
			const date = new Date("2025-01-15T12:00:00Z");
			const existingFiles: string[] = [];

			const result = resolveFilename("", date, existingFiles, "UTC");

			expect(result).toBe("2025-01-15 Weekly Review.md");
		});

		it("handles files in other folders (no collision)", () => {
			const date = new Date("2025-01-15T12:00:00Z");
			const existingFiles = ["Other Folder/2025-01-15 Weekly Review.md"];

			const result = resolveFilename("Weekly Reviews", date, existingFiles, "UTC");

			expect(result).toBe("Weekly Reviews/2025-01-15 Weekly Review.md");
		});

		it("throws error when 1000 collisions are exhausted", () => {
			const date = new Date("2025-01-15T12:00:00Z");
			const existingFiles = ["Weekly Reviews/2025-01-15 Weekly Review.md"];
			// Add collisions for (2) through (1000)
			for (let i = 2; i <= 1000; i++) {
				existingFiles.push(`Weekly Reviews/2025-01-15 Weekly Review (${i}).md`);
			}

			expect(() => resolveFilename("Weekly Reviews", date, existingFiles, "UTC")).toThrow(
				"Could not find available filename after 1000 attempts"
			);
		});

		it("uses local timezone date, not UTC date", () => {
			// 2025-01-15T23:30:00Z = Jan 16 00:30 in Europe/Berlin (CET = UTC+1)
			const date = new Date("2025-01-15T23:30:00.000Z");
			const existingFiles: string[] = [];

			const result = resolveFilename("Weekly Reviews", date, existingFiles, "Europe/Berlin");

			expect(result).toBe("Weekly Reviews/2025-01-16 Weekly Review.md");
		});
	});
});
