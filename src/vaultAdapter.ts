import { TFile } from "obsidian";
import type { App } from "obsidian";
import type { VaultAdapter } from "./types";

/**
 * Obsidian implementation of the VaultAdapter interface.
 */
export class ObsidianVaultAdapter implements VaultAdapter {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async listMarkdownFiles(): Promise<Array<{ path: string; mtime: Date }>> {
		const files = this.app.vault.getMarkdownFiles();
		return files.map((file: TFile) => ({
			path: file.path,
			mtime: new Date(file.stat.mtime),
		}));
	}

	async readFile(path: string): Promise<string> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found: ${path}`);
		}
		return this.app.vault.read(file);
	}

	async createFile(path: string, content: string): Promise<void> {
		// Ensure the folder exists
		const folderPath = path.split("/").slice(0, -1).join("/");
		if (folderPath) {
			const folder = this.app.vault.getAbstractFileByPath(folderPath);
			if (!folder) {
				await this.app.vault.createFolder(folderPath);
			}
		}

		await this.app.vault.create(path, content);
	}

	async fileExists(path: string): Promise<boolean> {
		return this.app.vault.getAbstractFileByPath(path) !== null;
	}

	async listFilesInFolder(folder: string): Promise<string[]> {
		const files = this.app.vault.getMarkdownFiles();
		const normalizedFolder = folder.replace(/\/$/, "");

		if (!normalizedFolder) {
			return files.map((f: TFile) => f.path);
		}

		return files
			.filter((f: TFile) => f.path.startsWith(normalizedFolder + "/"))
			.map((f: TFile) => f.path);
	}
}
