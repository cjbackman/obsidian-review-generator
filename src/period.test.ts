import { describe, it, expect } from "vitest";
import { resolvePeriod } from "./period";

const TIMEZONE = "Europe/Berlin";

describe("resolvePeriod", () => {
	describe("current_week preset", () => {
		it("returns Monday 00:00 to now for mid-week date", () => {
			// Wednesday, January 15, 2025, 14:30:00 Berlin time
			const now = new Date("2025-01-15T13:30:00.000Z"); // 14:30 Berlin (UTC+1)
			const result = resolvePeriod("current_week", undefined, now, TIMEZONE);

			expect(result.preset).toBe("current_week");
			expect(result.label).toBe("Current week");
			// Monday Jan 13, 2025, 00:00:00 Berlin = 2025-01-12T23:00:00Z
			expect(result.start.toISOString()).toBe("2025-01-12T23:00:00.000Z");
			expect(result.end.toISOString()).toBe(now.toISOString());
		});

		it("returns Monday 00:00 to now when today is Monday", () => {
			// Monday, January 13, 2025, 10:00:00 Berlin time
			const now = new Date("2025-01-13T09:00:00.000Z"); // 10:00 Berlin (UTC+1)
			const result = resolvePeriod("current_week", undefined, now, TIMEZONE);

			// Monday Jan 13, 2025, 00:00:00 Berlin = 2025-01-12T23:00:00Z
			expect(result.start.toISOString()).toBe("2025-01-12T23:00:00.000Z");
			expect(result.end.toISOString()).toBe(now.toISOString());
		});

		it("returns Monday 00:00 to now when today is Sunday", () => {
			// Sunday, January 19, 2025, 23:00:00 Berlin time
			const now = new Date("2025-01-19T22:00:00.000Z"); // 23:00 Berlin (UTC+1)
			const result = resolvePeriod("current_week", undefined, now, TIMEZONE);

			// Monday Jan 13, 2025, 00:00:00 Berlin = 2025-01-12T23:00:00Z
			expect(result.start.toISOString()).toBe("2025-01-12T23:00:00.000Z");
			expect(result.end.toISOString()).toBe(now.toISOString());
		});

		it("handles week crossing year boundary", () => {
			// Thursday, January 2, 2025, 12:00:00 Berlin time
			const now = new Date("2025-01-02T11:00:00.000Z"); // 12:00 Berlin (UTC+1)
			const result = resolvePeriod("current_week", undefined, now, TIMEZONE);

			// Monday Dec 30, 2024, 00:00:00 Berlin = 2024-12-29T23:00:00Z
			expect(result.start.toISOString()).toBe("2024-12-29T23:00:00.000Z");
			expect(result.end.toISOString()).toBe(now.toISOString());
		});
	});

	describe("current_month preset", () => {
		it("returns 1st of month 00:00 to now", () => {
			// January 15, 2025, 14:30:00 Berlin time
			const now = new Date("2025-01-15T13:30:00.000Z");
			const result = resolvePeriod("current_month", undefined, now, TIMEZONE);

			expect(result.preset).toBe("current_month");
			expect(result.label).toBe("Current month");
			// Jan 1, 2025, 00:00:00 Berlin = 2024-12-31T23:00:00Z
			expect(result.start.toISOString()).toBe("2024-12-31T23:00:00.000Z");
			expect(result.end.toISOString()).toBe(now.toISOString());
		});

		it("works on the first day of the month", () => {
			// February 1, 2025, 08:00:00 Berlin time
			const now = new Date("2025-02-01T07:00:00.000Z");
			const result = resolvePeriod("current_month", undefined, now, TIMEZONE);

			// Feb 1, 2025, 00:00:00 Berlin = 2025-01-31T23:00:00Z
			expect(result.start.toISOString()).toBe("2025-01-31T23:00:00.000Z");
			expect(result.end.toISOString()).toBe(now.toISOString());
		});

		it("handles month crossing year boundary", () => {
			// January 5, 2025, 12:00:00 Berlin time
			const now = new Date("2025-01-05T11:00:00.000Z");
			const result = resolvePeriod("current_month", undefined, now, TIMEZONE);

			// Jan 1, 2025, 00:00:00 Berlin = 2024-12-31T23:00:00Z
			expect(result.start.toISOString()).toBe("2024-12-31T23:00:00.000Z");
		});
	});

	describe("last_7_days preset", () => {
		it("returns now - 7 days to now", () => {
			// January 15, 2025, 14:30:00 Berlin time
			const now = new Date("2025-01-15T13:30:00.000Z");
			const result = resolvePeriod("last_7_days", undefined, now, TIMEZONE);

			expect(result.preset).toBe("last_7_days");
			expect(result.label).toBe("Last 7 days");

			const expectedStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			expect(result.start.toISOString()).toBe(expectedStart.toISOString());
			expect(result.end.toISOString()).toBe(now.toISOString());
		});

		it("crosses month boundary correctly", () => {
			// January 3, 2025, 12:00:00 Berlin time
			const now = new Date("2025-01-03T11:00:00.000Z");
			const result = resolvePeriod("last_7_days", undefined, now, TIMEZONE);

			// 7 days before: December 27, 2024
			const expectedStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			expect(result.start.toISOString()).toBe(expectedStart.toISOString());
		});
	});

	describe("last_30_days preset", () => {
		it("returns now - 30 days to now", () => {
			// January 31, 2025, 14:30:00 Berlin time
			const now = new Date("2025-01-31T13:30:00.000Z");
			const result = resolvePeriod("last_30_days", undefined, now, TIMEZONE);

			expect(result.preset).toBe("last_30_days");
			expect(result.label).toBe("Last 30 days");

			const expectedStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			expect(result.start.toISOString()).toBe(expectedStart.toISOString());
			expect(result.end.toISOString()).toBe(now.toISOString());
		});

		it("crosses year boundary correctly", () => {
			// January 15, 2025
			const now = new Date("2025-01-15T12:00:00.000Z");
			const result = resolvePeriod("last_30_days", undefined, now, TIMEZONE);

			// 30 days before: December 16, 2024
			const expectedStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			expect(result.start.toISOString()).toBe(expectedStart.toISOString());
		});
	});

	describe("custom preset", () => {
		it("uses provided custom range", () => {
			const now = new Date("2025-01-15T13:30:00.000Z");
			const customRange = {
				start: new Date("2025-01-01T00:00:00.000Z"),
				end: new Date("2025-01-10T23:59:59.000Z"),
			};
			const result = resolvePeriod("custom", customRange, now, TIMEZONE);

			expect(result.preset).toBe("custom");
			expect(result.label).toBe("Custom range");
			expect(result.start.toISOString()).toBe(customRange.start.toISOString());
			expect(result.end.toISOString()).toBe(customRange.end.toISOString());
		});

		it("throws error when custom range is missing", () => {
			const now = new Date("2025-01-15T13:30:00.000Z");

			expect(() => resolvePeriod("custom", undefined, now, TIMEZONE)).toThrow(
				"Custom range is required when preset is 'custom'"
			);
		});
	});

	describe("timezone handling", () => {
		it("respects different timezone for current_week", () => {
			// Using America/New_York (UTC-5 in January)
			// Wednesday, January 15, 2025, 02:00:00 UTC = Jan 14, 21:00 EST
			const now = new Date("2025-01-15T02:00:00.000Z");
			const result = resolvePeriod("current_week", undefined, now, "America/New_York");

			// In NY, it's still Tuesday Jan 14, so Monday is Jan 13
			// Monday Jan 13, 2025, 00:00:00 NY = 2025-01-13T05:00:00Z
			expect(result.start.toISOString()).toBe("2025-01-13T05:00:00.000Z");
		});
	});
});
