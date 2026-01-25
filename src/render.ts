import type { ReviewPeriod, ReviewNoteMetadata } from "./types";

/**
 * Renders the complete review note with frontmatter and LLM-generated body.
 *
 * @param llmResponse - The markdown content from the LLM
 * @param period - The review period
 * @param metadata - Metadata for the frontmatter
 * @returns Complete markdown note content
 */
export function renderReviewNote(
	llmResponse: string,
	period: ReviewPeriod,
	metadata: ReviewNoteMetadata
): string {
	const frontmatter = renderFrontmatter(metadata);
	return `${frontmatter}\n${llmResponse}`;
}

/**
 * Renders the YAML frontmatter for the review note.
 */
function renderFrontmatter(metadata: ReviewNoteMetadata): string {
	const scannedFoldersYaml =
		metadata.scannedFolders.length === 0
			? "[]"
			: `\n${metadata.scannedFolders.map((f) => `  - ${f}`).join("\n")}`;

	return `---
week_start: ${metadata.weekStart}
period_start: ${metadata.periodStart}
period_end: ${metadata.periodEnd}
period_preset: ${metadata.periodPreset}
generated_at: ${metadata.generatedAt}
scanned_folders: ${scannedFoldersYaml}
model: ${metadata.model}
---`;
}

/**
 * Gets the Monday of the week containing the given date.
 * Returns YYYY-MM-DD format.
 *
 * @param date - Any date
 * @returns The Monday of that week in YYYY-MM-DD format
 */
export function getWeekStart(date: Date): string {
	// Get the day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
	const dayOfWeek = date.getUTCDay();

	// Calculate days to subtract to get to Monday
	// If Sunday (0), go back 6 days; otherwise go back (dayOfWeek - 1) days
	const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

	// Create new date for Monday
	const monday = new Date(date);
	monday.setUTCDate(monday.getUTCDate() - daysToSubtract);

	// Format as YYYY-MM-DD
	return monday.toISOString().split("T")[0]!;
}
