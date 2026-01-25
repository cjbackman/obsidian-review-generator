import { App, Modal, Setting } from "obsidian";
import type { PeriodPreset, CustomRange } from "../types";

const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
	{ value: "current_week", label: "Current week" },
	{ value: "current_month", label: "Current month" },
	{ value: "last_7_days", label: "Last 7 days" },
	{ value: "last_30_days", label: "Last 30 days" },
	{ value: "custom", label: "Custom" },
];

export interface PeriodModalResult {
	preset: PeriodPreset;
	customRange?: CustomRange;
	saveAsDefault: boolean;
}

export class PeriodModal extends Modal {
	private result: PeriodModalResult | null = null;
	private selectedPreset: PeriodPreset;
	private customStartInput: string = "";
	private customEndInput: string = "";
	private saveAsDefault: boolean = false;
	private onSubmit: (result: PeriodModalResult | null) => void;

	constructor(
		app: App,
		defaultPreset: PeriodPreset,
		onSubmit: (result: PeriodModalResult | null) => void
	) {
		super(app);
		this.selectedPreset = defaultPreset;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Select review period" });

		// Preset dropdown
		new Setting(contentEl)
			.setName("Period")
			.setDesc("Select the time range for this review.")
			.addDropdown((dropdown) => {
				PERIOD_PRESETS.forEach((preset) => {
					dropdown.addOption(preset.value, preset.label);
				});
				dropdown.setValue(this.selectedPreset);
				dropdown.onChange((value) => {
					this.selectedPreset = value as PeriodPreset;
					this.renderCustomFields();
				});
			});

		// Container for custom date fields
		this.customFieldsContainer = contentEl.createDiv();
		this.renderCustomFields();

		// Save as default checkbox
		new Setting(contentEl)
			.setName("Save as default")
			.setDesc("Remember this selection as the default for future reviews.")
			.addToggle((toggle) =>
				toggle.setValue(this.saveAsDefault).onChange((value) => {
					this.saveAsDefault = value;
				})
			);

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

		const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => {
			this.result = null;
			this.close();
		});

		const submitBtn = buttonContainer.createEl("button", {
			text: "Generate review",
			cls: "mod-cta",
		});
		submitBtn.addEventListener("click", () => {
			this.submit();
		});
	}

	private customFieldsContainer!: HTMLElement;

	private renderCustomFields() {
		this.customFieldsContainer.empty();

		if (this.selectedPreset === "custom") {
	new Setting(this.customFieldsContainer)
				.setName("Start date")
				.setDesc("Enter the start date for your custom period.")
				.addText((text) =>
					text
						.setPlaceholder("")
						.setValue(this.customStartInput)
						.onChange((value) => {
							this.customStartInput = value;
						})
				);

	new Setting(this.customFieldsContainer)
				.setName("End date")
				.setDesc("Enter the end date for your custom period.")
				.addText((text) =>
					text
						.setPlaceholder("")
						.setValue(this.customEndInput)
						.onChange((value) => {
							this.customEndInput = value;
						})
				);
		}
	}

	private submit() {
		let customRange: CustomRange | undefined;

		if (this.selectedPreset === "custom") {
			const start = new Date(this.customStartInput);
			const end = new Date(this.customEndInput);

			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				// Show error - could enhance with UI feedback
				return;
			}

			customRange = { start, end };
		}

		this.result = {
			preset: this.selectedPreset,
			customRange,
			saveAsDefault: this.saveAsDefault,
		};

		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		this.onSubmit(this.result);
	}
}
