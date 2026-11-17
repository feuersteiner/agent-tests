/**
 * Whether `day` falls within the booking, counting both the first and the last day.
 * Days are numbered from the start of the year.
 */
export const isWithinBooking = (day: number, firstDay: number, lastDay: number): boolean =>
	day > firstDay && day < lastDay;
