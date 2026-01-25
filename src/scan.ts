import type { NoteMetadata, VaultAdapter } from "./types";

/**
 * Scans the vault for notes matching folder and time range criteria.
 *
 * @param vault - The vault adapter to use for file operations
 * @param folders - Folders to scan (empty = scan whole vault)
 * @param start - Start of the time range (inclusive)
 * @param end - End of the time range (inclusive)
 * @returns Notes matching the criteria, sorted by mtime descending
 */
export async function scanNotes(
	vault: VaultAdapter,
	folders: string[],
	start: Date,
	end: Date
): Promise<NoteMetadata[]> {
	// Get all markdown files
	const allFiles = await vault.listMarkdownFiles();

	// Normalize folder paths (remove trailing slashes)
	const normalizedFolders = folders.map((f) => f.replace(/\/$/, ""));

	// Filter by folder
	const folderFiltered =
		normalizedFolders.length === 0
			? allFiles
			: allFiles.filter((file) => isInFolders(file.path, normalizedFolders));

	// Filter by mtime
	const mtimeFiltered = folderFiltered.filter((file) => {
		const mtime = file.mtime.getTime();
		return mtime >= start.getTime() && mtime <= end.getTime();
	});

	// Sort by mtime descending (newest first)
	const sorted = mtimeFiltered.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

	// Load content and extract metadata for each note
	const notes: NoteMetadata[] = await Promise.all(
		sorted.map(async (file) => {
			const content = await vault.readFile(file.path);
			const title = extractTitle(content, file.path);
			return {
				path: file.path,
				title,
				mtime: file.mtime,
				content,
			};
		})
	);

	return notes;
}

/**
 * Checks if a file path is within any of the specified folders.
 */
function isInFolders(filePath: string, folders: string[]): boolean {
	return folders.some((folder) => {
		// Check if the file path starts with the folder path
		return filePath === folder || filePath.startsWith(folder + "/");
	});
}

/**
 * Extracts the title from content (frontmatter) or falls back to filename.
 */
function extractTitle(content: string, filePath: string): string {
	// Try to extract title from frontmatter
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (frontmatterMatch) {
		const frontmatter = frontmatterMatch[1]!;
		const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
		if (titleMatch) {
			// Remove quotes if present
			return titleMatch[1]!.replace(/^["']|["']$/g, "").trim();
		}
	}

	// Fall back to filename without extension
	const filename = filePath.split("/").pop() ?? filePath;
	return filename.replace(/\.md$/, "");
}
