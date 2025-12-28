# Sub‑SPM Database Design & Migration Log (Live)

This file is the **single source of truth** for Sub‑SPM DB changes, so your **local** and **server** schemas stay identical.

---

## Current state (as of now)

### Existing tables (already present before changes)
- `div_sub_spm_runs` — run register (already existed)
- `div_sub_spm_points` — **legacy/whole-run points** table (already existed)

### New tables created (safe / non-destructive)
✅ **Step 1 completed** — `div_sub_spm_station_windows` created  
✅ **Step 2 completed** — `div_sub_spm_window_points` created

> We have **NOT** dropped or modified any existing table.

---

## Step 1 — Create station-wise summary table (DONE)

### Purpose
Stores **one row per station per run** with the **final interpreted values** used in reports.
This is the **main reporting table**.

### Table: `div_sub_spm_station_windows` (LOCKED schema)
```sql
CREATE TABLE div_sub_spm_station_windows (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id VARCHAR(64) NOT NULL,

  station_code VARCHAR(10) NOT NULL,

  halt_km DOUBLE NOT NULL,

  platform_length_m INT,
  platform_length_source VARCHAR(50),
  section_key_used VARCHAR(30),

  entry_speed DOUBLE,
  mid_platform_speed DOUBLE,
  one_coach_speed DOUBLE,

  entry_gap_m DOUBLE,
  mid_gap_m DOUBLE,
  one_coach_gap_m DOUBLE,

  train_type VARCHAR(20),

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  INDEX idx_station_windows_run (run_id),
  INDEX idx_station_windows_station (station_code),
  INDEX idx_station_windows_run_station (run_id, station_code),

  CONSTRAINT fk_station_windows_run
    FOREIGN KEY (run_id)
    REFERENCES div_sub_spm_runs(run_id)
    ON DELETE CASCADE
);
```

**Notes**
- `run_id` is **VARCHAR(64)** to match the existing system (`div_sub_spm_runs.run_id`).
- We intentionally **do NOT store** `entry_target_km / mid_target_km / one_coach_target_km`.
- We **DO store** platform length used (`platform_length_m`) so future reporting does not depend on JSON changes.
- We **DO store** the computed outputs (entry/mid/one-coach speeds and gaps) as “frozen truth” for fast reporting.

---

## Step 2 — Create PF-entry→halt evidence table (DONE)

### Purpose
Stores **limited evidence points** only for **PF entry → halt**, per station, per run.
Used for audits and future “re-derive” if offsets change (126→130, 17→20).

### Table: `div_sub_spm_window_points` (LOCKED schema)
```sql
CREATE TABLE div_sub_spm_window_points (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id VARCHAR(64) NOT NULL,

  station_code VARCHAR(10) NOT NULL,
  seq INT NOT NULL,

  cumulative_distance DOUBLE NOT NULL,
  speed DOUBLE,
  psr DOUBLE,
  time_str VARCHAR(16),

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  INDEX idx_window_points_run_station (run_id, station_code),
  INDEX idx_window_points_run_station_seq (run_id, station_code, seq),

  CONSTRAINT fk_window_points_run
    FOREIGN KEY (run_id)
    REFERENCES div_sub_spm_runs(run_id)
    ON DELETE CASCADE
);
```

**Notes**
- `station_code` is required (evidence is station-window scoped).
- `seq` is the index within that station’s window (0..n).
- Existing `div_sub_spm_points` remains untouched.

---

# Step 3 — Pending (NEXT ACTION YOU WILL DO)

> **Update (2025-02-14):** Dual-write is temporarily paused per ops decision. The FastAPI upload endpoint now inserts **only** into `div_sub_spm_station_windows` and `div_sub_spm_window_points` for new runs while leaving `div_sub_spm_points` untouched (read-only for legacy data).

## Goal (Dual-write; no drops yet)
Modify the Sub‑SPM FastAPI backend so **new analyses write to**:
1) `div_sub_spm_station_windows`  ✅ (summary truth)
2) `div_sub_spm_window_points`    ✅ (PF→halt evidence)
…and **also continue writing** to:
3) `div_sub_spm_points` (legacy whole-run points) **for now** *(paused as noted above)*

This is called **dual-write**. It gives safe rollout + easy comparison, but the legacy insert step is currently disabled.

---

## What you need to do (exact checklist)

### A) Locate the code that currently saves to DB
Find the function/endpoint that does:
- insert into `div_sub_spm_runs` (creates/uses `run_id`)
- bulk insert into `div_sub_spm_points` (existing)

This is the place where we will add two new bulk inserts.

### B) Add bulk insert into `div_sub_spm_station_windows`
Insert **one row per station** with:
- `run_id`
- `station_code`
- `halt_km`
- `platform_length_m`, `platform_length_source`, `section_key_used`
- `entry_speed`, `mid_platform_speed`, `one_coach_speed`
- `entry_gap_m`, `mid_gap_m`, `one_coach_gap_m`
- `train_type` (optional)

SQL template:
```sql
INSERT INTO div_sub_spm_station_windows
(run_id, station_code, halt_km,
 platform_length_m, platform_length_source, section_key_used,
 entry_speed, mid_platform_speed, one_coach_speed,
 entry_gap_m, mid_gap_m, one_coach_gap_m,
 train_type)
VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);
```

### C) Add bulk insert into `div_sub_spm_window_points`
Insert **only PF-entry→halt points** (not full run) with:
- `run_id`
- `station_code`
- `seq` (0..n within that station window)
- `cumulative_distance`, `speed`, `psr`, `time_str`

SQL template:
```sql
INSERT INTO div_sub_spm_window_points
(run_id, station_code, seq, cumulative_distance, speed, psr, time_str)
VALUES (%s,%s,%s,%s,%s,%s,%s);
```

### D) Run one analysis and verify counts (DB checks)
```sql
-- Station summary rows per run (expect ~10–25)
SELECT run_id, COUNT(*) AS stations
FROM div_sub_spm_station_windows
GROUP BY run_id
ORDER BY run_id DESC
LIMIT 5;

-- Evidence points per station (expect ~50–60 per station)
SELECT run_id, station_code, COUNT(*) AS pts
FROM div_sub_spm_window_points
GROUP BY run_id, station_code
ORDER BY run_id DESC, station_code
LIMIT 25;
```

---

## What we are NOT doing in Step 3
❌ Do NOT drop `div_sub_spm_points`  
❌ Do NOT rename tables  
❌ Do NOT migrate old runs yet  
✅ Only enable dual-write for **new runs**

---

## After Step 3 is confirmed working
Then we will do Step 4 (later):
- stop writing full-run points (`div_sub_spm_points`)
- optionally rename it to `div_sub_spm_run_points_legacy`
- later decide if it can be dropped after retention/testing

---

## Reference: Design Summary (context)
This step-by-step plan follows the approved design summary you shared earlier:
- store station summary + limited evidence
- do not store full telemetry long-term
