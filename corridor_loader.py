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
        # Central Railway - NE Region (NE + Main combined)
        "UPFULLNE_FAST": "UPFULLNE_FAST.csv",
        "UPFULLNE_LOCAL": "UPFULLNE_LOCAL.csv",
        "DNFULLNE_FAST": "DNFULLNE_FAST.csv",
        "DNFULLNE_LOCAL": "DNFULLNE_LOCAL.csv",
        # Central Railway - SE Region (SE + Main combined)
        "UPFULLSE_FAST": "UPFULLSE_FAST.csv",
        "UPFULLSE_LOCAL": "UPFULLSE_LOCAL.csv",
        "DNFULLSE_FAST": "DNFULLSE_FAST.csv",
        "DNFULLSE_LOCAL": "DNFULLSE_LOCAL.csv",
        # Trans-Harbour Line
        "UPTHB_PNVL": "UPTHB_PNVL.csv",
        "DNTHB_PNVL": "DNTHB_PNVL.csv",
        "UPTHB_VSH": "UPTHB_VSH.csv",
        "DNTHB_VSH": "DNTHB_VSH.csv",
        # Harbour Line
        "UPHARBOUR": "UPHARBOUR.csv",
        "DNHARBOUR": "DNHARBOUR.csv",
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
        "KJRD",
        "BND",
        "NHU",
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
        "KJRD",
        "BND",
        "NHU",
        "MLND",
        "TNA",
        "KLVA",
        "MBQ",
        "DW",
        "KOPR",
        "DI",
        "THK",
    }

    # NE-exclusive stations (before KYN junction, not including KYN)
    NE_EXCLUSIVE_STATIONS = {
        "KSRA",
        "OMB",
        "KE",
        "THS",
        "ATG",
        "ASO",
        "VSD",
        "KDV",
        "TLA",
        "ABY",
        "SHD",
    }

    # SE-exclusive stations (before KYN junction, not including KYN)
    SE_EXCLUSIVE_STATIONS = {
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
        self.train_corridor_map: Dict[str, Dict] = {}  # train_number -> {from, to, direction, type, route}

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

    def load_train_corridor_map(self, csv_name: str = "train_corridor_map.csv") -> None:
        """Load train corridor map with From/To stations for each train."""
        path = self.data_root / csv_name
        if not path.exists():
            print(f"[WARNING] {csv_name} not found at {path}")
            return
        with path.open(newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                train_code = row.get("TrainCode", "").strip()
                train_name = row.get("Train", "").strip()
                if not train_code:
                    continue
                # Store by both train code and train name for flexible lookup
                entry = {
                    "train": train_name,
                    "train_code": train_code,
                    "from_station": row.get("FromExpected", "").strip().upper(),
                    "to_station": row.get("ToExpected", "").strip().upper(),
                    "direction": row.get("Direction", "").strip().upper(),
                    "route": row.get("Route", "").strip().upper(),
                    "type": int(row.get("Type", 0) or 0),  # 0=Single, 1=Slow, 2=Fast
                }
                self.train_corridor_map[train_code] = entry
                if train_name:
                    self.train_corridor_map[train_name.upper()] = entry
        print(f"✓ Loaded {len(self.train_corridor_map)} train corridor entries")

    def lookup_train(self, train_number: str) -> Optional[Dict]:
        """Lookup train info by train number or code. Returns From/To/Direction/Type."""
        if not train_number:
            return None
        key = self._normalize_train_number(train_number)
        return self.train_corridor_map.get(key)

    def load_default_corridors(self) -> None:
        for name, relative in self.DEFAULT_FILES.items():
            path = self.data_root / "data" / relative
            if not path.exists():
                continue
            try:
                corridor_data = load_corridor_file(path)
                self.corridors[name] = corridor_data
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

        # Check Trans-Harbour and Harbour routes first
        # THB trains: 990, 992, 993 go to PNVL; 994, 995 go to VSH
        if prefix in self.TRANS_HARBOUR_PREFIXES:
            if prefix in {"994", "995"} or from_station in self.THB_VSH_STATIONS or to_station in self.THB_VSH_STATIONS:
                return "THB_VSH"
            return "THB_PNVL"  # Default: PNVL (990, 992, 993 and others)

        if prefix in self.HARBOUR_PREFIXES or prefix in self.PORT_PREFIXES:
            return "HARBOUR"

        # Central Railway - Simplified logic using FULLNE and FULLSE only
        # PRIORITY 1: Train code prefix determines region for regional trains
        if prefix in self.SLOW_NE_PREFIXES:
            return "FULLNE_LOCAL"

        if prefix in self.SLOW_SE_PREFIXES:
            return "FULLSE_LOCAL"

        # PRIORITY 2: For FAST and GENERAL trains, use stations to determine region
        # Determine train type: FAST or LOCAL
        is_fast = prefix in self.FAST_PREFIXES

        # Check exclusive stations first (before KYN junction)
        from_in_ne_exclusive = from_station in self.NE_EXCLUSIVE_STATIONS
        to_in_ne_exclusive = to_station in self.NE_EXCLUSIVE_STATIONS
        from_in_se_exclusive = from_station in self.SE_EXCLUSIVE_STATIONS
        to_in_se_exclusive = to_station in self.SE_EXCLUSIVE_STATIONS

        # Check full region (includes both exclusive + Main)
        from_in_ne = from_station in self.NE_STATIONS
        to_in_ne = to_station in self.NE_STATIONS
        from_in_se = from_station in self.SE_STATIONS
        to_in_se = to_station in self.SE_STATIONS

        # Region selection logic (for FAST/GENERAL trains based on stations)
        # 1. If ANY exclusive NE station → use FULLNE
        # 2. Else if ANY exclusive SE station → use FULLSE
        # 3. Else if in NE region (Main + KYN) → use FULLNE
        # 4. Else if in SE region (Main + KYN) → use FULLSE
        # 5. Else default to FULLNE
        if from_in_ne_exclusive or to_in_ne_exclusive:
            return "FULLNE_FAST" if is_fast else "FULLNE_LOCAL"
        elif from_in_se_exclusive or to_in_se_exclusive:
            return "FULLSE_FAST" if is_fast else "FULLSE_LOCAL"
        elif from_in_ne or to_in_ne:
            return "FULLNE_FAST" if is_fast else "FULLNE_LOCAL"
        elif from_in_se or to_in_se:
            return "FULLSE_FAST" if is_fast else "FULLSE_LOCAL"
        else:
            # Default to FULLNE for unknown stations
            return "FULLNE_FAST" if is_fast else "FULLNE_LOCAL"
