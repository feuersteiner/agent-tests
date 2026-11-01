# Compilation and skills

`compileTest(root, id)` reads an installed `TEST.md` and prints a compilation brief.
It includes the exact source hash, a bounded repository layout, the generator skill,
and the validation/evaluation loop. It does not launch an agent or write `test.yaml`.

`listSkills()` lists bundled workflows; `readSkill('test-generator')` prints the
generator workflow. The skill is embedded in compiled JavaScript and works from a
packed installation without access to this source tree.

Compilation supports a source-only test, rejects unsafe ids and symbolic source
links, and reports ambiguous ids instead of choosing a package silently. Run it
from the owning directory when multiple packages contain the same id.
