# Deploy settings agree

No two settings in a deploy config contradict each other, such as a minimum above its maximum, a resource request above its limit, or a feature both enabled and disabled.

Applies to the YAML files in `deploy/`.

Exceptions: equal values, such as a minimum equal to its maximum, are not a contradiction.
