/** The ESLint commit the cases are read from; the importer refuses any other checkout. */
export const ESLINT_COMMIT = '48207902fccd37450823b8fd07736d84449ec8e7';

/** One ESLint rule turned into a benchmark Test: the criterion in plain language and the reviewed cases. */
export interface EslintRule {
	rule: string;
	title: string;
	/** The rule as a person would write it in `TEST.md`. */
	statement: string;
	/** The one yes-or-no criterion the decision model is asked. */
	criterion: string;
	error: string;
	/** The first six hex digits of the SHA-256 of each chosen snippet, by the label ESLint gives it. */
	pass: string[];
	fail: string[];
}

/**
 * The rules and cases of the linter tier. Each case was read against the criterion as written, and
 * kept only when ESLint's label follows from that wording alone; cases that turn on a parser detail
 * the criterion does not state were left out. No model was run to choose them.
 */
export const ESLINT_RULES: EslintRule[] = [
	{
		rule: 'default-case-last',
		title: 'Default clause last',
		statement: 'In a switch statement, the default clause comes last.',
		criterion:
			'In every switch statement that has a default clause, the default clause is the last clause.',
		error: 'Move the default clause to the end of the switch statement.',
		pass: ['117dbf', '23e379', '2e93bc', '3347f1', '4505ff', '49f212'],
		fail: ['01cb54', '0bdbc3', '17ae3c', '17dbd0', '6b9534', '80801e']
	},
	{
		rule: 'no-await-in-loop',
		title: 'No await in a loop',
		statement:
			'Code does not await on each turn of a loop. Awaiting once in the part of a loop header that runs a single time is fine, and so is the body of a `for await` loop.',
		criterion:
			'No `await` runs on each iteration of a loop: none appears in a loop body, a loop test, or a loop update expression. An `await` does not count when it is inside a function or class nested in the loop, in the part of a loop header that runs only once, or directly in the body of a `for await` loop.',
		error: 'Collect the promises and await them together, outside the loop.',
		pass: ['041999', '0d5df6', '3e1a5c', '4cdf0c', '5ac225', '6af1d0'],
		fail: ['1a4224', '32cde9', '3655f1', '550f9f', '6afdd8']
	},
	{
		rule: 'no-dupe-keys',
		title: 'No duplicate keys',
		statement: 'An object literal never defines the same key twice.',
		criterion:
			'No object literal defines the same property name twice at the same level, where two keys are the same when they name the same property once converted to a string. Computed keys and keys of nested objects do not count.',
		error: 'Remove or rename the duplicate key.',
		pass: ['0bcaac', '0efaa6', '4b6e8d', '4d4943'],
		fail: ['039c04', '074f0d', '10f2ac', '312138', '33301f', '33d3d0']
	},
	{
		rule: 'no-template-curly-in-string',
		title: 'No template placeholder in a plain string',
		statement:
			'A `${...}` placeholder only appears in a template literal, never in a quoted string.',
		criterion:
			'No string written with single or double quotes contains a `${...}` placeholder; such placeholders appear only inside template literals written with backticks.',
		error: 'Use backticks, or remove the placeholder.',
		pass: ['1be1f2', '42b736', '4c9c86', '7da8c4', '804333', '863eaa'],
		fail: ['0ad9c1', '29554f', '3af665', '5601ed', '875e5f', 'f41e03']
	},
	{
		rule: 'no-unsafe-finally',
		title: 'No control flow out of finally',
		statement: 'A `finally` block never returns, throws, breaks or continues its way out.',
		criterion:
			'No `finally` block contains a `return`, `throw`, `break` or `continue` that leaves the `finally` block itself. One inside a function nested in the block does not count, and neither does a `break` or `continue` whose loop, switch or label is itself inside the block.',
		error: 'Move the statement out of the finally block.',
		pass: ['04c8fc', '1339a9', '1bb764', '45d8a5', '540258', '58c0c4'],
		fail: ['0279d5', '048146', '1285ef', '26f266', '2b359e', '2eb750']
	},
	{
		rule: 'for-direction',
		title: 'For loops count the right way',
		statement: 'A `for` loop moves its counter towards its stop condition, not away from it.',
		criterion:
			'No `for` loop changes its counter in the direction that moves it away from the bound its `<`, `<=`, `>` or `>=` test compares it with.',
		error: 'Reverse the update or the comparison.',
		pass: ['010767', '02c293', '0f2b44', '0f5c3b'],
		fail: ['0dbcf0', '1887e2', '1d8f58', '1e1603', '2ca8db']
	},
	{
		rule: 'no-unreachable',
		title: 'No unreachable code',
		statement: 'No statement sits where execution can never reach it.',
		criterion:
			'No statement is unreachable: none follows a `return`, `throw`, `break` or `continue` that always runs before it. Function declarations and `var` declarations without a value do not count.',
		error: 'Remove the unreachable code.',
		pass: ['029b5c', '03243f', '15b31d', '1add1a', '21305f', '22f624'],
		fail: ['092dfe', '10d9eb', '1ca738', '237949', '24501c', '2c9abb']
	},
	{
		rule: 'getter-return',
		title: 'Getters return a value',
		statement: 'A property getter always returns a value.',
		criterion:
			'Every property getter returns a value on every path through it. A getter is a `get` accessor of an object or class, or a `get` function in a property descriptor passed to Object.defineProperty, Object.defineProperties, Reflect.defineProperty or Object.create.',
		error: 'Return a value from the getter.',
		pass: ['08cdb4', '0e9b86', '1d11bc', '2180ea', '3181ab', '3d4fa7'],
		fail: ['03a602', '07b0ab', '08e62a', '23f5e6', '29a479', '45b0df']
	},
	{
		rule: 'no-compare-neg-zero',
		title: 'No comparison with negative zero',
		statement: 'Code never compares a value with `-0`.',
		criterion: 'The code never compares a value with negative zero, written `-0`.',
		error: 'Use Object.is(x, -0) to test for negative zero.',
		pass: ['0715ae', '0a2d42', '0e44a9', '1019e7'],
		fail: ['07fc9e', '1db5e2', '25715c', '3f7c8a', '5ee710']
	},
	{
		rule: 'no-fallthrough',
		title: 'No silent fallthrough',
		statement:
			'A `case` that has statements does not fall through to the next clause, unless a comment says `falls through`.',
		criterion:
			'No `case` clause that contains statements lets execution fall through into the next clause, unless a comment that says "falls through" or "fall through" sits directly before that next clause. A `case` with no statements may fall through.',
		error: 'End the case with break, or add a falls-through comment.',
		pass: ['08ae5d', '128eac', '12aa3f', '1529bd', '1ab762', '299731'],
		fail: ['42c535', '4bf572', '5ca715', '66e029', '80cbc7', '830e28']
	},
	{
		rule: 'no-useless-catch',
		title: 'No catch that only rethrows',
		statement: 'A `catch` clause does more than rethrow the error it caught.',
		criterion:
			'No `catch` clause consists of nothing but a statement that rethrows the very error it caught.',
		error: 'Remove the try and catch, or handle the error.',
		pass: ['45185e', '466569', '5310c3', '5a12c6', '9058c7', 'ce7dc0'],
		fail: ['12cf5e', '300429', '9d1739', 'a915c2', 'fd66a0']
	}
];
