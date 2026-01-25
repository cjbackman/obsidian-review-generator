import { describe, it, expect } from "vitest";
import { buildEvidencePack } from "./evidence";
import type { NoteMetadata } from "./types";

describe("buildEvidencePack", () => {
	describe("note limiting", () => {
		it("limits notes to maxNotes", () => {
			const notes: NoteMetadata[] = Array.from({ length: 10 }, (_, i) => ({
				path: `note${i}.md`,
				title: `Note ${i}`,
				mtime: new Date(`2025-01-15T${String(i).padStart(2, "0")}:00:00Z`),
				content: `Content ${i}`,
			}));

			const result = buildEvidencePack(notes, 5, 6000);

			expect(result.notes).toHaveLength(5);
			expect(result.totalNotesScanned).toBe(10);
			expect(result.notesIncluded).toBe(5);
		});

		it("includes all notes when fewer than maxNotes", () => {
			const notes: NoteMetadata[] = [
				{ path: "note1.md", title: "Note 1", mtime: new Date("2025-01-15T10:00:00Z"), content: "Content 1" },
				{ path: "note2.md", title: "Note 2", mtime: new Date("2025-01-15T11:00:00Z"), content: "Content 2" },
			];

			const result = buildEvidencePack(notes, 50, 6000);

			expect(result.notes).toHaveLength(2);
			expect(result.totalNotesScanned).toBe(2);
			expect(result.notesIncluded).toBe(2);
		});
	});

	describe("content truncation", () => {
		it("truncates content to maxCharsPerNote", () => {
			const longContent = "A".repeat(100);
			const notes: NoteMetadata[] = [
				{ path: "note.md", title: "Note", mtime: new Date("2025-01-15T10:00:00Z"), content: longContent },
			];

			const result = buildEvidencePack(notes, 50, 50);

			expect(result.notes[0]!.excerpt.length).toBeLessThanOrEqual(50);
		});

		it("adds ellipsis when content is truncated", () => {
			const longContent = "A".repeat(100);
			const notes: NoteMetadata[] = [
				{ path: "note.md", title: "Note", mtime: new Date("2025-01-15T10:00:00Z"), content: longContent },
			];

			const result = buildEvidencePack(notes, 50, 50);

			expect(result.notes[0]!.excerpt.endsWith("...")).toBe(true);
		});

		it("does not add ellipsis when content fits", () => {
			const shortContent = "Short content";
			const notes: NoteMetadata[] = [
				{ path: "note.md", title: "Note", mtime: new Date("2025-01-15T10:00:00Z"), content: shortContent },
			];

			const result = buildEvidencePack(notes, 50, 6000);

			expect(result.notes[0]!.excerpt).toBe(shortContent);
			expect(result.notes[0]!.excerpt.endsWith("...")).toBe(false);
		});

		it("truncates at word boundary when possible", () => {
			const content = "Hello world this is a long sentence that needs truncation";
			const notes: NoteMetadata[] = [
				{ path: "note.md", title: "Note", mtime: new Date("2025-01-15T10:00:00Z"), content: content },
			];

			const result = buildEvidencePack(notes, 50, 25);

			// Should truncate at word boundary ("a" is end of word before space)
			expect(result.notes[0]!.excerpt).toBe("Hello world this is a...");
		});
	});

	describe("metadata transformation", () => {
		it("includes path in evidence note", () => {
			const notes: NoteMetadata[] = [
				{
					path: "folder/note.md",
					title: "Note",
					mtime: new Date("2025-01-15T10:00:00Z"),
					content: "Content",
				},
			];

			const result = buildEvidencePack(notes, 50, 6000);

			expect(result.notes[0]!.path).toBe("folder/note.md");
		});

		it("includes title in evidence note", () => {
			const notes: NoteMetadata[] = [
				{
					path: "note.md",
					title: "My Custom Title",
					mtime: new Date("2025-01-15T10:00:00Z"),
					content: "Content",
				},
			];

			const result = buildEvidencePack(notes, 50, 6000);

			expect(result.notes[0]!.title).toBe("My Custom Title");
		});

		it("formats mtime as ISO string", () => {
			const mtime = new Date("2025-01-15T10:30:00.000Z");
			const notes: NoteMetadata[] = [
				{ path: "note.md", title: "Note", mtime, content: "Content" },
			];

			const result = buildEvidencePack(notes, 50, 6000);

			expect(result.notes[0]!.modified).toBe("2025-01-15T10:30:00.000Z");
		});
	});

	describe("empty input", () => {
		it("returns empty evidence pack for empty notes array", () => {
			const result = buildEvidencePack([], 50, 6000);

			expect(result.notes).toHaveLength(0);
			expect(result.totalNotesScanned).toBe(0);
			expect(result.notesIncluded).toBe(0);
		});
	});

	describe("frontmatter handling", () => {
		it("strips frontmatter from excerpt", () => {
			const content = "---\ntitle: Test\ntags: [a, b]\n---\nActual content here";
			const notes: NoteMetadata[] = [
				{ path: "note.md", title: "Test", mtime: new Date("2025-01-15T10:00:00Z"), content },
			];

			const result = buildEvidencePack(notes, 50, 6000);

			expect(result.notes[0]!.excerpt).not.toContain("---");
			expect(result.notes[0]!.excerpt).toContain("Actual content here");
		});
	});
});
