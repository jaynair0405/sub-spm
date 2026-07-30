# Report fixtures

`report_fixture_small.json.gz` and `report_fixture_large.json.gz` each hold a
captured `{"meta": ..., "payload": ...}` pair — the `run_store` metadata and the
`build_chart_payload` output for one real analysis. They let the PDF tests and
`scripts/render_sample_pdf.py` run with no server and no database.

| fixture | source | shape |
|---|---|---|
| small | `TNA KYN.xlsx` | 1,664 samples, 3 stations → 1 segment chart |
| large | `csmt-ksra.xlsx` | 8,667 samples, 19 stations → 5 segment charts, 4 platform-entry charts |

The large one is the useful case: enough stations to exercise the multi-chart
grouping and the page-break behaviour.

Tests `pytest.skip` when a fixture is absent, so the suite still runs without them.

## Regenerating

Start the app locally, upload a file through `/upload`, then capture:

```bash
./venv/bin/python - <<'EOF'
import gzip, json, urllib.request
from pathlib import Path

runs = json.load(urllib.request.urlopen("http://127.0.0.1:8766/runs"))["runs"]
for r in runs:
    rid = r["run_id"]
    meta = json.load(urllib.request.urlopen(f"http://127.0.0.1:8766/runs/{rid}"))
    req = urllib.request.Request(
        "http://127.0.0.1:8766/chart_data",
        data=json.dumps({"run_id": rid}).encode(),
        headers={"Content-Type": "application/json"},
    )
    payload = json.load(urllib.request.urlopen(req))
    name = "small" if meta["row_count"] < 5000 else "large"
    out = Path(f"tests/fixtures/report_fixture_{name}.json.gz")
    out.write_bytes(gzip.compress(
        json.dumps({"meta": meta, "payload": payload}, separators=(",", ":")).encode(), 9))
    print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB)")
EOF
```

These were pickles originally. They are gzipped JSON now because this repo is
public: unpickling is a code-execution vector, JSON diffs, and gzip made them 90%
smaller (969 KB → 104 KB). Do not reintroduce pickle here. Note `run_store`'s own
sidecars *do* use pickle, deliberately and for a different reason — they carry
tuples that `executemany` needs, and they never leave the machine that wrote them.

Capture fixtures from runs with **no `staff_id`**, so no real staff name or HRMS ID
ends up committed. Both current fixtures have `motorman_name: ""`.
