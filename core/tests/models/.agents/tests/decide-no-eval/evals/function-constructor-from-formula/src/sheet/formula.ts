export type Row = Record<string, number>;

export const compileFormula = (formula: string): ((row: Row) => number) =>
	new Function('row', `with (row) { return ${formula}; }`) as (row: Row) => number;

export const applyFormula = (rows: Row[], formula: string): number[] => rows.map(compileFormula(formula));
