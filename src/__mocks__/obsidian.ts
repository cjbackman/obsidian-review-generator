/**
 * Mock obsidian module for testing.
 * This provides stub implementations of Obsidian APIs.
 */

export interface RequestUrlParam {
	url: string;
	method?: string;
	headers?: Record<string, string>;
	body?: string;
	throw?: boolean;
}

export interface RequestUrlResponse {
	status: number;
	json: unknown;
	text: string;
}

// This will be overridden in tests via setRequestUrlImpl
export async function requestUrl(_params: RequestUrlParam): Promise<RequestUrlResponse> {
	throw new Error("requestUrl mock not configured");
}

export class TFile {
	path: string = "";
	stat = { mtime: 0 };
}

export class Plugin {
	app = {};
	async loadData(): Promise<unknown> {
		return {};
	}
	async saveData(_data: unknown): Promise<void> {}
	addCommand(_command: unknown): void {}
	addSettingTab(_tab: unknown): void {}
}

export class PluginSettingTab {
	app = {};
	containerEl = { empty: () => {}, createEl: () => ({}) };
	constructor(_app: unknown, _plugin: unknown) {}
	display(): void {}
}

export class Modal {
	app = {};
	contentEl = { empty: () => {}, createEl: () => ({}), createDiv: () => ({}) };
	constructor(_app: unknown) {}
	open(): void {}
	close(): void {}
	onOpen(): void {}
	onClose(): void {}
}

export class Setting {
	constructor(_containerEl: unknown) {}
	setName(_name: string): this {
		return this;
	}
	setDesc(_desc: string): this {
		return this;
	}
	addText(_cb: (text: unknown) => void): this {
		return this;
	}
	addTextArea(_cb: (textarea: unknown) => void): this {
		return this;
	}
	addToggle(_cb: (toggle: unknown) => void): this {
		return this;
	}
	addDropdown(_cb: (dropdown: unknown) => void): this {
		return this;
	}
	addSlider(_cb: (slider: unknown) => void): this {
		return this;
	}
}

export class Notice {
	constructor(_message: string) {}
}
