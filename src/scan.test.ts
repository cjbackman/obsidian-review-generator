import { describe, it, expect } from "vitest";
import { scanNotes } from "./scan";
import type { VaultAdapter } from "./types";

function createMockVault(
	files: Array<{ path: string; mtime: Date; content: string }>
): VaultAdapter {
	return {
		async listMarkdownFiles() {
			return files.map((f) => ({ path: f.path, mtime: f.mtime }));
		},
		async readFile(path: string) {
			const file = files.find((f) => f.path === path);
			if (!file) throw new Error(`File not found: ${path}`);
			return file.content;
		},
		async createFile() {},
		async fileExists() {
			return false;
		},
		async listFilesInFolder() {
			return [];
		},
	};
}

describe("scanNotes", () => {
	describe("folder filtering", () => {
		it("returns all notes when folders is empty", async () => {
			const files = [
				{ path: "folder1/note1.md", mtime: new Date("2025-01-15T10:00:00Z"), content: "content1" },
				{ path: "folder2/note2.md", mtime: new Date("2025-01-15T11:00:00Z"), content: "content2" },
				{ path: "root.md", mtime: new Date("2025-01-15T12:00:00Z"), content: "content3" },
			];
			const vault = createMockVault(files);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, [], start, end);

			expect(result).toHaveLength(3);
		});

		it("filters notes by specified folders", async () => {
			const files = [
				{ path: "projects/note1.md", mtime: new Date("2025-01-15T10:00:00Z"), content: "content1" },
				{ path: "journal/note2.md", mtime: new Date("2025-01-15T11:00:00Z"), content: "content2" },
				{ path: "archive/note3.md", mtime: new Date("2025-01-15T12:00:00Z"), content: "content3" },
			];
			const vault = createMockVault(files);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, ["projects", "journal"], start, end);

			expect(result).toHaveLength(2);
			expect(result.map((n) => n.path)).toContain("projects/note1.md");
			expect(result.map((n) => n.path)).toContain("journal/note2.md");
		});

		it("includes notes from nested subfolders", async () => {
			const files = [
				{
					path: "projects/sub1/deep/note.md",
					mtime: new Date("2025-01-15T10:00:00Z"),
					content: "content",
				},
				{ path: "projects/note.md", mtime: new Date("2025-01-15T11:00:00Z"), content: "content" },
				{ path: "other/note.md", mtime: new Date("2025-01-15T12:00:00Z"), content: "content" },
			];
			const vault = createMockVault(files);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, ["projects"], start, end);

			expect(result).toHaveLength(2);
			expect(result.map((n) => n.path)).toContain("projects/sub1/deep/note.md");
			expect(result.map((n) => n.path)).toContain("projects/note.md");
		});

		it("handles folder paths with trailing slashes", async () => {
			const files = [
				{ path: "projects/note1.md", mtime: new Date("2025-01-15T10:00:00Z"), content: "content" },
			];
			const vault = createMockVault(files);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, ["projects/"], start, end);

			expect(result).toHaveLength(1);
		});
	});

	describe("mtime filtering", () => {
		it("includes notes within the time range (inclusive)", async () => {
			const start = new Date("2025-01-15T00:00:00Z");
			const end = new Date("2025-01-15T23:59:59Z");
			const files = [
				{ path: "before.md", mtime: new Date("2025-01-14T23:59:59Z"), content: "content" },
				{ path: "at-start.md", mtime: new Date("2025-01-15T00:00:00Z"), content: "content" },
				{ path: "middle.md", mtime: new Date("2025-01-15T12:00:00Z"), content: "content" },
				{ path: "at-end.md", mtime: new Date("2025-01-15T23:59:59Z"), content: "content" },
				{ path: "after.md", mtime: new Date("2025-01-16T00:00:00Z"), content: "content" },
			];
			const vault = createMockVault(files);

			const result = await scanNotes(vault, [], start, end);

			expect(result).toHaveLength(3);
			expect(result.map((n) => n.path)).toContain("at-start.md");
			expect(result.map((n) => n.path)).toContain("middle.md");
			expect(result.map((n) => n.path)).toContain("at-end.md");
		});

		it("excludes notes outside the time range", async () => {
			const start = new Date("2025-01-15T00:00:00Z");
			const end = new Date("2025-01-15T23:59:59Z");
			const files = [
				{ path: "old.md", mtime: new Date("2025-01-01T00:00:00Z"), content: "content" },
				{ path: "future.md", mtime: new Date("2025-02-01T00:00:00Z"), content: "content" },
			];
			const vault = createMockVault(files);

			const result = await scanNotes(vault, [], start, end);

			expect(result).toHaveLength(0);
		});
	});

	describe("sorting", () => {
		it("sorts notes by mtime descending (newest first)", async () => {
			const files = [
				{ path: "oldest.md", mtime: new Date("2025-01-15T08:00:00Z"), content: "content" },
				{ path: "newest.md", mtime: new Date("2025-01-15T16:00:00Z"), content: "content" },
				{ path: "middle.md", mtime: new Date("2025-01-15T12:00:00Z"), content: "content" },
			];
			const vault = createMockVault(files);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, [], start, end);

			expect(result[0]!.path).toBe("newest.md");
			expect(result[1]!.path).toBe("middle.md");
			expect(result[2]!.path).toBe("oldest.md");
		});
	});

	describe("content loading", () => {
		it("loads content for each note", async () => {
			const files = [
				{ path: "note1.md", mtime: new Date("2025-01-15T10:00:00Z"), content: "Content of note 1" },
				{ path: "note2.md", mtime: new Date("2025-01-15T11:00:00Z"), content: "Content of note 2" },
			];
			const vault = createMockVault(files);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, [], start, end);

			expect(result.find((n) => n.path === "note1.md")?.content).toBe("Content of note 1");
			expect(result.find((n) => n.path === "note2.md")?.content).toBe("Content of note 2");
		});
	});

	describe("title extraction", () => {
		it("extracts title from frontmatter", async () => {
			const files = [
				{
					path: "note.md",
					mtime: new Date("2025-01-15T10:00:00Z"),
					content: "---\ntitle: My Custom Title\n---\nContent here",
				},
			];
			const vault = createMockVault(files);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, [], start, end);

			expect(result[0]!.title).toBe("My Custom Title");
		});

		it("uses filename when no frontmatter title", async () => {
			const files = [
				{
					path: "folder/My Note Name.md",
					mtime: new Date("2025-01-15T10:00:00Z"),
					content: "Just content, no frontmatter",
				},
			];
			const vault = createMockVault(files);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, [], start, end);

			expect(result[0]!.title).toBe("My Note Name");
		});

		it("uses filename when frontmatter has no title field", async () => {
			const files = [
				{
					path: "note.md",
					mtime: new Date("2025-01-15T10:00:00Z"),
					content: "---\ntags: [test]\n---\nContent",
				},
			];
			const vault = createMockVault(files);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, [], start, end);

			expect(result[0]!.title).toBe("note");
		});
	});

	describe("empty results", () => {
		it("returns empty array when no notes match", async () => {
			const files = [
				{ path: "old.md", mtime: new Date("2024-01-01T00:00:00Z"), content: "content" },
			];
			const vault = createMockVault(files);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, [], start, end);

			expect(result).toHaveLength(0);
		});

		it("returns empty array when vault is empty", async () => {
			const vault = createMockVault([]);
			const start = new Date("2025-01-01T00:00:00Z");
			const end = new Date("2025-01-31T23:59:59Z");

			const result = await scanNotes(vault, [], start, end);

			expect(result).toHaveLength(0);
		});
	});
});
