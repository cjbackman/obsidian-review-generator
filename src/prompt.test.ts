import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt";
import type { EvidencePack, ReviewPeriod } from "./types";

describe("buildPrompt", () => {
	const basePeriod: ReviewPeriod = {
		start: new Date("2025-01-13T00:00:00Z"),
		end: new Date("2025-01-19T23:59:59Z"),
		label: "Current week",
		preset: "current_week",
	};

	const baseEvidence: EvidencePack = {
		notes: [
			{
				path: "projects/feature.md",
				title: "Feature Work",
				modified: "2025-01-15T10:00:00.000Z",
				excerpt: "Implemented new feature",
			},
			{
				path: "journal/daily.md",
				title: "Daily Notes",
				modified: "2025-01-14T08:00:00.000Z",
				excerpt: "Meeting notes and tasks",
			},
		],
		totalNotesScanned: 10,
		notesIncluded: 2,
	};

	describe("period context", () => {
		it("includes period start and end dates", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt).toContain("2025-01-13");
			expect(prompt).toContain("2025-01-19");
		});

		it("includes period label", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt).toContain("Current week");
		});
	});

	describe("note metadata", () => {
		it("includes note paths", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt).toContain("projects/feature.md");
			expect(prompt).toContain("journal/daily.md");
		});

		it("includes note titles", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt).toContain("Feature Work");
			expect(prompt).toContain("Daily Notes");
		});

		it("includes note excerpts", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt).toContain("Implemented new feature");
			expect(prompt).toContain("Meeting notes and tasks");
		});

		it("includes note count information", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt).toContain("2");
			expect(prompt).toContain("10");
		});
	});

	describe("output format instructions", () => {
		it("specifies markdown-only output", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt.toLowerCase()).toContain("markdown");
		});

		it("requests concise output", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt.toLowerCase()).toContain("concise");
		});

		it("requests exactly 3 priorities", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt).toMatch(/exactly\s+3\s+priorities/i);
		});

		it("requests rationale for priorities", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt.toLowerCase()).toContain("rationale");
		});

		it("requests Obsidian links", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt).toMatch(/obsidian|link|wikilink|\[\[/i);
		});

		it("specifies exact section headings", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			expect(prompt).toContain("## Weekly summary");
			expect(prompt).toContain("## Notable work");
			expect(prompt).toContain("## Priorities for next week");
			expect(prompt).toContain("## Notes reviewed");
		});
	});

	describe("system prompt override", () => {
		it("uses custom system prompt when provided", () => {
			const customPrompt = "You are a custom assistant.";
			const prompt = buildPrompt(baseEvidence, basePeriod, customPrompt);

			expect(prompt).toContain(customPrompt);
		});

		it("uses default system prompt when not overridden", () => {
			const prompt = buildPrompt(baseEvidence, basePeriod, undefined);

			// Default prompt should have review-related instructions
			expect(prompt.toLowerCase()).toMatch(/review|summary|priorities/);
		});
	});

	describe("empty notes", () => {
		it("handles empty notes array", () => {
			const emptyEvidence: EvidencePack = {
				notes: [],
				totalNotesScanned: 0,
				notesIncluded: 0,
			};

			const prompt = buildPrompt(emptyEvidence, basePeriod, undefined);

			expect(prompt).toContain("0");
			// Should still include instructions
			expect(prompt).toContain("## Weekly summary");
		});
	});
});
