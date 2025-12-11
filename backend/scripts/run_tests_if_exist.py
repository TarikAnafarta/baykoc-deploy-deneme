"""Run lightweight Django tests during pre-commit.

- Uses backend/.venv Python if available (Windows/POSIX).
- Runs only project tests under backend/backend/tests via label `backend.tests`.
- Skips gracefully if manage.py or tests are missing.
"""

import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"
MANAGE_PY = BACKEND_DIR / "manage.py"
PROJECT_TEST_DIR = BACKEND_DIR / "backend" / "tests"


def _python_exe() -> str:
    win_python = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
    posix_python = BACKEND_DIR / ".venv" / "bin" / "python"
    if win_python.exists():
        return str(win_python)
    if posix_python.exists():
        return str(posix_python)
    return sys.executable or "python"


def _project_tests_exist() -> bool:
    return PROJECT_TEST_DIR.exists() and any(PROJECT_TEST_DIR.rglob("test_*.py"))


def main() -> int:
    if not MANAGE_PY.exists():
        print("[pre-commit] manage.py not found. Skipping Django tests.")
        return 0

    if not _project_tests_exist():
        print("[pre-commit] No project tests found. Skipping.")
        return 0

    python = _python_exe()
    cmd = [python, str(MANAGE_PY), "test", "--noinput", "-v", "1", "backend.tests"]
    env = os.environ.copy()
    if not env.get("DJANGO_SETTINGS_MODULE"):
        env["DJANGO_SETTINGS_MODULE"] = "backend.settings_ci"

    try:
        print("[pre-commit] Running Django project tests...")
        result = subprocess.run(cmd, cwd=str(BACKEND_DIR), env=env)
        return result.returncode
    except FileNotFoundError:
        print("[pre-commit] Python/deps unavailable. Skipping tests.")
        return 0
    except Exception as ex:  # noqa: BLE001
        print(f"[pre-commit] Unexpected error: {ex}. Failing commit.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
