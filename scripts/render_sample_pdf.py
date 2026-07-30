#!/usr/bin/env python3
"""
Render a sample SPM report PDF from a captured fixture — no server, no database.

This is the fast iteration loop for PDF layout work: it exercises exactly the same
code path the endpoints use (build_report_model -> build_report_pdf), but reads a
pickled (meta, payload) pair instead of hitting run_store and the DB.

    ./venv/bin/python scripts/render_sample_pdf.py            # both fixtures
    ./venv/bin/python scripts/render_sample_pdf.py small      # just one
    ./venv/bin/python scripts/render_sample_pdf.py small -o /tmp/out.pdf

Fixtures are captured from a real upload; see tests/fixtures/README.md.
"""

import argparse
import gzip
import json
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from report_model import build_report_model  # noqa: E402
from pdf_report import build_report_pdf      # noqa: E402

IST = timezone(timedelta(hours=5, minutes=30))


def render(fixture: Path, out_path: Path) -> None:
    data = json.loads(gzip.decompress(fixture.read_bytes()))
    started = time.time()

    model = build_report_model(
        data["meta"], data["payload"],
        analysis_dt=datetime.now(IST),
        reference_data_dir=ROOT / "reference_data",
    )
    pdf = build_report_pdf(model)
    out_path.write_bytes(pdf)

    meta = data["meta"]
    print(f"  {fixture.stem}")
    print(f"    route      : {meta.get('from_station')} -> {meta.get('to_station')}"
          f"  ({meta.get('row_count')} rows)")
    print(f"    stations   : {len(data['payload'].get('station_markers') or [])}")
    print(f"    elapsed    : {time.time() - started:.2f}s")
    print(f"    size       : {len(pdf) / 1024:.0f} KB")
    print(f"    written to : {out_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("which", nargs="?", choices=["small", "large", "both"],
                        default="both")
    parser.add_argument("-o", "--out", type=Path,
                        help="output path (single fixture only)")
    parser.add_argument("--open", action="store_true",
                        help="open the PDF when done (macOS)")
    args = parser.parse_args()

    names = ["small", "large"] if args.which == "both" else [args.which]
    if args.out and len(names) > 1:
        parser.error("-o requires a single fixture")

    out_dir = Path("/tmp/spm_pdf_preview")
    out_dir.mkdir(parents=True, exist_ok=True)

    for name in names:
        fixture = ROOT / "tests" / "fixtures" / f"report_fixture_{name}.json.gz"
        if not fixture.exists():
            print(f"missing fixture: {fixture}", file=sys.stderr)
            return 1
        out_path = args.out or (out_dir / f"spm_report_{name}.pdf")
        render(fixture, out_path)
        if args.open:
            subprocess.run(["open", str(out_path)], check=False)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
