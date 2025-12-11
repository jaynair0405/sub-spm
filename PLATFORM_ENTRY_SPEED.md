# Platform Entry Speed Notes

## Overview
- Platform entry speeds are derived from the distance where the train crosses the start of each platform (halt distance minus platform length).
- Platform lengths come from `reference_data/fast_isd.json` and `reference_data/slow_isd.json`. Each entry is direction-aware, so `VSH-MNKD` and `VSH-SNPD` can hold different values for the same station depending on approach.
- SPM uploads often store distances in meters, so the calculator auto-detects the unit scale and converts platform lengths accordingly before searching for the nearest SPM sample.

## Implementation Highlights
- `platform_entry_speed.py` now:
  - Detects whether halting/SPM distances are in meters or kilometers and normalizes them for reporting.
  - Chooses the correct platform-length record based on travel direction (station-prev or station-next section) before falling back to a global search.
  - Returns entry distances in kilometers to keep downstream visualizations consistent.

## Testing
Run the regression tests whenever the calculator or ISD references change:

```bash
python3 -m pytest -q test_platform_entry_speed.py
```

The suite covers both meter-scale and kilometer-scale scenarios to validate unit detection, section selection, and entry speed extraction.
