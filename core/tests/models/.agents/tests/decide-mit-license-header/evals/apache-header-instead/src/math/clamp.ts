/**
 * Copyright (c) 2026 Lumen Labs
 * Licensed under the Apache License, Version 2.0. See LICENSE in the project root.
 */

export const clamp = (value: number, min: number, max: number): number =>
	Math.min(Math.max(value, min), max);
