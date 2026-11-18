# Security policies: model extraction

`agentests security` turns extraction defenses into tests. A policy names an AI API,
sends bounded, deterministic attack traffic at it, and checks that the rate limit,
the quota, and abuse detection still fire. CI fails when one of them regresses.

## Demo

```sh
cd core && bun run build && cd ../examples/security
./demo.sh
```

The script runs the same policy twice: against the mock API with every defense, then
with its rate limit removed.

```
=== Mock API: every defense in place ===
PASS  extraction-rate-limit  rate_limit_enforced: expected true, got true (first rate-limited at request 21 of 60; 39 rejected)
PASS  extraction-alerting  rate_limit_enforced: expected false, got false (no rate-limited response in 40 requests)
PASS  extraction-alerting  detection_event: expected true, got true (1 new detection event(s))
PASS  extraction-quota  quota_enforced: expected true, got true (quota hit at request 61 of 80; every later request rejected)
Result: 3 of 3 security test(s) passed.
exit code: 0

=== Mock API: rate limit removed ===
FAIL  extraction-rate-limit  rate_limit_enforced: expected true, got false (no rate-limited response in 60 requests)
...
Result: 2 of 3 security test(s) passed.
exit code: 1
```

`--disable quota` and `--disable detection` fail the other two Tests the same way.

## The policy

[`agentests.security.yaml`](agentests.security.yaml) is the policy the demo runs.

| Field                                  | Meaning                                                                                                                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target.url`                           | The completion endpoint, called with `POST` and a JSON body.                                                                                                                      |
| `target.environment`                   | `local`, `test`, `staging`, or `production`.                                                                                                                                      |
| `target.body`                          | A JSON template. Its strings can hold `{{prompt}}`, `{{index}}`, `{{scenario}}`, `{{run_id}}`, and `${ENV_VAR}`. The default is `{ prompt: '{{prompt}}' }`.                       |
| `target.headers`, `tests[].headers`    | Request headers. A Test's own headers override the target's, for example to give each Test its own API key.                                                                       |
| `target.signals`                       | How responses are classified. By default, `quota` is status 402, 403, or 429 with a body matching `/quota/i`, and `rate_limit` is any other 429.                                  |
| `target.detection`                     | A `GET` endpoint that returns a JSON array of events, or an object with an `events` array. The runner counts the events before and after each Test and polls for up to `wait_ms`. |
| `tests[].scenario`                     | `sustained-query-volume` sends varied, natural prompts. `systematic-query-pattern` sends one template over a grid of inputs. `quota-exhaustion` sends long-generation prompts.    |
| `tests[].requests`, `duration_seconds` | The number of requests, sent one at a time and spread evenly over the duration. `0` sends them back to back.                                                                      |
| `tests[].expect`                       | `rate_limit_enforced`, `quota_enforced`, and `detection_event`. Each is `true` or `false`. A quota only counts as enforced if no request succeeds after it is hit.                |
| `safety.max_requests`                  | A hard cap on requests for the whole run. The policy is rejected if its Tests add up to more.                                                                                     |
| `safety.allowed_hosts`                 | The hosts besides `localhost`, `127.0.0.1`, and `::1` that the policy may target.                                                                                                 |
| `safety.allow_production`              | A production target needs this to be `true`, and also the `--allow-production` flag on the command line.                                                                          |

Every request carries `x-agentests-run` and `x-agentests-test` headers, so your logs
can tell test traffic apart.

## Commands

```sh
agentests security validate             # check the policy without sending anything
agentests security run [id]             # exit 0 pass, 1 regression, 2 error
agentests security run --json           # the full report with evidence
agentests security mock [--disable rate-limit,quota,detection]
```

## CI

See [`github-actions.yml`](github-actions.yml).

## Out of scope for v0.1

The runner does not replicate models, simulate distributed attacks with key rotation
or many IPs, or do AI-based anomaly detection. The scenarios generate plain synthetic
traffic. They don't train on the responses or keep them.
