/** A resolved character offset with optional quoted evidence and explanation. */
export interface FindingLocation {
	index: number;
	text?: string;
	message?: string;
}
