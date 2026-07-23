import csv
import io
import logging
import math
import urllib.request
from pathlib import Path

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = REPO_ROOT / "frontend/src/features/loss-curve/banner.data.ts"
REGENERATE_COMMAND = "uv run python utils/generate_playbook_banner.py"

# The Smol Training Playbook space, pinned to an immutable revision so regeneration is
# reproducible. The CSV is the real ablation telemetry behind the playbook's hero banner,
# published under CC-BY 4.0.
SOURCE_REVISION = "fe5248a30ec71f3fa6a3334161ded37b97f14cab"
SOURCE_URL = (
    "https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook/resolve/"
    f"{SOURCE_REVISION}/app/src/content/assets/data/aggregated-loss-data.csv"
)

# Display labels per run-name prefix, in the banner's draw order (alphabetical, matching
# the original's sorted-run grouping). NoPE and WSD are capitalized correctly here even
# though the original legend renders them as "Nope" and "Wsd".
CATEGORY_LABELS: dict[str, str] = {
    "attention_loss": "Attention",
    "batch_size_fix_loss": "Batch Size",
    "doc-masking_loss": "IntraDoc Masking",
    "lr_loss": "Learning Rate",
    "no-wd_loss": "No Weight Decay",
    "nope_loss": "NoPE",
    "tied-embeddings_loss": "Tied Embeddings",
    "wsd_loss": "WSD",
    "zloss_loss": "Z-loss",
}

# The original banner's layout constants: each run is lifted by its global draw index and
# its category index in log10-loss units, which is what turns overlapping curves into the
# waterfall. The alignment window clips every run to the same log-token span.
CATEGORY_GAP = 0.05
RUN_GAP = 0.05
START_PERCENTILE = 0.3
END_PERCENTILE = 0.8

MAX_POINTS_PER_RUN = 120
VIEW_WIDTH = 1000
VIEW_HEIGHT = 340


def fetch_rows(url: str) -> list[dict[str, str]]:
    """Download the aggregated-loss CSV and parse it into dict rows.

    Args:
        url: Fully pinned `resolve` URL of the CSV.

    Returns:
        All data rows, each with `run_name`, `tokens`, and `loss` keys.

    Raises:
        ValueError: If the CSV does not carry the expected columns.
    """
    with urllib.request.urlopen(url, timeout=60) as response:
        text = response.read().decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows or {"run_name", "tokens", "loss"} - set(rows[0]):
        raise ValueError(f"unexpected CSV columns at {url}: {rows[0].keys() if rows else 'empty'}")
    return rows


def keep_run(run_name: str) -> bool:
    """Apply the original banner's run filter: no debug/test runs, no pre-fix batch-size runs."""
    lowered = run_name.lower()
    if "debug" in lowered or "test" in lowered:
        return False
    return not (lowered.startswith("batch_size_loss"))


def short_run_name(run_name: str) -> str:
    """Strip the category prefix and any `DD/MM/YYYY_HH:MM:SS_` stamp from a run name."""
    suffix = run_name.split("+", 1)[1] if "+" in run_name else run_name
    parts = suffix.split("_")
    if len(parts) >= 2 and "/" in parts[0] and ":" in parts[1]:
        return "_".join(parts[2:]) or suffix
    return suffix


def downsample(points: list[tuple[float, float]], limit: int) -> list[tuple[float, float]]:
    """Thin a polyline to at most `limit` points with an even stride, keeping the endpoints."""
    if len(points) <= limit:
        return points
    stride = (len(points) - 1) / (limit - 1)
    return [points[round(i * stride)] for i in range(limit)]


def build_runs(
    rows: list[dict[str, str]],
) -> tuple[list[tuple[str, str, list[tuple[float, float]]]], list[str]]:
    """Group, filter, align, and offset the raw rows into drawable log-log polylines.

    Replicates the playbook banner's transform: log10 both axes, clip every run to the
    percentile alignment window, then lift each run by the cumulative category/run offsets
    so the waterfall reads top-left to bottom-right.

    Args:
        rows: Raw CSV rows.

    Returns:
        A pair of (category key, short run name, offset log-log points) per run in draw
        order, and the ordered category keys that survived filtering.

    Raises:
        ValueError: If a surviving run's category has no entry in `CATEGORY_LABELS`.
    """
    by_run: dict[str, list[tuple[float, float]]] = {}
    for row in rows:
        name = row["run_name"]
        if not keep_run(name):
            continue
        by_run.setdefault(name, []).append(
            (math.log10(float(row["tokens"])), math.log10(float(row["loss"])))
        )

    starts = sorted(min(x for x, _ in pts) for pts in by_run.values())
    ends = sorted(max(x for x, _ in pts) for pts in by_run.values())
    aligned_start = starts[int(len(starts) * START_PERCENTILE)]
    aligned_end = ends[min(len(ends) - 1, int(len(ends) * END_PERCENTILE))]

    categories = sorted({name.split("+", 1)[0] for name in by_run})
    unknown = set(categories) - set(CATEGORY_LABELS)
    if unknown:
        raise ValueError(f"unmapped run categories: {sorted(unknown)}")

    runs: list[tuple[str, str, list[tuple[float, float]]]] = []
    run_index = 0
    for category_index, category in enumerate(categories):
        names = sorted(name for name in by_run if name.split("+", 1)[0] == category)
        for name in names:
            clipped = [
                (x - aligned_start, y)
                for x, y in sorted(by_run[name])
                if aligned_start <= x <= aligned_end
            ]
            offset = category_index * CATEGORY_GAP + run_index * RUN_GAP
            lifted = [(x, y + offset) for x, y in clipped]
            runs.append((category, short_run_name(name), downsample(lifted, MAX_POINTS_PER_RUN)))
            run_index += 1
    return runs, categories


def render_typescript(
    runs: list[tuple[str, str, list[tuple[float, float]]]], categories: list[str]
) -> str:
    """Render `banner.data.ts`, scaling the aligned log-log points into the fixed viewBox."""
    xs = [x for _, _, pts in runs for x, _ in pts]
    ys = [y for _, _, pts in runs for _, y in pts]
    x_span = max(xs) - min(xs)
    y_span = max(ys) - min(ys)

    def to_view(x: float, y: float) -> tuple[float, float]:
        # Higher loss draws nearer the top: SVG y grows downward, so invert the y axis.
        return (
            (x - min(xs)) / x_span * VIEW_WIDTH,
            (max(ys) - y) / y_span * VIEW_HEIGHT,
        )

    lines = [
        "// GENERATED FILE - do not edit by hand.",
        f"// Regenerate with: {REGENERATE_COMMAND}",
        "// Source: HuggingFaceTB/smol-training-playbook (CC-BY 4.0), the real ablation",
        "// telemetry behind the playbook's hero banner (aggregated-loss-data.csv),",
        f"// pinned at revision {SOURCE_REVISION[:12]}.",
        "// Points are log10(tokens) x log10(loss), aligned and waterfall-offset exactly",
        "// like the original, then scaled into the fixed viewBox below.",
        "",
        "export interface BannerRun {",
        "  /** Run-name prefix keying into `BANNER_CATEGORIES`. */",
        "  readonly category: string",
        "  /** Short human name of the run, e.g. `baseline-gqa-4groups`. */",
        "  readonly run: string",
        "  /** SVG polyline `points` string in `BANNER_VIEW` coordinates. */",
        "  readonly points: string",
        "}",
        "",
        f"export const BANNER_VIEW = {{ width: {VIEW_WIDTH}, height: {VIEW_HEIGHT} }} as const",
        "",
        "export const BANNER_CATEGORIES: readonly { key: string; label: string }[] = [",
    ]
    for category in categories:
        lines.append(f"  {{ key: '{category}', label: '{CATEGORY_LABELS[category]}' }},")
    lines.append("]")
    lines.append("")
    lines.append("export const BANNER_RUNS: readonly BannerRun[] = [")
    for category, run, pts in runs:
        joined = " ".join(f"{vx:.1f},{vy:.1f}" for vx, vy in (to_view(x, y) for x, y in pts))
        lines.append(f"  {{ category: '{category}', run: '{run}', points: '{joined}' }},")
    lines.append("]")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    """Fetch the pinned CSV, rebuild the banner geometry, and write `banner.data.ts`."""
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    rows = fetch_rows(SOURCE_URL)
    runs, categories = build_runs(rows)
    OUTPUT_PATH.write_text(render_typescript(runs, categories), encoding="utf-8")
    logger.info("wrote %s: %d runs across %d categories", OUTPUT_PATH, len(runs), len(categories))


if __name__ == "__main__":
    main()
