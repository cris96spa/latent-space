import subprocess
import tomllib
from pathlib import Path


def _run(command: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    """Run a subprocess command and return the completed process."""
    return subprocess.run(command, check=check, text=True, capture_output=True)


def _current_branch() -> str:
    """Return the currently checked-out git branch."""
    result = _run(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    return result.stdout.strip()


def _has_staged_changes() -> bool:
    """Return True when the index has staged modifications."""
    result = _run(["git", "diff", "--staged", "--quiet"], check=False)
    return result.returncode != 0


def _load_version(pyproject_path: Path) -> str:
    """Load the project version from pyproject.toml."""
    pyproject_content = pyproject_path.read_text(encoding="utf-8")
    pyproject_data: dict = tomllib.loads(pyproject_content)
    return str(pyproject_data["project"]["version"])


def _branch_exists_locally(branch_name: str) -> bool:
    """Return True when a local branch with the given name already exists."""
    result = _run(["git", "branch", "--format=%(refname:short)"])
    local_branches = [branch.strip() for branch in result.stdout.splitlines() if branch.strip()]
    return branch_name in local_branches


def _files_to_stage() -> list[str]:
    """Return versioning files that exist and should be committed."""
    candidates = [Path("pyproject.toml"), Path("uv.lock"), Path("CHANGELOG.md")]
    return [str(path) for path in candidates if path.exists()]


def _print_error(message: str, stderr: str) -> None:
    """Print a user-facing error message and optional stderr details."""
    print(message)
    if stderr.strip():
        print(stderr.strip())


def _ensure_release_context(active_branch: str) -> bool:
    """Validate branch and staged-state preconditions for a release bump."""
    if active_branch != "main":
        print("to upgrade version, you should be on 'main' branch")
        print("change branch and try again")
        return False

    if _has_staged_changes():
        print("to upgrade version, there must be no staged file")
        print("clear stage and try again")
        return False

    return True


def _pull_main_branch() -> bool:
    """Fast-forward local main from origin/main."""
    print("updating main branch using 'git pull --ff-only'")
    pull_result = _run(["git", "pull", "--ff-only", "origin", "main"], check=False)
    if pull_result.returncode == 0:
        return True

    _print_error("git pull did not run successfully, aborting", pull_result.stderr)
    return False


def _refresh_lockfile() -> bool:
    """Regenerate lock metadata before creating bump commit."""
    lock_result = _run(["uv", "lock"], check=False)
    if lock_result.returncode == 0:
        return True

    _print_error("uv lock failed, aborting", lock_result.stderr)
    return False


def _confirm_bump(version: str) -> bool:
    """Ask user confirmation before creating the release branch."""
    proceed = ""
    while proceed not in {"y", "n", ""}:
        proceed = input(f"Upgrading to version v{version}. Do you wish to proceed? [y/N]").lower()
    return proceed == "y"


def _create_bump_branch(branch_name: str) -> bool:
    """Create a new local branch for the release bump commit."""
    checkout_result = _run(["git", "checkout", "-b", branch_name], check=False)
    if checkout_result.returncode == 0:
        return True

    _print_error(f"cannot checkout to new branch {branch_name}", checkout_result.stderr)
    return False


def _commit_release_files(version: str) -> bool:
    """Stage and commit release metadata files."""
    files_to_add = _files_to_stage()
    if not files_to_add:
        print("no release files found to stage, aborting")
        return False

    _run(["git", "add", *files_to_add])

    commit_message = f"chore(release): bump version to v{version}"
    commit_result = _run(["git", "commit", "-m", commit_message], check=False)
    if commit_result.returncode == 0:
        print("version bump committed")
        return True

    _print_error("git commit failed", commit_result.stderr)
    return False


def _push_release_branch(branch_name: str) -> bool:
    """Push the release branch to origin."""
    push_result = _run(["git", "push", "--set-upstream", "origin", branch_name], check=False)
    if push_result.returncode == 0:
        return True

    _print_error("git push failed, try to push again manually", push_result.stderr)
    return False


def main() -> int:
    """Create a version bump branch, commit, and push release metadata files."""
    active_branch = _current_branch()
    print(f"active branch: {active_branch}")

    if not _ensure_release_context(active_branch):
        return 1

    if not _pull_main_branch():
        return 1

    version = _load_version(Path("pyproject.toml"))

    if not _refresh_lockfile():
        return 1

    bump_branch_name = f"bump-v{version}"
    if _branch_exists_locally(bump_branch_name):
        print(f"upgrade script has to create branch '{bump_branch_name}', but already exists")
        return 1

    if not _confirm_bump(version):
        print("upgrade interrupted")
        return 0

    if not _create_bump_branch(bump_branch_name):
        return 1

    if not _commit_release_files(version):
        return 1

    if not _push_release_branch(bump_branch_name):
        return 1

    print("version bump pushed")
    print("remember to open a PR: a new tag will be registered after merge")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
