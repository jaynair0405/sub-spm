## Brake Feel Detection Notes

- **Noise tolerance (Dec 2025)**  
  - Braking phase now ignores up to 3 transient speed increases after the lowest recorded value before finalizing the drop (see `BrakeFeelDetector._find_braking_phase`).  
  - Purpose: avoid treating 1–2 row sensor noise (e.g., 37 → 38 km/h) as the final drop. This keeps the “Speed dropped to” figure aligned with the sustained minimum.

- **Analysis window padding**  
  - `_find_analysis_end_index` now keeps a safety buffer (`max(10, braking_noise_tolerance + stabilization_period + 5)` samples) beyond the first detected halt.  
  - Rationale: the detector needs several points after the braking trough to confirm recovery; previously the window stopped exactly at the halt so recoveries were missed and the entire test was discarded.

- **Validation case**  
  - `Up data - A2.csv` (start time ~`03:44:28`) was used to verify the behaviour. With the above adjustments, the detector reports the correct brake feel test and captures the full drop to 0 km/h.

These changes should stay under review as more runs are analysed; adjust `braking_noise_tolerance` or padding if future datasets exhibit different noise characteristics.
