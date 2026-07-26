# Testing & how to show results

## What `.coverage` is
`.coverage` is a binary data file that `coverage.py` writes when tests run. It stores raw line-by-line hit counts for the last run — it is **not human-readable** and is **git-ignored**. You do not show `.coverage` itself; you generate readable reports **from** it.

## Three ways we present results

1. **Terminal summary** — the pass/fail line from `pytest` and `vitest`. Pasted per phase in `log.md`. This is the quickest evidence.
2. **Browsable HTML report** — generated from `.coverage`; open `index.html` in a browser and screenshot it for the report.
   - Backend report lives in `docs/testing/backend-coverage/index.html` (committed).
3. **CI checks (once the repo exists)** — GitHub Actions runs both suites on every push; the green check and a coverage badge are external, timestamped proof.

## Commands

Backend (from `backend/`):
```
.venv/Scripts/python -m coverage run -m pytest
.venv/Scripts/python -m coverage report --include="app/*"      # terminal table
.venv/Scripts/python -m coverage html -d ../docs/testing/backend-coverage
```

Frontend (from `frontend/`):
```
npm test              # pass/fail summary
npm run coverage      # writes coverage/index.html to open and screenshot
```

## Requirements traceability
`log.md` maps each SRS requirement (FR/BR/NFR) to the test that proves it, so a reviewer can trace a rule to a passing test.
