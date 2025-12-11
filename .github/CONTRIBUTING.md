# Contributing to BayKo&ccedil;

Thanks for your interest in contributing!

Please read and follow this guide to help maintainers and contributors work effectively.

## Code of Conduct
By participating, you agree to uphold our [Code of Conduct](./.github/CODE_OF_CONDUCT.md).

## Ways to Contribute
- Report bugs using the appropriate issue template
- Propose new features or enhancements
- Improve documentation
- Review pull requests
- Triage issues

## Getting Started
1. Fork the repository and create your branch from `dev`.
2. Set up your local environment then build and run (Check related README files)

## Branching and commits
- Create topic branches from `dev`:
  - `feature/<short-topic>` for features
  - `docs/<short-topic>` for documentation
  - `fix/<short-topic>` for bug fixes (optional prefix)
- Keep commit messages short and clear (present tense):
  - Examples: `add readme`, `fix login issue`, `update profile form`
  - Reference issues in the PR description (e.g., `Closes #123`).
- Push your branch and open a Pull Request against `dev`.

## Issue Triage
- Label issues appropriately.
- Request more info if a report is unclear.
- Close duplicates linking the canonical issue.

## Coding Standards
- Backend (Python/Django):
  - Python 3.12+, follow PEP 8.
  - Recommended tools: Ruff (lint) and Black (format). If not installed:
    - `pip install ruff black`
    - Lint: `ruff check backend src`
    - Format check: `black --check backend src`
- Frontend (Vite/React):
  - ESLint for linting; Prettier for formatting.
  - Run from `frontend/`:
    - Lint: `npx eslint . --ext .js,.jsx`
    - Format check: `npx prettier --check .`
  - An `.eslintignore` and `.prettierrc` are included under `frontend/`.

## Testing
- Backend (Django): run `python backend/manage.py test`.
- Frontend (Vite): if tests are present, run `npm test` from `frontend/`.
- CI: Pull Requests trigger tests automatically via GitHub Actions.

## Documentation
- Keep README and examples up to date.
- Include docstrings/comments for public APIs and complex logic.
