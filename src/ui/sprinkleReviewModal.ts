import { App, Modal } from "obsidian";

export type SprinkleReviewResult = "accept" | "retry" | "reject";

export class SprinkleReviewModal extends Modal {
	private result: SprinkleReviewResult = "reject";
	private response: string;
	private onSubmit: (result: SprinkleReviewResult) => void;

	constructor(app: App, response: string, onSubmit: (result: SprinkleReviewResult) => void) {
		super(app);
		this.response = response;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Review response" });

		const container = contentEl.createDiv({ cls: "sprinkle-review-container" });

		const pre = container.createEl("pre");
		pre.textContent = this.response;

		const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

		const rejectBtn = buttonContainer.createEl("button", { text: "Reject" });
		rejectBtn.addEventListener("click", () => {
			this.result = "reject";
			this.close();
		});

		const retryBtn = buttonContainer.createEl("button", { text: "Retry" });
		retryBtn.addEventListener("click", () => {
			this.result = "retry";
			this.close();
		});

		const acceptBtn = buttonContainer.createEl("button", {
			text: "Accept",
			cls: "mod-cta",
		});
		acceptBtn.addEventListener("click", () => {
			this.result = "accept";
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		this.onSubmit(this.result);
	}
}
