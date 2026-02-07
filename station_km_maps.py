"""
Station kilometer post mapping functions.
These provide official kilometer posts (in meters) for different train types and corridors.
Converted from modifiedscripts.js (GAS app) functions.
"""

def get_fast_station_km_map():
    """
    Returns official kilometer posts (in meters) for fast train corridor stations.
    Converted from modifiedscripts.js getFastStationKMMap()

    Fast trains skip intermediate stations between major stops.
    """
    return {
        "CSMT": 100.0,      # 0.1 km
        "BY": 4040.0,       # 4.04 km
        "PR": 7650.0,       # 7.65 km
        "DR": 8850.0,       # 8.85 km
        "MTN": 10120.0,     # 10.12 km
        "SION": 12710.0,    # 12.71 km
        "CLA": 15390.0,     # 15.39 km
        "GC": 19300.0,      # 19.3 km
        "VK": 22850.0,      # 22.85 km
        "BND": 26560.0,     # 26.56 km
        "MLND": 30560.0,    # 30.56 km
        "TNA": 33020.0,     # 33.02 km
        "KLVA": 35400.0,    # 35.4 km
        "MBQ": 39980.0,     # 39.98 km
        "DW": 42460.0,      # 42.46 km
        "DI": 48060.0,      # 48.06 km
        "KYN": 53210.0,     # 53.21 km

        # KYN-KSRA section (NE branch)
        "SHD": 56250.0,     # 56.25 km
        "ABY": 57960.0,     # 57.96 km
        "TLA": 64050.0,     # 64.05 km
        "KDV": 71400.0,     # 71.40 km
        "VSD": 79400.0,     # 79.40 km
        "ASO": 85430.0,     # 85.43 km
        "ATG": 94870.0,     # 94.87 km
        "THS": 101000.0,    # 101.00 km
        "KE": 107030.0,     # 107.03 km
        "OMB": 113430.0,    # 113.43 km
        "KSRA": 120560.0,   # 120.56 km

        # KYN-KJT/KHPI section (SE branch)
        "VLDI": 55590.0,    # 55.59 km
        "ULNR": 57290.0,    # 57.29 km
        "ABH": 59900.0,     # 59.90 km
        "BUD": 67260.0,     # 67.26 km
        "VGI": 77990.0,     # 77.99 km
        "SHELU": 82090.0,   # 82.09 km
        "NRL": 86120.0,     # 86.12 km
        "BVS": 92850.0,     # 92.85 km
        "KJT": 99720.0,     # 99.72 km
        "PDI": 102920.0,    # 102.92 km
        "KLY": 107860.0,    # 107.86 km
        "DLY": 108430.0,    # 108.43 km
        "LWJ": 111580.0,    # 111.58 km
        "KHPI": 114240.0,   # 114.24 km
    }


def get_slow_station_km_map():
    """
    Returns official kilometer posts (in meters) for slow/general train corridor stations.
    Converted from modifiedscripts.js getStationKMMap()

    Includes all intermediate stations that slow trains stop at.
    """
    return {
        # Panvel - CSMT section (South)
        "PNVL": 48940.0,    # 48.940 km
        "KNDS": 45380.0,    # 45.380 km
        "MANR": 43170.0,    # 43.170 km
        "KHAG": 40170.0,    # 40.170 km
        "BEPR": 38220.0,    # 38.220 km
        "SWDV": 35840.0,    # 35.840 km
        "NEU": 34470.0,     # 34.470 km
        "JNJ": 31340.0,     # 31.340 km
        "SNPD": 30030.0,    # 30.03 km
        "VSH": 28890.0,     # 28.890 km
        "MNKD": 21120.0,    # 21.120 km
        "GV": 18990.0,      # 18.99 km
        "CMBR": 17330.0,    # 17.33 km
        "TKNG": 16410.0,    # 16.41 km
        "CLA": 14600.0,     # 14.60 km
        "CHF": 13680.0,     # 13.680 km
        "GTBN": 11480.0,    # 11.480 km
        "VDLR": 9110.0,     # 9.110 km
        # GMN Extended Harbour Line (after VDLR)
        "KCE": 10930.0,     # 10.93 km
        "MM": 12470.0,      # 12.47 km
        "BA": 14080.0,      # 14.08 km
        "KHR": 15630.0,     # 15.63 km
        "STC": 17030.0,     # 17.03 km
        "VLP": 19090.0,     # 19.09 km
        "ADH": 21300.0,     # 21.30 km
        "JOS": 22990.0,     # 22.99 km
        "RMAR": 24840.0,    # 24.84 km
        "GMN": 26370.0,     # 26.37 km
        "SVE": 7100.0,      # 7.10 km
        "CTGN": 5180.0,     # 5.18 km
        "RRD": 4060.0,      # 4.060 km
        "DKRD": 2990.0,     # 2.99 km
        "SNRDH": 1600.0,    # 1.60 km
        "MSDH": 1220.0,     # 1.22 km
        "CSMTH": 10.0,      # 0.01 km

        # Main Central Line (CSMT - KYN)
        "KYN": 53625.0,     # 53.625 km
        "THK": 49510.0,     # 49.51 km
        "DI": 48060.0,      # 48.06 km
        "KOPR": 46860.0,    # 46.86 km
        "DW": 42300.0,      # 42.30 km
        "MBQ": 39980.0,     # 39.98 km
        "KLVA": 35400.0,    # 35.4 km
        "TNA": 32420.0,     # 32.42 km
        "MLND": 30560.0,    # 30.56 km
        "NHU": 28010.0,     # 28.01 km
        "BND": 26560.0,     # 26.56 km
        "KJRD": 24690.0,    # 24.69 km
        "VK": 22850.0,      # 22.85 km
        "GC": 19300.0,      # 19.3 km
        "VVH": 17800.0,     # 17.8 km
        # "CLA": 14600.0,   # Already defined above (duplicate entry in original)
        "SION": 12710.0,    # 12.71 km
        "MTN": 10120.0,     # 10.12 km
        "DR": 8850.0,       # 8.85 km
        "PR": 7350.0,       # 7.35 km
        "CRD": 6070.0,      # 6.07 km
        "CHG": 5530.0,      # 5.53 km
        "BY": 4040.0,       # 4.04 km
        "SNRD": 2080.0,     # 2.08 km
        "MSD": 1220.0,      # 1.22 km
        "CSMT": 100.0,      # 0.1 km

        # Vasai Road - Dahanu Road section (North)
        "VLDI": 55590.0,    # 55.59 km
        "ULNR": 57290.0,    # 57.29 km
        "ABH": 59900.0,     # 59.90 km
        "BUD": 67260.0,     # 67.26 km
        "VGI": 77990.0,     # 77.99 km
        "SHELU": 82090.0,   # 82.09 km
        "NRL": 86120.0,     # 86.12 km
        "BVS": 92850.0,     # 92.85 km
        "KJT": 99720.0,     # 99.72 km
        "PDI": 102920.0,    # 102.92 km
        "KLY": 107860.0,    # 107.86 km
        "DLY": 108430.0,    # 108.43 km
        "LWJ": 111580.0,    # 111.58 km
        "KHPI": 114240.0,   # 114.24 km

        # Kalyan - Kasara section (Northeast)
        "SHD": 56250.0,     # 56.25 km
        "ABY": 57960.0,     # 57.96 km
        "TLA": 64050.0,     # 64.05 km
        "KDV": 71400.0,     # 71.40 km
        "VSD": 79400.0,     # 79.40 km
        "ASO": 85430.0,     # 85.43 km
        "ATG": 94870.0,     # 94.87 km
        "THS": 101000.0,    # 101.00 km
        "KE": 107030.0,     # 107.03 km
        "OMB": 113430.0,    # 113.43 km
        "KSRA": 120560.0,   # 120.56 km
    }


def get_thb_station_km_map():
    """
    Returns official kilometer posts (in meters) for Trans-Harbour line stations.
    Converted from modifiedscripts.js getStationKMMapTHBLine()

    Trans-Harbour line connects TNA (Thane) to Panvel via different route.
    """
    return {
        "PNVL": 34410.0,    # 34.410 km
        "KNDS": 31120.0,    # 31.120 km
        "MANR": 29220.0,    # 29.220 km
        "KHAG": 26300.0,    # 26.300 km
        "BEPR": 23970.0,    # 23.970 km
        "SWDV": 21570.0,    # 21.570 km
        "NEU_THB": 20170.0, # 20.170 km
        "JNJ": 17690.0,     # 17.690 km
        "SNPD": 17480.0,    # 17.480 km
        "VSH_THB": 18650.0, # 18.650 km
        "TUH": 15440.0,     # 15.440 km
        "KPHN": 12260.0,    # 12.260 km
        "GNSL": 10730.0,    # 10.730 km
        "RABE": 8410.0,     # 8.410 km
        "AIRL": 5930.0,     # 5.930 km
        "DIGH": 3310.0,     # 3.310 km
        "TNA": 10.0,        # 0.01 km
    }


def get_station_km_map_for_train_type(train_type):
    """
    Returns the appropriate station KM map based on train type.

    Args:
        train_type (str): One of 'fast', 'slow', 'thb', 'general'

    Returns:
        dict: Station name -> official KM position (in meters)
    """
    if train_type == 'fast':
        return get_fast_station_km_map()
    elif train_type == 'thb':
        return get_thb_station_km_map()
    elif train_type in ['slow', 'general']:
        return get_slow_station_km_map()
    else:
        # Default to slow for unknown types
        return get_slow_station_km_map()
