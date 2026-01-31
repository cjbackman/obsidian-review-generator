/**
 * Builds the prompt for the Sprinkle AI feature.
 *
 * @param userPrompt - The user's instruction for the LLM
 * @param selectedText - The text selected in the editor
 * @returns The prompt string to send to the LLM
 */
export function buildSprinklePrompt(userPrompt: string, selectedText: string): string {
	const instruction = userPrompt.trim()
		? `## Instruction\n${userPrompt.trim()}\n\n`
		: "";

	return `You are a helpful writing assistant working inside a markdown note.

${instruction}## Selected Text
${selectedText}

## Rules
- Output markdown only — no code fences, no explanations, no preamble
- Respond with just the content the user asked for`;
}
