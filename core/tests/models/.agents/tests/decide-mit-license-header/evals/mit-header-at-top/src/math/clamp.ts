/**
 * Copyright (c) 2026 Lumen Labs
 * Licensed under the MIT License. See LICENSE in the project root.
 */

export const clamp = (value: number, min: number, max: number): number =>
	Math.min(Math.max(value, min), max);
