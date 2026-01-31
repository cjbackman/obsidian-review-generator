import { describe, it, expect } from "vitest";
import { renderReviewNote, getWeekStart } from "./render";
import type { ReviewPeriod, ReviewNoteMetadata } from "./types";

describe("renderReviewNote", () => {
	const basePeriod: ReviewPeriod = {
		start: new Date("2025-01-13T00:00:00Z"),
		end: new Date("2025-01-19T23:59:59Z"),
		label: "Current week",
		preset: "current_week",
	};

	const baseMetadata: ReviewNoteMetadata = {
		weekStart: "2025-01-13",
		periodStart: "2025-01-13T00:00:00.000Z",
		periodEnd: "2025-01-19T23:59:59.000Z",
		periodPreset: "current_week",
		generatedAt: "2025-01-19T15:00:00.000Z",
		scannedFolders: ["projects", "journal"],
		model: "llama3.1",
	};

	const llmResponse = `## Weekly summary
This was a productive week.

## Notable work
- Completed feature X
- Fixed bug Y

## Priorities for next week
1. Priority A - rationale
2. Priority B - rationale
3. Priority C - rationale

## Notes reviewed
- [[Note 1]]
- [[Note 2]]`;

	describe("frontmatter", () => {
		it("includes week_start field", () => {
			const result = renderReviewNote(llmResponse, basePeriod, baseMetadata);

			expect(result).toContain("week_start: 2025-01-13");
		});

		it("includes period_start field in ISO format", () => {
			const result = renderReviewNote(llmResponse, basePeriod, baseMetadata);

			expect(result).toContain("period_start: 2025-01-13T00:00:00.000Z");
		});

		it("includes period_end field in ISO format", () => {
			const result = renderReviewNote(llmResponse, basePeriod, baseMetadata);

			expect(result).toContain("period_end: 2025-01-19T23:59:59.000Z");
		});

		it("includes period_preset field", () => {
			const result = renderReviewNote(llmResponse, basePeriod, baseMetadata);

			expect(result).toContain("period_preset: current_week");
		});

		it("includes generated_at field", () => {
			const result = renderReviewNote(llmResponse, basePeriod, baseMetadata);

			expect(result).toContain("generated_at: 2025-01-19T15:00:00.000Z");
		});

		it("includes scanned_folders field", () => {
			const result = renderReviewNote(llmResponse, basePeriod, baseMetadata);

			expect(result).toContain("scanned_folders:");
			expect(result).toContain("projects");
			expect(result).toContain("journal");
		});

		it("includes model field", () => {
			const result = renderReviewNote(llmResponse, basePeriod, baseMetadata);

			expect(result).toContain("model: llama3.1");
		});

		it("wraps frontmatter with --- delimiters", () => {
			const result = renderReviewNote(llmResponse, basePeriod, baseMetadata);

			expect(result).toMatch(/^---\n/);
			expect(result).toMatch(/\n---\n/);
		});
	});

	describe("body content", () => {
		it("includes LLM response in body", () => {
			const result = renderReviewNote(llmResponse, basePeriod, baseMetadata);

			expect(result).toContain("## Weekly summary");
			expect(result).toContain("This was a productive week.");
			expect(result).toContain("## Notable work");
			expect(result).toContain("## Priorities for next week");
			expect(result).toContain("## Notes reviewed");
		});

		it("places body after frontmatter", () => {
			const result = renderReviewNote(llmResponse, basePeriod, baseMetadata);

			const frontmatterEnd = result.indexOf("---\n", 4);
			const bodyStart = result.indexOf("## Weekly summary");

			expect(bodyStart).toBeGreaterThan(frontmatterEnd);
		});
	});

	describe("empty scanned folders", () => {
		it("handles empty scanned_folders array", () => {
			const metadataWithEmptyFolders: ReviewNoteMetadata = {
				...baseMetadata,
				scannedFolders: [],
			};

			const result = renderReviewNote(llmResponse, basePeriod, metadataWithEmptyFolders);

			expect(result).toContain("scanned_folders: []");
		});
	});
});

describe("getWeekStart", () => {
	it("returns Monday for a date in the middle of the week", () => {
		// Wednesday, January 15, 2025
		const date = new Date("2025-01-15T12:00:00Z");
		const result = getWeekStart(date, "UTC");

		expect(result).toBe("2025-01-13");
	});

	it("returns same Monday when date is Monday", () => {
		// Monday, January 13, 2025
		const date = new Date("2025-01-13T12:00:00Z");
		const result = getWeekStart(date, "UTC");

		expect(result).toBe("2025-01-13");
	});

	it("returns Monday of current week when date is Sunday", () => {
		// Sunday, January 19, 2025
		const date = new Date("2025-01-19T12:00:00Z");
		const result = getWeekStart(date, "UTC");

		expect(result).toBe("2025-01-13");
	});

	it("handles week crossing year boundary", () => {
		// Thursday, January 2, 2025
		const date = new Date("2025-01-02T12:00:00Z");
		const result = getWeekStart(date, "UTC");

		// Monday is December 30, 2024
		expect(result).toBe("2024-12-30");
	});

	it("uses local timezone day, not UTC day", () => {
		// 2025-01-12T23:00:00Z = Monday Jan 13 00:00 CET (Europe/Berlin)
		// UTC sees Sunday Jan 12; CET sees Monday Jan 13
		const date = new Date("2025-01-12T23:00:00.000Z");
		const result = getWeekStart(date, "Europe/Berlin");

		expect(result).toBe("2025-01-13");
	});
});
