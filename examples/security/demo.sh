#!/usr/bin/env bash
# Remove a rate limit, run agentests, watch the regression get caught.
# Run from this folder after `bun run build` in core/.
set -u
cd "$(dirname "$0")"
CLI="node ../../core/dist/cli/index.js"

run_against() {
	echo
	echo "=== Mock API: $1 ==="
	$CLI security mock ${2:+--disable "$2"} &
	MOCK=$!
	sleep 1
	$CLI security run
	echo "exit code: $?"
	kill "$MOCK"
	wait "$MOCK" 2>/dev/null
}

run_against "every defense in place"
run_against "rate limit removed" rate-limit
