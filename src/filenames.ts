/**
 * Resolves a collision-safe filename for a review note.
 *
 * @param outputFolder - The folder to create the file in
 * @param date - The date to use for the filename (local)
 * @param existingFiles - List of existing file paths in the vault
 * @returns The full path for the new file
 */
export function resolveFilename(
	outputFolder: string,
	date: Date,
	existingFiles: string[],
	timezone: string
): string {
	// Format date as YYYY-MM-DD in the local timezone
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const dateStr = formatter.format(date);

	// Normalize output folder (remove trailing slash)
	const folder = outputFolder.replace(/\/$/, "");

	// Base filename without extension
	const baseName = `${dateStr} Weekly Review`;

	// Build the set of existing filenames in this folder for quick lookup
	const existingSet = new Set(existingFiles);

	// Try the base filename first
	const baseFilename = folder ? `${folder}/${baseName}.md` : `${baseName}.md`;
	if (!existingSet.has(baseFilename)) {
		return baseFilename;
	}

	// Find the first available number
	for (let i = 2; i <= 1000; i++) {
		const numberedFilename = folder
			? `${folder}/${baseName} (${i}).md`
			: `${baseName} (${i}).md`;
		if (!existingSet.has(numberedFilename)) {
			return numberedFilename;
		}
	}

	// Fallback (should never happen in practice)
	throw new Error("Could not find available filename after 1000 attempts");
}
