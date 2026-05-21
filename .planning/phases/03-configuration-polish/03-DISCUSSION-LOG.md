# Phase 3: Configuration + Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 03-configuration-polish
**Areas discussed:** Config loading, Config fields, Spinner, Error messages, Config format, Init scaffold

---

## Config Loading Strategy

| Option | Description | Selected |
| ------ | ----------- | -------- |
| cosmiconfig auto-discovery | package.json h2u → .h2uirc → .h2uirc.json → .config/h2uirc | ✓ |
| Simple .h2uirc only | Just read .h2uirc from CWD | |
| TBD | User asked for recommendation | |

**User's choice:** Recommended approach (cosmiconfig)
**Notes:** User agreed to overall recommendation without changes.

---

## Configurable Fields

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Extend split + cssMode | Add split (boolean), cssMode ('module') to existing fields | ✓ |
| Extend with prettier/outputFormat | More ambitious expansion | |

**User's choice:** Recommended approach (extend split + cssMode)
**Notes:** User agreed to overall recommendation.

---

## Spinner & Progress

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Conversion-wide spinner | Spinner during entire pipeline, replaced on completion | ✓ |
| Key operations only | Brief animation on parse/write only, silent otherwise | |
| No spinner | Skip spinner, focus only on error messages | |

**User's choice:** Conversion-wide spinner
**Notes:** Spinner runs throughout pipeline, then replaced with summary output (success + component tree + warnings).

---

## Error Messages

| Option | Description | Selected |
| ------ | ----------- | -------- |
| File suggestions + help hints | File not found suggests similar files, errors hint --help | ✓ |
| Help hints only | No filename suggestions | |
| Config error repair hints | Advanced: detect misconfig and suggest fixes | |

**User's choice:** File suggestions + help hints
**Notes:** Practical level — not too heavy, not too basic.

---

## Config Format

| Option | Description | Selected |
| ------ | ----------- | -------- |
| JSON only | Keep consistent with h2ui init output | ✓ |
| Multi-format (JSON + YAML) | Cosmiconfig supports both | |

**User's choice:** JSON only
**Notes:** Keeps it simple and consistent.

---

## Init Scaffold

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Full config with comments | Generate complete config with all fields + inline explanations | ✓ |
| Minimal format | Keep succinct, just fields | |

**User's choice:** Full config with comments
**Notes:** Config self-documents its available options.

---

## Agent's Discretion

- Spinner text and timing details
- Similar file matching algorithm
- Cosmiconfig explorer configuration
- Error hint wording conventions

---

## Deferred Ideas

- Prettier config integration — can be added later
- Output template customization
- YAML/TOML support — JSON only for v1
- Config validation with separate error reporting layer