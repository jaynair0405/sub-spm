"""Tests for run_store — the Parquet-on-disk replacement for runs_storage."""

import os
import tempfile
import time
from pathlib import Path

import polars as pl
import pytest

# Point the store at a scratch dir BEFORE importing it (RUNS_DIR is read at import).
os.environ["SPM_RUNS_DIR"] = tempfile.mkdtemp(prefix="spm_runs_test_")

import run_store  # noqa: E402


@pytest.fixture(autouse=True)
def _clean():
    run_store.clear_all()
    yield
    run_store.clear_all()


def _frame(n=5):
    return pl.DataFrame({
        "Date": ["2025-11-30"] * n,
        "Time": [f"10:00:{i:02d}" for i in range(n)],
        "Speed": [float(i * 10) for i in range(n)],
        "Distance": [float(i) for i in range(n)],
        "cumulative_distance": [float(i * 100) for i in range(n)],
    })


def _meta(**over):
    meta = {
        "run_id": "RUN_1",
        "confirmed": False,
        "filename": "TNA KYN.xlsx",
        "staff_id": "H123",
        "motorman_name": "TEST NAME",
        "train_number": "95101",
        "date_of_working": "2025-11-30",
        "unit_number": "6001",
        "row_count": 5,
        # tuple-valued payloads: the reason the sidecar is pickle, not JSON
        "station_window_rows": [("RUN_1", "TNA", 1.5, 270, "isd")],
        "window_point_rows": [("RUN_1", "TNA", 0, 1.5, 45.0, 50, "10:00:01")],
        "overspeed_events": [{"event_number": 1, "max_speed": 88.0}],
    }
    meta.update(over)
    return meta


def test_put_and_load_round_trip():
    run_store.put_run("RUN_1", _frame(), _meta())
    run = run_store.load_run("RUN_1")

    assert run["train_number"] == "95101"
    assert run["row_count"] == 5
    assert len(run["data"]) == 5
    assert run["data"][0]["Speed"] == 0.0
    assert run["data"][4]["cumulative_distance"] == 400.0


def test_tuples_survive_round_trip():
    """The whole reason for pickle over JSON: executemany needs real tuples."""
    run_store.put_run("RUN_1", _frame(), _meta())
    meta = run_store.get_meta("RUN_1")

    assert isinstance(meta["station_window_rows"][0], tuple)
    assert isinstance(meta["window_point_rows"][0], tuple)


def test_load_run_raises_when_absent():
    with pytest.raises(KeyError):
        run_store.load_run("NOPE")


def test_index_is_small_and_does_not_hold_samples():
    run_store.put_run("RUN_1", _frame(200), _meta(row_count=200))
    entry = run_store.get_index("RUN_1")

    assert entry["train_number"] == "95101"
    assert "data" not in entry
    assert "station_window_rows" not in entry


def test_update_meta_persists_and_updates_index():
    run_store.put_run("RUN_1", _frame(), _meta())
    run_store.update_meta("RUN_1", confirmed=True)

    assert run_store.get_meta("RUN_1")["confirmed"] is True
    assert run_store.get_index("RUN_1")["confirmed"] is True


def test_drop_run_deletes_both_files():
    run_store.put_run("RUN_1", _frame(), _meta())
    run_store.drop_run("RUN_1")

    assert not run_store.has_run("RUN_1")
    assert list(Path(run_store.RUNS_DIR).glob("RUN_1.*")) == []


def test_drop_run_is_safe_when_absent():
    run_store.drop_run("NEVER_EXISTED")  # must not raise


def test_cap_evicts_oldest_and_deletes_its_files(monkeypatch):
    monkeypatch.setattr(run_store, "MAX_RUNS", 3)

    for i in range(3):
        run_store.put_run(f"RUN_{i}", _frame(), _meta(run_id=f"RUN_{i}"))
        time.sleep(0.01)  # distinct created_at ordering
    assert len(run_store.list_index()) == 3

    run_store.put_run("RUN_3", _frame(), _meta(run_id="RUN_3"))

    assert len(run_store.list_index()) == 3
    assert not run_store.has_run("RUN_0")          # oldest gone
    assert run_store.has_run("RUN_3")              # newest kept
    assert list(Path(run_store.RUNS_DIR).glob("RUN_0.*")) == []


def test_ttl_expiry_removes_run(monkeypatch):
    run_store.put_run("RUN_1", _frame(), _meta())
    monkeypatch.setattr(run_store, "RUN_TTL_SECONDS", -1)  # everything is expired

    run_store.purge_expired()

    assert not run_store.has_run("RUN_1")
    assert list(Path(run_store.RUNS_DIR).glob("RUN_1.*")) == []


def test_rehydrate_recovers_runs_after_index_loss():
    """Simulates a process restart: files remain, RAM index does not."""
    run_store.put_run("RUN_1", _frame(), _meta())
    run_store._INDEX.clear()

    assert run_store.get_index("RUN_1") is None
    recovered = run_store.rehydrate()

    assert recovered == 1
    assert run_store.get_index("RUN_1")["train_number"] == "95101"
    assert len(run_store.load_run("RUN_1")["data"]) == 5


def test_rehydrate_discards_corrupt_sidecar():
    run_store.put_run("RUN_1", _frame(), _meta())
    run_store._INDEX.clear()
    (Path(run_store.RUNS_DIR) / "RUN_1.meta.pkl").write_bytes(b"not a pickle")

    assert run_store.rehydrate() == 0
    assert not run_store.has_run("RUN_1")


def test_parquet_without_sidecar_is_ignored():
    run_store.put_run("RUN_1", _frame(), _meta())
    run_store._INDEX.clear()
    (Path(run_store.RUNS_DIR) / "RUN_1.meta.pkl").unlink()

    assert run_store.rehydrate() == 0


def test_optional_psr_column_round_trips():
    df = _frame().with_columns(pl.Series("PSR", [50, 50, 60, 60, 60]))
    run_store.put_run("RUN_1", df, _meta())

    rows = run_store.load_run("RUN_1")["data"]
    assert rows[0]["PSR"] == 50
    assert rows[4]["PSR"] == 60
