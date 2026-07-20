from importlib.metadata import PackageNotFoundError, version

from latent_space.constants import DISTRIBUTION_NAME

UNKNOWN_VERSION = "0.0.0+unknown"


def get_app_version() -> str:
    """Return the installed distribution version, or a sentinel when unavailable.

    The sentinel is returned when the package is imported without being installed
    (for example running from a source tree with no editable install), so callers
    never have to handle a missing-metadata exception.
    """
    try:
        return version(DISTRIBUTION_NAME)
    except PackageNotFoundError:
        return UNKNOWN_VERSION
