from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class CorridorRecord:
    record_number: str
    inter_station_distances: List[float]
    cumulative_distances: List[float]


@dataclass
class CorridorData:
    name: str
    stations: List[str]
    records: List[CorridorRecord]


def _safe_float(value: str) -> float:
    if value is None:
        return 0.0
    value = value.strip()
    if not value:
        return 0.0
    try:
        return float(value)
    except ValueError:
        return 0.0


def load_corridor_file(path: Path) -> CorridorData:
    with path.open(newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        raise ValueError(f"{path} is empty")

    headers = [h.strip().upper() for h in rows[0][1:] if h.strip()]
    records: List[CorridorRecord] = []

    for row in rows[1:]:
        if not row or not any(cell.strip() for cell in row):
            continue
        record_number = row[0].strip()
        values = [ _safe_float(cell) for cell in row[1:1 + len(headers)] ]
        cumulative = []
        running = 0.0
        for value in values:
            running += value
            cumulative.append(running)
        records.append(
            CorridorRecord(
                record_number=record_number,
                inter_station_distances=values,
                cumulative_distances=cumulative,
            )
        )

    return CorridorData(name=path.stem.upper(), stations=headers, records=records)


class CorridorManager:
    DEFAULT_FILES: Dict[str, str] = {
        "DNFASTLOCALS": "DNFASTLOCALS.csv",
        "UPFASTLOCALS": "UPFASTLOCALS.csv",
        "DNLOCALSNE": "DNLOCALSNE.csv",
        "UPLOCALSNE": "UPLOCALSNE.csv",
        "DNLOCALSSE": "DNLOCALSSE.csv",
        "UPLOCALSSE": "UPLOCALSSE.csv",
        "DNSLOWLOCALS": "DNSLOWLOCALS.csv",
        "UPSLOWLOCALS": "Sub  SPM Data Analysis - UPSLOWLOCALS.csv",
        "DNTHB_PNVL": "DNTHB_PNVL.csv",
        "UPTHB_PNVL": "UPTHB_PNVL.csv",
        "DNTHB_VSH": "DNTHB_VSH.csv",
        "UPTHB_VSH": "UPTHB_VSH.csv",
        "DNHARBOUR": "DNHARBOUR.csv",
        "UPHARBOUR": "UPHARBOUR.csv",
    }

    SLOW_SE_PREFIXES = {"960", "961", "962", "963"}
    SLOW_NE_PREFIXES = {"964", "965", "966"}
    SLOW_GENERAL_PREFIXES = {"970", "971", "972", "973", "974", "975", "976"}
    FAST_PREFIXES = {
        "950",
        "951",
        "952",
        "953",
        "954",
        "955",
        "956",
        "957",
        "958",
        "959",
    }
    TRANS_HARBOUR_PREFIXES = {"990", "992", "993", "994", "995"}
    HARBOUR_PREFIXES = {
        "980",
        "981",
        "982",
        "983",
        "984",
        "985",
        "986",
        "987",
        "988",
        "989",
    }
    PORT_PREFIXES = {"996", "997"}

    SE_STATIONS = {
        "KYN",
        "VLDI",
        "ULNR",
        "ABH",
        "BUD",
        "VGI",
        "SHELU",
        "NRL",
        "BVS",
        "KJT",
        "PDI",
        "KLY",
        "DLY",
        "LWJ",
        "KHPI",
        "CSMT",
        "MSD",
        "SNRD",
        "BY",
        "CHG",
        "CRD",
        "PR",
        "DR",
        "MTN",
        "SION",
        "CLA",
        "VVH",
        "GC",
        "VK",
        "KJMG",
        "BND",
        "NHR",
        "MLND",
        "TNA",
        "KLVA",
        "MBQ",
        "DW",
        "KOPR",
        "DI",
        "THK",
    }
    NE_STATIONS = {
        "KYN",
        "SHD",
        "ABY",
        "TLA",
        "KDV",
        "VSD",
        "ASO",
        "ATG",
        "THS",
        "KE",
        "OMB",
        "KSRA",
        "CSMT",
        "MSD",
        "SNRD",
        "BY",
        "CHG",
        "CRD",
        "PR",
        "DR",
        "MTN",
        "SION",
        "CLA",
        "VVH",
        "GC",
        "VK",
        "KJMG",
        "BND",
        "NHR",
        "MLND",
        "TNA",
        "KLVA",
        "MBQ",
        "DW",
        "KOPR",
        "DI",
        "THK",
    }

    THB_PNVL_STATIONS = {
        "PNVL",
        "JNJ",
        "NEU_THB",
        "SWDV",
        "BEPR",
        "KHAG",
        "MANR",
        "KNDS",
    }
    THB_VSH_STATIONS = {"VSH_THB", "SNPD"}

    def __init__(self, data_root: Path):
        self.data_root = data_root
        self.train_code_map: Dict[str, str] = {}
        self.fast_halt_map: Dict[str, List[str]] = {}
        self.corridors: Dict[str, CorridorData] = {}

    def _normalize_train_number(self, value: str) -> str:
        return value.replace(" ", "").upper()

    def load_train_lookup(self, csv_name: str = "Sub  SPM Data Analysis - All Locals.csv") -> None:
        path = self.data_root / csv_name
        if not path.exists():
            return
        with path.open(newline="") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) < 2:
                    continue
                train_no = self._normalize_train_number(row[0])
                code = row[1].strip()
                if train_no and code:
                    self.train_code_map[train_no] = code

    def load_fast_halts(self, csv_name: str = "fast_locals.csv") -> None:
        path = self.data_root / csv_name
        if not path.exists():
            return
        with path.open(newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                train_no = row.get("Train Number")
                halts = row.get("Halts")
                if not train_no or not halts:
                    continue
                key = self._normalize_train_number(train_no)
                stations = [station.strip().upper() for station in halts.split(",") if station.strip()]
                self.fast_halt_map[key] = stations

    def load_default_corridors(self) -> None:
        for name, relative in self.DEFAULT_FILES.items():
            path = self.data_root / relative
            if not path.exists():
                continue
            try:
                self.corridors[name] = load_corridor_file(path)
            except Exception:
                continue

    def register_uploaded_corridor(self, name: str, file_path: Path) -> CorridorData:
        data = load_corridor_file(file_path)
        self.corridors[name.upper()] = data
        return data

    def get_train_code(self, train_number: str) -> Optional[str]:
        if not train_number:
            return None
        return self.train_code_map.get(self._normalize_train_number(train_number))

    def get_train_halts(self, train_number: str) -> Optional[List[str]]:
        return self.fast_halt_map.get(self._normalize_train_number(train_number))

    def resolve_corridor(self, train_number: str, from_station: str, to_station: str) -> Dict[str, Optional[str]]:
        train_code = self.get_train_code(train_number)
        if not train_code:
            return {"corridor": None, "direction": None, "train_code": None}

        direction = "UP" if int(str(train_code).strip()[-1]) % 2 == 0 else "DN"
        base = self._resolve_base_corridor(train_code, from_station, to_station)
        corridor = f"{direction}{base}" if base else None
        return {
            "corridor": corridor,
            "direction": direction,
            "train_code": str(train_code),
        }

    def _resolve_base_corridor(self, train_code: str, from_station: str, to_station: str) -> Optional[str]:
        prefix = str(train_code).strip()[:3]
        from_station = (from_station or "").strip().upper()
        to_station = (to_station or "").strip().upper()

        if prefix in self.TRANS_HARBOUR_PREFIXES:
            if prefix == "990":
                return "THB_PNVL"
            if prefix in {"994", "995"} or from_station in self.THB_VSH_STATIONS or to_station in self.THB_VSH_STATIONS:
                return "THB_VSH"
            return "THB"

        if prefix in self.HARBOUR_PREFIXES or prefix in self.PORT_PREFIXES:
            return "HARBOUR"

        if prefix in self.FAST_PREFIXES:
            return "FASTLOCALS"

        if prefix in self.SLOW_NE_PREFIXES:
            return "LOCALSNE"

        if prefix in self.SLOW_SE_PREFIXES:
            return "LOCALSSE"

        if prefix in self.SLOW_GENERAL_PREFIXES:
            return "SLOWLOCALS"

        if from_station in self.SE_STATIONS and to_station in self.SE_STATIONS:
            return "LOCALSSE"

        if from_station in self.NE_STATIONS and to_station in self.NE_STATIONS:
            return "LOCALSNE"

        return "SLOWLOCALS"
