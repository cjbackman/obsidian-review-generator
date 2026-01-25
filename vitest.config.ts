import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
	resolve: {
		alias: {
			obsidian: resolve(__dirname, "src/__mocks__/obsidian.ts"),
		},
	},
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: [
				"src/period.ts",
				"src/scan.ts",
				"src/evidence.ts",
				"src/prompt.ts",
				"src/llmClient.ts",
				"src/render.ts",
				"src/filenames.ts",
			],
			thresholds: {
				lines: 95,
				functions: 100,
				branches: 90,
				statements: 95,
			},
		},
	},
});
