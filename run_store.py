"""
Run storage for in-flight SPM analyses.

Replaces the old module-level ``runs_storage`` dict in ``main.py``, which held the
full sample list (~4-8 MB per upload) in RAM with no TTL and no cap. It only ever
shrank when the user clicked Discard, so a long-lived process grew without bound —
the cause of ``sub-spm`` sitting at 1.3 GB RSS in production.

This mirrors the approach already proven in the sibling RTIS app
(``~/Desktop/rail-data-app/app.py:60-190``): keep a tiny index in RAM and push the
bulk to disk, with a TTL and a hard cap on concurrent runs.

Layout per run, in ``RUNS_DIR``:

===========================  =========================================================
``{run_id}.parquet``         the polars frame (Date, Time, Speed, Distance,
                             cumulative_distance, PSR?)
``{run_id}.meta.pkl``        everything else — scalars plus violations,
                             overspeed_events, platform_entry_data,
                             station_window_rows, window_point_rows
RAM index                    ~300 bytes per run: enough to answer ``GET /runs``
                             without touching disk
===========================  =========================================================

The sidecar uses **pickle, not JSON**, deliberately. ``station_window_rows`` and
``window_point_rows`` are lists of *tuples* handed straight to ``cur.executemany()``
in ``spm_db.insert_station_windows`` / ``insert_window_points``; JSON would silently
turn them into lists, and float NaN does not round-trip. These are short-lived
temp files owned by this process — never unpickle anything here that another
program wrote, and never expect them to survive a version change (``cleanup_orphans``
deletes anything older than the TTL on startup).
"""

from __future__ import annotations

import os
import pickle
import shutil
import tempfile
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import polars as pl

# --- configuration -----------------------------------------------------------

# Mirrors RTIS app.py:70-71. One hour is long enough to analyse, review the charts
# and click Confirm & Save; short enough that a busy day cannot accumulate much.
RUN_TTL_SECONDS = 60 * 60 * 1
MAX_RUNS = 20

RUNS_DIR = Path(
    os.getenv("SPM_RUNS_DIR") or (Path(tempfile.gettempdir()) / "spm_runs")
)

# Index fields kept in RAM. Anything needed by GET /runs must be listed here,
# otherwise that endpoint has to unpickle every sidecar to answer.
_INDEX_FIELDS = (
    "run_id",
    "confirmed",
    "filename",
    "staff_id",
    "motorman_name",
    "train_number",
    "date_of_working",
    "unit_number",
    "row_count",
    "from_station",
    "to_station",
    "uploaded_at",
)

_INDEX: Dict[str, Dict[str, Any]] = {}
_LOCK = threading.RLock()


# --- paths -------------------------------------------------------------------

def _parquet_path(run_id: str) -> Path:
    return RUNS_DIR / f"{run_id}.parquet"


def _meta_path(run_id: str) -> Path:
    return RUNS_DIR / f"{run_id}.meta.pkl"


def _unlink_quietly(path: Path) -> None:
    try:
        path.unlink()
    except FileNotFoundError:
        pass
    except OSError:
        pass


def _remove_files(run_id: str) -> None:
    _unlink_quietly(_parquet_path(run_id))
    _unlink_quietly(_meta_path(run_id))


# --- housekeeping ------------------------------------------------------------

def purge_expired() -> None:
    """Drop runs older than the TTL from the index and delete their files."""
    now = time.time()
    with _LOCK:
        expired = [
            rid for rid, entry in _INDEX.items()
            if now - entry.get("created_at", 0) > RUN_TTL_SECONDS
        ]
        for rid in expired:
            _INDEX.pop(rid, None)
            _remove_files(rid)


def cleanup_orphans() -> None:
    """
    Delete files on disk older than the TTL.

    Covers the crash case: if the process dies between writing a run and expiring
    it, the index is gone but the files remain. Mirrors RTIS ``_cleanup_orphan_files``.
    """
    now = time.time()
    try:
        RUNS_DIR.mkdir(parents=True, exist_ok=True)
        for path in RUNS_DIR.iterdir():
            if not path.is_file():
                continue
            try:
                if now - path.stat().st_mtime > RUN_TTL_SECONDS:
                    _unlink_quietly(path)
            except OSError:
                continue
    except OSError:
        pass


def rehydrate() -> int:
    """
    Rebuild the RAM index from sidecars still on disk.

    Lets an analysis survive a process restart within its TTL, so ``/chart_data``
    keeps working instead of 410-ing on every in-flight run after a ``pm2 restart``.
    Corrupt or unreadable sidecars are dropped rather than raised — they are
    disposable temp files.

    Returns the number of runs recovered.
    """
    recovered = 0
    try:
        RUNS_DIR.mkdir(parents=True, exist_ok=True)
        for path in sorted(RUNS_DIR.glob("*.meta.pkl")):
            run_id = path.name[: -len(".meta.pkl")]
            if not _parquet_path(run_id).exists():
                _unlink_quietly(path)
                continue
            try:
                with path.open("rb") as fh:
                    meta = pickle.load(fh)
            except Exception:
                _remove_files(run_id)
                continue
            entry = {k: meta.get(k) for k in _INDEX_FIELDS}
            entry["run_id"] = run_id
            try:
                entry["created_at"] = path.stat().st_mtime
            except OSError:
                entry["created_at"] = time.time()
            with _LOCK:
                _INDEX[run_id] = entry
            recovered += 1
    except OSError:
        pass
    return recovered


# --- writing -----------------------------------------------------------------

def _write_atomic(path: Path, write: Any) -> None:
    """Write via a temp file + rename so a reader never sees a partial file."""
    tmp = path.with_suffix(path.suffix + ".tmp")
    try:
        write(tmp)
        os.replace(tmp, path)
    except Exception:
        _unlink_quietly(tmp)
        raise


def put_run(run_id: str, df: pl.DataFrame, meta: Dict[str, Any]) -> None:
    """
    Store a run: frame to Parquet, everything else to a pickle sidecar.

    ``meta`` must NOT contain the sample rows — that is what ``df`` is for.
    Evicts the oldest run when at ``MAX_RUNS``.
    """
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    purge_expired()

    with _LOCK:
        # Evict oldest by creation time when at capacity (RTIS app.py:133-141).
        while len(_INDEX) >= MAX_RUNS:
            oldest = min(_INDEX.items(), key=lambda kv: kv[1].get("created_at", 0))[0]
            _INDEX.pop(oldest, None)
            _remove_files(oldest)

    _write_atomic(_parquet_path(run_id), lambda p: df.write_parquet(p))
    _write_atomic(
        _meta_path(run_id),
        lambda p: p.write_bytes(pickle.dumps(meta, protocol=pickle.HIGHEST_PROTOCOL)),
    )

    entry = {k: meta.get(k) for k in _INDEX_FIELDS}
    entry["run_id"] = run_id
    entry["created_at"] = time.time()
    with _LOCK:
        _INDEX[run_id] = entry


def update_meta(run_id: str, **fields: Any) -> None:
    """Merge ``fields`` into a stored run's sidecar (read-modify-write)."""
    with _LOCK:
        meta = get_meta(run_id)
        if meta is None:
            raise KeyError(run_id)
        meta.update(fields)
        _write_atomic(
            _meta_path(run_id),
            lambda p: p.write_bytes(pickle.dumps(meta, protocol=pickle.HIGHEST_PROTOCOL)),
        )
        entry = _INDEX.get(run_id)
        if entry is not None:
            for key in _INDEX_FIELDS:
                if key in fields:
                    entry[key] = fields[key]


# --- reading -----------------------------------------------------------------

def has_run(run_id: str) -> bool:
    with _LOCK:
        if run_id in _INDEX:
            return True
    return _meta_path(run_id).exists() and _parquet_path(run_id).exists()


def get_index(run_id: str) -> Optional[Dict[str, Any]]:
    with _LOCK:
        entry = _INDEX.get(run_id)
        return dict(entry) if entry else None


def list_index() -> List[Dict[str, Any]]:
    with _LOCK:
        return [dict(entry) for entry in _INDEX.values()]


def get_meta(run_id: str) -> Optional[Dict[str, Any]]:
    """Return the sidecar dict, or None if this run is not stored."""
    path = _meta_path(run_id)
    if not path.exists():
        return None
    try:
        with path.open("rb") as fh:
            return pickle.load(fh)
    except Exception:
        return None


def get_frame(run_id: str) -> pl.DataFrame:
    """Return the run's polars frame. Raises KeyError if the run is gone."""
    path = _parquet_path(run_id)
    if not path.exists():
        raise KeyError(run_id)
    return pl.read_parquet(path)


def get_rows(run_id: str) -> List[Dict[str, Any]]:
    """
    Return the sample rows.

    Deliberately not cached: this is the 4-8 MB object whose retention caused the
    original leak. Callers should let it go out of scope when the request ends.
    """
    return get_frame(run_id).to_dicts()


def load_run(run_id: str) -> Dict[str, Any]:
    """
    Return ``meta`` plus ``{"data": rows}`` — the shape the old ``runs_storage``
    entries had, so call sites read the same as before.

    Raises KeyError when the run has expired, been evicted, or never existed.
    """
    meta = get_meta(run_id)
    if meta is None:
        raise KeyError(run_id)
    run = dict(meta)
    run["data"] = get_rows(run_id)
    return run


def drop_run(run_id: str) -> None:
    """Remove a run from the index and delete both files. Safe if absent."""
    with _LOCK:
        _INDEX.pop(run_id, None)
    _remove_files(run_id)


def clear_all() -> None:
    """Wipe the index and the directory. Tests only."""
    with _LOCK:
        _INDEX.clear()
    try:
        shutil.rmtree(RUNS_DIR)
    except FileNotFoundError:
        pass
    RUNS_DIR.mkdir(parents=True, exist_ok=True)


# Mirrors RTIS app.py:188 — sweep stale files, then recover anything still valid.
cleanup_orphans()
rehydrate()
