import os
import subprocess
import sys
from textwrap import dedent


def main() -> int:
    """Run dependency drift checks after branch checkout."""
    from_ref = os.getenv("PRE_COMMIT_FROM_REF")
    to_ref = os.getenv("PRE_COMMIT_TO_REF")
    checkout_type = os.getenv("PRE_COMMIT_CHECKOUT_TYPE")

    if from_ref == to_ref:
        return 0

    if from_ref is None:
        print("PRE_COMMIT_FROM_REF is None, aborting dependency check.")
        return 1

    if to_ref is None:
        print("PRE_COMMIT_TO_REF is None, aborting dependency check.")
        return 1

    # Only check branch checkout events.
    if checkout_type != "1":
        return 0

    watched_files = ["pyproject.toml", "uv.lock"]
    changed_files = filter_changed_files(watched_files, from_ref, to_ref)
    if changed_files:
        print_warning(changed_files)

    return 0


def filter_changed_files(file_names: list[str], previous_ref: str, new_ref: str) -> list[str]:
    """Return watched files that changed between two refs."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", previous_ref, new_ref],
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError:
        return []

    changed = result.stdout.strip().split("\n") if result.stdout.strip() else []
    return [name for name in file_names if name in changed]


def print_warning(changed_files: list[str]) -> None:
    """Print a dependency warning message to the terminal."""
    separator = "=" * 70
    warning_message = dedent(
        f"""
        {separator}
        WARNING: The following files have changed: {", ".join(changed_files)}
        {separator}
        Dependencies may be out of sync.
        Run `make dev` to refresh the virtual environment and hooks.
        {separator}
        """
    )
    print(warning_message)


if __name__ == "__main__":
    sys.exit(main())
