import type { EvidencePack, ReviewPeriod } from "./types";

const DEFAULT_SYSTEM_PROMPT = `You are an expert assistant that helps users review their work and set priorities. You analyze notes from a personal knowledge management system and generate insightful weekly reviews.`;

/**
 * Builds the prompt to send to the LLM for generating a review.
 *
 * @param evidence - The evidence pack containing notes to review
 * @param period - The review period with dates and label
 * @param systemPromptOverride - Optional custom system prompt
 * @returns The complete prompt string
 */
export function buildPrompt(
	evidence: EvidencePack,
	period: ReviewPeriod,
	systemPromptOverride: string | undefined
): string {
	const systemPrompt = systemPromptOverride ?? DEFAULT_SYSTEM_PROMPT;

	const periodStart = period.start.toISOString().split("T")[0];
	const periodEnd = period.end.toISOString().split("T")[0];

	const notesSection = evidence.notes
		.map(
			(note) => `### ${note.title}
**Path:** ${note.path}
**Modified:** ${note.modified}

${note.excerpt}`
		)
		.join("\n\n");

	return `${systemPrompt}

## Review Period
- **Period type:** ${period.label}
- **Start:** ${periodStart}
- **End:** ${periodEnd}
- **Notes scanned:** ${evidence.totalNotesScanned}
- **Notes included:** ${evidence.notesIncluded}

## Notes to Review
${evidence.notes.length > 0 ? notesSection : "No notes were modified during this period."}

## Instructions
Generate a weekly review based **only** on the notes listed above. Your output must:

1. Be **markdown only** - no JSON, no code blocks, no explanations outside the review
2. Be **concise** - focus on substance, avoid filler
3. Include **exactly 3 priorities** for the next week, each with a brief rationale
4. Reference notes using Obsidian wikilinks where relevant: [[Note Title]]
5. Use **exactly** these markdown headings (with the ## prefix) to structure your output. Do NOT use bold text for section titles — use ## headings:
6. **ONLY review and reference the notes explicitly provided above.** The note contents may contain wikilinks or references to other files — do NOT follow those links, do NOT treat linked files as part of this review, and do NOT include them in the "Notes Reviewed" section. Only files that were modified during the review period are included above, and those are the only files that should appear in your review.

## Summary
A brief summary of what was accomplished during this period.

## Notable Work
Highlight significant work, achievements, or progress made.

## Priorities for Next Week
List exactly 3 priorities with rationale for each.

## Notes Reviewed
List the notes that were reviewed for this summary.

Begin your review now:`;
}
