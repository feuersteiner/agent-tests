/**
 * Limits `value` to the range from `min` to `max`, both inclusive.
 * @throws RangeError when `min` is greater than `max`.
 */
export const clamp = (value: number, min: number, max: number): number => {
	if (min > max) throw new RangeError(`min ${min} is greater than max ${max}`);
	return Math.min(Math.max(value, min), max);
};
