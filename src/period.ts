import type { CustomRange, PeriodPreset, ReviewPeriod } from "./types";

/**
 * Resolves a review period preset to concrete start/end dates.
 *
 * @param preset - The period preset to resolve
 * @param customRange - Required when preset is 'custom'
 * @param now - The current time
 * @param timezone - IANA timezone identifier (e.g., 'Europe/Berlin')
 * @returns Resolved period with start, end, label, and preset
 */
export function resolvePeriod(
	preset: PeriodPreset,
	customRange: CustomRange | undefined,
	now: Date,
	timezone: string
): ReviewPeriod {
	switch (preset) {
		case "current_week":
			return {
				start: getMondayMidnight(now, timezone),
				end: now,
				label: "Current week",
				preset,
			};

		case "current_month":
			return {
				start: getFirstOfMonthMidnight(now, timezone),
				end: now,
				label: "Current month",
				preset,
			};

		case "last_7_days":
			return {
				start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
				end: now,
				label: "Last 7 days",
				preset,
			};

		case "last_30_days":
			return {
				start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
				end: now,
				label: "Last 30 days",
				preset,
			};

		case "custom":
			if (!customRange) {
				throw new Error("Custom range is required when preset is 'custom'");
			}
			return {
				start: customRange.start,
				end: customRange.end,
				label: "Custom range",
				preset,
			};
	}
}

/**
 * Gets the Monday at 00:00:00 in the given timezone for the week containing the given date.
 */
function getMondayMidnight(date: Date, timezone: string): Date {
	// Get the date components in the target timezone
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		weekday: "short",
	});

	const parts = formatter.formatToParts(date);
	const year = parseInt(parts.find((p) => p.type === "year")!.value);
	const month = parseInt(parts.find((p) => p.type === "month")!.value);
	const day = parseInt(parts.find((p) => p.type === "day")!.value);
	const weekday = parts.find((p) => p.type === "weekday")!.value;

	// Map weekday to number (Mon=1, Tue=2, ..., Sun=7)
	const weekdayMap: Record<string, number> = {
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
		Sun: 7,
	};
	const dayOfWeek = weekdayMap[weekday]!;

	// Calculate days to subtract to get to Monday
	const daysToSubtract = dayOfWeek - 1;

	// Create a date for Monday in the target timezone
	const mondayLocal = new Date(year, month - 1, day - daysToSubtract);

	// Get the UTC time for midnight on that Monday in the target timezone
	return getTimezoneLocalMidnight(
		mondayLocal.getFullYear(),
		mondayLocal.getMonth() + 1,
		mondayLocal.getDate(),
		timezone
	);
}

/**
 * Gets the 1st of the month at 00:00:00 in the given timezone.
 */
function getFirstOfMonthMidnight(date: Date, timezone: string): Date {
	// Get the date components in the target timezone
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
	});

	const parts = formatter.formatToParts(date);
	const year = parseInt(parts.find((p) => p.type === "year")!.value);
	const month = parseInt(parts.find((p) => p.type === "month")!.value);

	return getTimezoneLocalMidnight(year, month, 1, timezone);
}

/**
 * Converts a local date (year, month, day) in a timezone to a UTC Date
 * representing midnight in that timezone.
 */
function getTimezoneLocalMidnight(
	year: number,
	month: number,
	day: number,
	timezone: string
): Date {
	// Format a reference date in the target timezone to get the UTC offset
	// We create a date and use the difference between local and UTC representations
	const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00Z`;
	const refDate = new Date(isoDate);

	// Get the local time representation in the target timezone
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});

	const parts = formatter.formatToParts(refDate);
	const localHour = parseInt(parts.find((p) => p.type === "hour")!.value);
	const localMinute = parseInt(parts.find((p) => p.type === "minute")!.value);

	// Calculate offset: if local time is 13:00 when UTC is 12:00, offset is +1 hour
	// Offset in milliseconds from UTC
	const offsetHours = localHour - 12;
	const offsetMinutes = localMinute;
	const offsetMs = (offsetHours * 60 + offsetMinutes) * 60 * 1000;

	// Midnight local = midnight UTC minus the offset
	// If timezone is UTC+1, midnight local is 23:00 UTC the day before
	const midnightLocalAsUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
	return new Date(midnightLocalAsUtcMs - offsetMs);
}
