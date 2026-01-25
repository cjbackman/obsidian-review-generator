import type { EvidenceNote, EvidencePack, NoteMetadata } from "./types";

/**
 * Builds an evidence pack from a list of notes for LLM consumption.
 *
 * @param notes - The notes to include (already sorted by mtime desc)
 * @param maxNotes - Maximum number of notes to include
 * @param maxCharsPerNote - Maximum characters per note excerpt
 * @returns Evidence pack with truncated excerpts
 */
export function buildEvidencePack(
	notes: NoteMetadata[],
	maxNotes: number,
	maxCharsPerNote: number
): EvidencePack {
	const totalNotesScanned = notes.length;
	const limitedNotes = notes.slice(0, maxNotes);

	const evidenceNotes: EvidenceNote[] = limitedNotes.map((note) => ({
		path: note.path,
		title: note.title,
		modified: note.mtime.toISOString(),
		excerpt: truncateContent(stripFrontmatter(note.content), maxCharsPerNote),
	}));

	return {
		notes: evidenceNotes,
		totalNotesScanned,
		notesIncluded: evidenceNotes.length,
	};
}

/**
 * Strips YAML frontmatter from content.
 */
function stripFrontmatter(content: string): string {
	const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n?/);
	if (frontmatterMatch) {
		return content.slice(frontmatterMatch[0].length).trim();
	}
	return content;
}

/**
 * Truncates content to a maximum length, preserving word boundaries.
 */
function truncateContent(content: string, maxChars: number): string {
	if (content.length <= maxChars) {
		return content;
	}

	// Reserve space for ellipsis
	const targetLength = maxChars - 3;

	// Find the last space before or at the target length
	const lastSpace = content.lastIndexOf(" ", targetLength);

	// Use word boundary if found, otherwise just cut at target
	const truncateAt = lastSpace > 0 ? lastSpace : targetLength;

	return content.slice(0, truncateAt) + "...";
}
