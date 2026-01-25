import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { LLMConfig } from "./types";
import { callLLM, LLMError, setRequestUrlImpl, resetRequestUrlImpl, type RequestUrlFn } from "./llmClient";
import type { RequestUrlParam, RequestUrlResponse } from "obsidian";

// Mock requestUrl function
const mockRequestUrl = vi.fn<RequestUrlFn>();

describe("callLLM", () => {
	const baseConfig: LLMConfig = {
		baseUrl: "http://localhost:11434",
		endpointPath: "/api/chat",
		model: "llama3.1",
		temperature: 0.2,
		maxTokens: 1000,
		timeoutSeconds: 60,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		setRequestUrlImpl(mockRequestUrl);
	});

	afterEach(() => {
		resetRequestUrlImpl();
	});

	describe("successful requests", () => {
		it("returns LLM response content on success", async () => {
			const mockResponse = {
				message: {
					content: "## Weekly summary\nThis was a productive week.",
				},
			};
			mockRequestUrl.mockResolvedValueOnce({
				status: 200,
				json: mockResponse,
			} as RequestUrlResponse);

			const result = await callLLM(baseConfig, "Test prompt");

			expect(result).toBe("## Weekly summary\nThis was a productive week.");
		});

		it("sends correct request body", async () => {
			mockRequestUrl.mockResolvedValueOnce({
				status: 200,
				json: { message: { content: "Response" } },
			} as RequestUrlResponse);

			await callLLM(baseConfig, "Test prompt");

			expect(mockRequestUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					url: "http://localhost:11434/api/chat",
					method: "POST",
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
				})
			);

			const calls = mockRequestUrl.mock.calls as [RequestUrlParam][];
			const callArgs = calls[0]![0];
			const body = JSON.parse(callArgs.body as string) as {
				options: { temperature: number; num_predict: number };
				stream: boolean;
			};
			expect(body.options.temperature).toBe(0.2);
			expect(body.options.num_predict).toBe(1000);
			expect(body.stream).toBe(false);
		});

		it("includes API key header when configured", async () => {
			const configWithApiKey: LLMConfig = {
				...baseConfig,
				apiKeyHeaderName: "Authorization",
				apiKeyHeaderValue: "Bearer test-key",
			};
			mockRequestUrl.mockResolvedValueOnce({
				status: 200,
				json: { message: { content: "Response" } },
			} as RequestUrlResponse);

			await callLLM(configWithApiKey, "Test prompt");

			expect(mockRequestUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					headers: expect.objectContaining({
						Authorization: "Bearer test-key",
					}),
				})
			);
		});
	});

	describe("error handling", () => {
		it("throws LLMError on HTTP error response", async () => {
			mockRequestUrl.mockResolvedValueOnce({
				status: 500,
				json: {},
			} as RequestUrlResponse);

			await expect(callLLM(baseConfig, "Test prompt")).rejects.toThrow(LLMError);
			mockRequestUrl.mockResolvedValueOnce({
				status: 500,
				json: {},
			} as RequestUrlResponse);
			await expect(callLLM(baseConfig, "Test prompt")).rejects.toThrow(/500/);
		});

		it("throws LLMError when response missing message content", async () => {
			mockRequestUrl.mockResolvedValueOnce({
				status: 200,
				json: { unexpected: "format" },
			} as RequestUrlResponse);

			await expect(callLLM(baseConfig, "Test prompt")).rejects.toThrow(LLMError);
			mockRequestUrl.mockResolvedValueOnce({
				status: 200,
				json: { unexpected: "format" },
			} as RequestUrlResponse);
			await expect(callLLM(baseConfig, "Test prompt")).rejects.toThrow(/unexpected response/i);
		});
	});

	describe("retry logic", () => {
		it("retries once on network failure", async () => {
			mockRequestUrl
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce({
					status: 200,
					json: { message: { content: "Success on retry" } },
				} as RequestUrlResponse);

			const result = await callLLM(baseConfig, "Test prompt");

			expect(result).toBe("Success on retry");
			expect(mockRequestUrl).toHaveBeenCalledTimes(2);
		});

		it("does not retry more than once", async () => {
			mockRequestUrl
				.mockRejectedValueOnce(new Error("Network error 1"))
				.mockRejectedValueOnce(new Error("Network error 2"));

			await expect(callLLM(baseConfig, "Test prompt")).rejects.toThrow(LLMError);
			expect(mockRequestUrl).toHaveBeenCalledTimes(2);
		});

		it("does not retry on HTTP error (non-network failure)", async () => {
			mockRequestUrl.mockResolvedValueOnce({
				status: 400,
				json: {},
			} as RequestUrlResponse);

			await expect(callLLM(baseConfig, "Test prompt")).rejects.toThrow(LLMError);
			expect(mockRequestUrl).toHaveBeenCalledTimes(1);
		});
	});

});
