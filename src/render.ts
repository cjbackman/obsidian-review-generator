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
export function getWeekStart(date: Date, timezone: string): string {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		weekday: "short",
	});

	const parts = formatter.formatToParts(date);
	const year = parseInt(parts.find((p) => p.type === "year")!.value);
	const month = parseInt(parts.find((p) => p.type === "month")!.value);
	const day = parseInt(parts.find((p) => p.type === "day")!.value);
	const weekday = parts.find((p) => p.type === "weekday")!.value;

	const weekdayMap: Record<string, number> = {
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
		Sun: 7,
	};
	const dayOfWeek = weekdayMap[weekday]!;
	const daysToSubtract = dayOfWeek - 1;

	const mondayLocal = new Date(year, month - 1, day - daysToSubtract);
	const y = mondayLocal.getFullYear();
	const m = String(mondayLocal.getMonth() + 1).padStart(2, "0");
	const d = String(mondayLocal.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}
