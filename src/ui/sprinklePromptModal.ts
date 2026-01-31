import { App, Modal } from "obsidian";

export class SprinklePromptModal extends Modal {
	private result: string | null = null;
	private initialValue: string;
	private onSubmit: (result: string | null) => void;

	constructor(app: App, initialValue: string, onSubmit: (result: string | null) => void) {
		super(app);
		this.initialValue = initialValue;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Sprinkle AI" });

		const textarea = contentEl.createEl("textarea", {
			attr: { rows: "6", placeholder: "Enter your instruction..." },
		});
		textarea.style.width = "100%";
		textarea.style.resize = "vertical";
		textarea.value = this.initialValue;

		const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

		const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => {
			this.result = null;
			this.close();
		});

		const submitBtn = buttonContainer.createEl("button", {
			text: "Submit",
			cls: "mod-cta",
		});
		submitBtn.addEventListener("click", () => {
			this.result = textarea.value;
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		this.onSubmit(this.result);
	}
}
