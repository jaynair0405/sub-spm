"""
Script to convert JavaScript ISD arrays to JSON reference files
"""
import json
import re
from pathlib import Path

# Fast train ISD data (extracted from general.js)
fast_isd_raw = """['KYN-DI',0.0,'KYN'],['KYN-DI',3.999,'DI Entry'], ['DI-DW',0.326,'DI '],['DI-DW',5.403,'DW Entry'],['DW-MBQ',0.284,'DW'],
['DW-MBQ',2.183,'MBQ Entry'],  ['MBQ-KLVA', 0.263, 'MBQ'], ['MBQ-KLVA', 3.998, 'KLVA Entry'],  ['KLVA-TNA', 0.268, 'KLVA'], ['KLVA-TNA', 2.266,'TNA Entry'], ['TNA-MLND', 0.46, 'TNA'], ['TNA-MLND', 2.21, 'MLND Entry'],  ['MLND-BND', 0.33, 'MLND'], ['MLND-BND', 3.297, 'BND Entry'],  ['BND-VK', 0.334, 'BND'],['BND-VK', 3.494, 'VK Entry'], ['VK-GC',0.268,'VK'],['VK-GC',3.428,'GC Entry'],['GC-CLA', 0.332, 'GC'],['GC-CLA',3.488,'CLA Entry'],['CLA-SION', 0.341,'CLA'], ['CLA-SION', 2.291, 'SION Entry'], ['SION-MTN', 0.192, 'SION'],['SION-MTN', 2.363,'MTN Entry'],['MTN-DR',0.263,'MTN'],['MTN-DR', 0.974, 'DR Entry'],['DR-PR',0.391,'DR'],
['DR-PR',0.866,'PR Entry'],['PR-BY', 0.185, 'PR'],['PR-BY', 3.498,'BY Entry'],
['BY-CSMT',0.326,'BY'],['BY-CSMT',3.884,'CSMT Entry'],['BY-CSMT', 0.26, 'CSMT'],
['CSMT-BY', 0.0, 'CSMT'], ['CSMT-BY', 3.901, 'BY Entry'], ['BY-PR', 0.326, 'BY '],
['BY-PR', 3.408, 'PR Entry'],  ['PR-DR', 0.193, 'PR'], ['PR-DR', 0.772, 'DR Entry'], ['DR-MTN', 0.471, 'DR'], ['DR-MTN',1.004,'MTN Entry'],['MTN-SION', 0.266, 'MTN'],['MTN-SION',2.379,'SION Entry'],['SION-CLA', 0.271, 'SION'], ['SION-CLA',2.211,'CLA Entry'], ['CLA-GC', 0.321, 'CLA'], ['CLA-GC', 3.476, 'GC Entry'], ['GC-VK',0.332,'GC'],['GC-VK',3.427,'VK Entry'],['VK-BND', 0.26, 'VK'], ['VK-BND',3.385,'BND Entry'],['BND-MLND',0.334,'BND'],['BND-MLND', 3.541, 'MLND Entry'],['MLND-TNA',0.337,'MLND'],['MLND-TNA',2.190,'TNA Entry'],['TNA-KLVA',0.465,'TNA'],['TNA-KLVA',2.032,'KLVA Entry'], ['KLVA-MBQ', 0.268, 'KLVA'], ['KLVA-MBQ',4.629, 'MBQ Entry'], ['MBQ-DW', 0.271, 'MBQ'], ['MBQ-DW',1.865, 'DW Entry'],['DW-DI',0.286,'DW'],['DW-DI',5.483,'DI Entry'],['DI-KYN', 0.326, 'DI'], ['DI-KYN',4.486,'KYN Entry'], ['DI-KYN', 0.534, 'KYN']"""

# Slow/Harbour line ISD data
slow_isd_raw = """['PNVL-KNDS', 0.0, 'PNVL'], ['PNVL-KNDS', 3.004, 'KNDS  Entry'], ['KNDS-MANR', 0.276, 'KNDS'], ['KNDS-MANR', 1.639, 'MANR  Entry'], ['MANR-KHAG', 0.274, 'MANR'], ['MANR-KHAG', 2.627, 'KHAG  Entry'], ['KHAG-BEPR', 0.276, 'KHAG'], ['KHAG-BEPR', 2.064, 'BEPR  Entry'], ['BEPR-SWDV', 0.27, 'BEPR'], ['BEPR-SWDV', 2.097, 'SWDV Entry'], ['SWDV-NEU', 0.306, 'SWDV'], ['SWDV-NEU', 1.128, 'NEU  Entry'], ['NEU-JNJ', 0.272, 'NEU'], ['NEU-JNJ', 2.219, 'JNJ  Entry'], ['JNJ-SNPD', 0.27, 'JNJ'], ['JNJ-SNPD', 1.602, 'SNPD  Entry'], ['SNPD-VSH', 0.267, 'SNPD'], ['SNPD-VSH', 0.898, 'VSH  Entry'], ['VSH-MNKD', 0.264, 'VSH'], ['VSH-MNKD', 7.187, 'MNKD  Entry'], ['MNKD-GV', 0.267, 'MNKD'], ['MNKD-GV', 1.749, 'GV  Entry'], ['GV-CMBR', 0.272, 'GV'], ['GV-CMBR', 1.369, 'CMBR  Entry'], ['CMBR-TKNG', 0.264, 'CMBR'], ['CMBR-TKNG', 0.978, 'TKNG  Entry'], ['TKNG-CLA', 0.27, 'TKNG'], ['TKNG-CLA', 0.96, 'CLA Entry'], ['CLA-CHF', 0.28, 'CLA'], ['CLA-CHF', 1.674, 'CHF  Entry'], ['CHF-GTBN', 0.263, 'CHF'], ['CHF-GTBN', 1.404, 'GTBN  Entry'], ['GTBN-VDLR', 0.262, 'GTBN'], ['GTBN-VDLR', 2.388, 'VDLR  Entry'], ['VDLR-SVE', 0.262, 'VDLR'], ['VDLR-SVE', 1.758, 'SVE  Entry'], ['SVE-CTGN', 0.281, 'SVE'], ['SVE-CTGN', 1.507, 'CTGN  Entry'], ['CTGN-RRD', 0.267, 'CTGN'], ['CTGN-RRD', 0.77, 'RRD  Entry'], ['RRD-DKRD', 0.264, 'RRD'], ['RRD-DKRD', 1.013, 'DKRD  Entry'], ['DKRD-SNRDH', 0.265, 'DKRD'], ['DKRD-SNRDH', 0.417, 'SNRD  Entry'], ['SNRDH-MSDH', 0.263, 'SNRDH'], ['SNRDH-MSDH', 0.839, 'MSD  Entry'], ['MSDH-CSMTH', 0.268, 'MSDH'], ['MSDH-CSMTH', 0.988, 'CSMTH  Entry'], ['MSDH-CSMTH', 0.265, 'CSMTH'],
['KYN-THK', 0.0, 'KYN'], ['KYN-THK', 3.128, 'THK Entry'], ['THK-DI', 0.265, 'THK'], ['THK-DI', 1.103, 'DI Entry'], ['DI-KOPR', 0.329, 'DI'], ['DI-KOPR', 1.031, 'KOPR Entry'], ['KOPR-DW', 0.265, 'KOPR'], ['KOPR-DW', 4.197, 'DW Entry'], ['DW-MBQ', 0.268, 'DW'], ['DW-MBQ', 2.131, 'MBQ Entry'], ['MBQ-KLVA', 0.271, 'MBQ'], ['MBQ-KLVA', 4.265, 'KLVA Entry'], ['KLVA-TNA', 0.262, 'KLVA'], ['KLVA-TNA', 2.192, 'TNA Entry'], ['TNA-MLND', 0.266, 'TNA'], ['TNA-MLND', 2.411, 'MLND Entry'], ['MLND-NHR', 0.288, 'MLND'], ['MLND-NHR', 1.937, 'NHR Entry'], ['NHR-BND', 0.271, 'NHR'], ['NHR-BND', 1.361, 'BND Entry'], ['BND-KJMG', 0.272, 'BND'], ['BND-KJMG', 1.623, 'KJMG Entry'], ['KJMG-VK', 0.274, 'KJMG'], ['KJMG-VK', 1.561, 'VK Entry'], ['VK-GC', 0.262, 'VK'], ['VK-GC', 3.403, 'GC Entry'], ['GC-VVH', 0.269, 'GC'], ['GC-VVH', 1.074, 'VVH Entry'], ['VVH-CLA', 0.262, 'VVH'], ['VVH-CLA', 2.222, 'CLA Entry'], ['CLA-SION', 0.265, 'CLA'], ['CLA-SION', 2.287, 'SION Entry'], ['SION-MTN', 0.277, 'SION'], ['SION-MTN', 2.373, 'MTN Entry'], ['MTN-DR', 0.265, 'MTN'], ['MTN-DR', 0.981, 'DR Entry'], ['DR-PR', 0.261, 'DR'], ['DR-PR', 0.914, 'PR Entry'], ['PR-CRD', 0.268, 'PR'], ['PR-CRD', 1.589, 'CRD Entry'], ['CRD-CHG', 0.267, 'CRD'], ['CRD-CHG', 0.481, 'CHG Entry'], ['CHG-BY', 0.268, 'CHG'], ['CHG-BY', 0.815, 'BY Entry'], ['BY-SNRD', 0.267, 'BY'], ['BY-SNRD', 1.548, 'SNRD Entry'], ['SNRD-MSD', 0.265, 'SNRD'], ['SNRD-MSD', 0.916, 'MSD Entry'], ['MSD-CSMT', 0.26, 'MSD'], ['MSD-CSMT', 0.983, 'CSMT Entry'], ['MSD-CSMT', 0.26, 'CSMT'],
['TNA-DIGH',0, 'TNA'],['TNA-DIGH', 3.017, 'DIGH Entry'], ['DIGH-AIRL', 0.27, 'DIGH'], ['DIGH-AIRL', 2.364, 'AIRL Entry'], ['AIRL-RABE', 0.27, 'AIRL'], ['AIRL-RABE', 2.21, 'RABE Entry'], ['RABE-GNSL', 0.27, 'RABE'], ['RABE-GNSL', 2.054, 'GNSL Entry'], ['GNSL-KPHN', 0.276, 'GNSL'], ['GNSL-KPHN', 1.248, 'KPHN Entry'], ['KPHN-TUH', 0.28, 'KPHN'], ['KPHN-TUH', 2.895, 'TUH Entry'], ['TUH-JNJ', 0.285, 'TUH'], ['TUH-JNJ', 2.002, 'JNJ Entry'], ['JNJ-NEU_THB', 0.27, 'JNJ'], ['JNJ-NEU_THB', 2.22, 'NEU_THB Entry'], ['NEU_THB-SWDV', 0.285, 'NEU_THB'],['NEU_THB-SWDV', 1.136, 'SWDV Entry'],['TUH-SNPD', .285, 'TUH'], ['TUH-SNPD', 1.742, 'SNPD Entry'], ['SNPD-VSH_THB', 0.263, 'SNPD'], ['SNPD-VSH_THB', 0.915, 'VSH_THB Entry'], ['SNPD-VSH_THB', 0.27, 'VSH_THB'],
['CSMTH-MSDH', 0.0, 'CSMTH'], ['CSMTH-MSDH', 0.995, 'MSDH Entry'], ['MSDH-SNRDH', 0.269, 'MSDH'], ['MSDH-SNRDH', 0.832, 'SNRDH Entry'], ['SNRDH-DKRD', 0.269, 'SNRDH'], ['SNRDH-DKRD', 0.425, 'DKRD Entry'], ['DKRD-RRD', 0.27, 'DKRD'], ['DKRD-RRD', 0.986, 'RRD Entry'], ['RRD-CTGN', 0.27, 'RRD'], ['RRD-CTGN', 0.78, 'CTGN Entry'], ['CTGN-SVE', 0.269, 'CTGN'], ['CTGN-SVE', 1.506, 'SVE Entry'], ['SVE-VDLR', 0.27, 'SVE'], ['SVE-VDLR', 1.855, 'VDLR Entry'], ['VDLR-GTBN', 0.267, 'VDLR'], ['VDLR-GTBN', 2.298, 'GTBN Entry'], ['GTBN-CHF', 0.269, 'GTBN'], ['GTBN-CHF', 1.318, 'CHF Entry'], ['CHF-CLA', 0.266, 'CHF'], ['CHF-CLA', 1.768, 'CLA Entry'], ['CLA-TKNG', 0.267, 'CLA'], ['CLA-TKNG', 0.987, 'TKNG Entry'], ['TKNG-CMBR', 0.267, 'TKNG'], ['TKNG-CMBR', 0.983, 'CMBR Entry'], ['CMBR-GV', 0.269, 'CMBR'], ['CMBR-GV', 1.369, 'GV Entry'], ['GV-MNKD', 0.27, 'GV'], ['GV-MNKD', 1.749, 'MNKD Entry'], ['MNKD-VSH', 0.268, 'MNKD'], ['MNKD-VSH', 7.206, 'VSH Entry'], ['VSH-SNPD', 0.268, 'VSH'], ['VSH-SNPD', 0.908, 'SNPD Entry'], ['SNPD-JNJ', 0.268, 'SNPD'], ['SNPD-JNJ', 1.614, 'JNJ Entry'], ['JNJ-NEU', 0.268, 'JNJ'], ['JNJ-NEU', 2.216, 'NEU Entry'], ['NEU-SWDV', 0.269, 'NEU'], ['NEU-SWDV', 1.136, 'SWDV Entry'], ['SWDV-BEPR', 0.27, 'SWDV'], ['SWDV-BEPR', 2.131, 'BEPR Entry'], ['BEPR-KHAG', 0.268, 'BEPR'], ['BEPR-KHAG', 2.074, 'KHAG Entry'], ['KHAG-MANR', 0.266, 'KHAG'], ['KHAG-MANR', 2.655, 'MANR Entry'], ['MANR-KNDS', 0.268, 'MANR'], ['MANR-KNDS', 1.638, 'KNDS Entry'], ['KNDS-PNVL', 0.268, 'KNDS'], ['KNDS-PNVL', 3.02, 'PNVL Entry'], ['KNDS-PNVL', 0.27, 'PNVL'],
 ['CSMT-MSD', 0.0, 'CSMT'], ['CSMT-MSD', 0.978, 'MSD Entry'], ['MSD-SNRD', 0.268, 'MSD'], ['MSD-SNRD', 0.9, 'SNRD Entry'], ['SNRD-BY', 0.269, 'SNRD'], ['SNRD-BY', 1.464, 'BY Entry'], ['BY-CHG', 0.272, 'BY'], ['BY-CHG', 0.898, 'CHG Entry'], ['CHG-CRD', 0.269, 'CHG'], ['CHG-CRD', 0.477, 'CRD Entry'], ['CRD-PR', 0.269, 'CRD'], ['CRD-PR', 1.591, 'PR Entry'], ['PR-DR', 0.31, 'PR'], ['PR-DR', 0.691, 'DR Entry'], ['DR-MTN', 0.269, 'DR'], ['DR-MTN', 1.156, 'MTN Entry'], ['MTN-SION', 0.266, 'MTN'], ['MTN-SION', 2.356, 'SION Entry'], ['SION-CLA', 0.285, 'SION'], ['SION-CLA', 2.304, 'CLA Entry'], ['CLA-VVH', 0.273, 'CLA'], ['CLA-VVH', 2.202, 'VVH Entry'], ['VVH-GC', 0.269, 'VVH'], ['VVH-GC', 1.114, 'GC Entry'], ['GC-VK', 0.277, 'GC'], ['GC-VK', 3.355, 'VK Entry'], ['VK-KJMG', 0.266, 'VK'], ['VK-KJMG', 1.555, 'KJMG Entry'], ['KJMG-BND', 0.274, 'KJMG'], ['KJMG-BND', 1.61, 'BND Entry'], ['BND-NHR', 0.271, 'BND'], ['BND-NHR', 1.377, 'NHR Entry'], ['NHR-MLND', 0.267, 'NHR'], ['NHR-MLND', 1.937, 'MLND Entry'], ['MLND-TNA', 0.272, 'MLND'], ['MLND-TNA', 2.415, 'TNA Entry'], ['TNA-KLVA', 0.274, 'TNA'], ['TNA-KLVA', 2.209, 'KLVA Entry'], ['KLVA-MBQ', 0.265, 'KLVA'], ['KLVA-MBQ', 4.269, 'MBQ Entry'], ['MBQ-DW', 0.273, 'MBQ'], ['MBQ-DW', 2.12, 'DW Entry'], ['DW-KOPR', 0.282, 'DW'], ['DW-KOPR', 4.187, 'KOPR Entry'], ['KOPR-DI', 0.276, 'KOPR'], ['KOPR-DI', 0.94, 'DI Entry'], ['DI-THK', 0.276, 'DI'], ['DI-THK', 1.256, 'THK Entry'], ['THK-KYN', 0.264, 'THK'], ['THK-KYN', 3.447, 'KYN Entry'], ['THK-KYN', 0.265, 'KYN'],
['VSH_THB-SNPD', 0.0, 'VSH_THB'], ['VSH_THB-SNPD', 0.917, 'SNPD Entry'], ['SNPD-TUH', 0.264, 'SNPD'], ['SNPD-TUH', 1.743, 'TUH Entry'], ['SWDV-NEU_THB', 0.306, 'SWDV'], ['SWDV-NEU_THB', 1.128, 'NEU_THB Entry'], ['NEU_THB-JNJ', 0.285, 'NEU_THB'], ['NEU_THB-JNJ', 2.224, 'JNJ Entry'], ['JNJ-TUH', 0.27, 'JNJ'], ['JNJ-TUH', 1.988, 'TUH Entry'], ['TUH-KPHN', 0.293, 'TUH'], ['TUH-KPHN', 2.902, 'KPHN Entry'], ['KPHN-GNSL', 0.271, 'KPHN'], ['KPHN-GNSL', 1.254, 'GNSL Entry'], ['GNSL-RABE', 0.277, 'GNSL'], ['GNSL-RABE', 2.049, 'RABE Entry'], ['RABE-AIRL', 0.27, 'RABE'], ['RABE-AIRL', 2.212, 'AIRL Entry'], ['AIRL-DIGH', 0.27, 'AIRL'], ['AIRL-DIGH', 2.362, 'DIGH Entry'], ['DIGH-TNA', 0.27, 'DIGH'], ['DIGH-TNA', 3.02, 'TNA Entry'], ['DIGH-TNA', 0.27, 'TNA'],
['KYN-SHD', 0, 'KYN'],['KYN-SHD', 2.848, 'SHD Entry'], ['SHD-ABY', .275, 'SHD'], ['SHD-ABY', 2.783, 'ABY Entry'], ['ABY-TLA', .271, 'ABY'], ['ABY-TLA', 4.471, 'TLA Entry'], ['TLA-KDV', .262, 'TLA'], ['TLA-KDV', 7.368, 'KDV Entry'], ['KDV-VSD', .279, 'KDV'], ['KDV-VSD', 7.328, 'VSD Entry'], ['VSD-ASO', .268, 'VSD'], ['VSD-ASO', 5.679, 'ASO Entry'], ['ASO-ATG', .280, 'ASO'], ['ASO-ATG', 9.402, 'ATG Entry'], ['ATG-THS', .278, 'ATG'], ['ATG-THS', 5.682, 'THS Entry'], ['THS-KE', .270, 'THS'], ['THS-KE', 5.869, 'KE Entry'], ['KE-OMB', .275, 'KE'], ['KE-OMB', 6.174, 'OMB Entry'], ['OMB-KSRA', .271, 'OMB'], ['OMB-KSRA', 6.621, 'KSRA Entry'], ['OMB-KSRA', .284, 'KSRA'],
['KYN-VLDI',0 ,'KYN' ],['KYN-VLDI', 2.108, 'VLDI Entry'], ['VLDI-ULNR', .264, 'VLDI'], ['VLDI-ULNR', 1.963, 'ULNR Entry'], ['ULNR-ABH', .264, 'ULNR'], ['ULNR-ABH', 2.415, 'ABH Entry'], ['ABH-BUD', .282, 'ABH'], ['ABH-BUD', 7.685, 'BUD Entry'], ['BUD-VGI', .307, 'BUD'], ['BUD-VGI', 10.784, 'VGI Entry'], ['VGI-SHELU', .274, 'VGI'], ['VGI-SHELU', 4.004, 'SHELU Entry'], ['SHELU-NRL', .262, 'SHELU'], ['SHELU-NRL', 4.062, 'NRL Entry'], ['NRL-BVS', .333, 'NRL'], ['NRL-BVS', 6.665, 'BVS Entry'], ['BVS-KJT', .275, 'BVS'], ['BVS-KJT', 6.676, 'KJT Entry'], ['KJT-PDI', .262, 'KJT'],
 ['KJT-PDI', 2.801, 'PDI Entry'],['PDI-KLY', .271, 'PDI'],['PDI-KLY', 4.030, 'KLY Entry'],['KLY-DLY', .280, 'KLY'],
 ['KLY-DLY', 0.987, 'DLY Entry'],['DLY-LWJ', .274, 'DLY'],['DLY-LWJ', 2.894, 'LWJ Entry'],['LWJ-KHPI', .280, 'LWJ'],
 ['LWJ-KHPI', 2.230, 'KHPI Entry'],['LWJ-KHPI', .266, 'KHPI'],
 ['KSRA-OMB', 0.0, 'KSRA'], ['KSRA-OMB', 6.591, 'OMB Entry'], ['OMB-KE', .269, 'OMB'], ['OMB-KE', 6.207, 'KE Entry'], ['KE-THS', .285, 'KE'], ['KE-THS',5.868, 'THS Entry'], ['THS-ATG', .275, 'THS'], ['THS-ATG', 5.674, 'ATG Entry'], ['ATG-ASO', .272, 'ATG'], ['ATG-ASO', 9.406, 'ASO Entry'], ['ASO-VSD', .275, 'ASO'], ['ASO-VSD', 5.622, 'VSD Entry'], ['VSD-KDV', .266, 'VSD'], ['VSD-KDV', 7.405, 'KDV Entry'], ['KDV-TLA', .266, 'KDV'], ['KDV-TLA', 7.321, 'TLA Entry'], ['TLA-ABY', .267, 'TLA'], ['TLA-ABY', 4.510, 'ABY Entry'], ['ABY-SHD', .270, 'ABY'], ['ABY-SHD', 2.784, 'SHD Entry'], ['SHD-KYN', .270, 'SHD'], ['SHD-KYN', 2.885, 'KYN Entry'], ['SHD-KYN', .270, 'KYN'],
['KHPI-LWJ', 0, 'KHPI'],['KHPI-LWJ',2.230, 'LWJ Entry'],['LWJ-DLY',.280, 'LWJ'],['LWJ-DLY',2.894,'DLY Enrty'],
['DLY-KLY',.274, 'DLY'],['DLY-KLY',.987, 'KLY Entry'],['KLY-PDI',.280, 'KLY'],['KLY-PDI',4.030, 'PDI Entry'],['PDI-KJT',.271, 'PDI'],
 ['PDI-KJT', 2.801, 'KJT Entry'], ['KJT-BVS', .262, 'KJT'], ['KJT-BVS', 6.702, 'BVS Entry'], ['BVS-NRL', .280, 'BVS'], ['BVS-NRL', 6.716, 'NRL Entry'],['NRL-SHELU', .351, 'NRL'], ['NRL-SHELU', 4.018, 'SHELU Entry'], ['SHELU-VGI', .266, 'SHELU'],['SHELU-VGI', 3.996,'VGI Entry'],['VGI-BUD', .264,'VGI'],['VGI-BUD',10.763, 'BUD Entry'],['BUD-ABH',.316, 'BUD'], ['BUD-ABH', 7.626, 'ABH Entry'], ['ABH-ULNR', .272, 'ABH'], ['ABH-ULNR', 2.488, 'ULNR Entry'], ['ULNR-VLDI', .268, 'ULNR'], ['ULNR-VLDI', 1.965, 'VLDI Entry'], ['VLDI-KYN', .266, 'VLDI'], ['VLDI-KYN', 2.216, 'KYN Entry'], ['VLDI-KYN', .270, 'KYN']"""


def parse_isd_array(raw_data):
    """Parse JavaScript array string into structured dict"""
    platform_lengths = {}

    # Parse using regex to extract arrays
    pattern = r'\[([^\]]+)\]'
    matches = re.findall(pattern, raw_data)

    for match in matches:
        # Split by comma and clean up
        parts = [p.strip().strip("'\"") for p in match.split(',')]

        if len(parts) != 3:
            continue

        section = parts[0]
        try:
            distance = float(parts[1])
        except ValueError:
            continue
        station = parts[2].strip()

        # Skip "Entry" markers - we only want platform lengths
        if 'Entry' in station or 'Enrty' in station:
            continue

        # Skip first stations (distance = 0)
        if distance == 0:
            continue

        # This is a platform length entry
        # Format: ['SECTION', platform_length, 'STATION']
        platform_lengths[section] = {
            'section': section,
            'station': station,
            'platform_length_km': distance
        }

    return platform_lengths


# Parse both datasets
print("Parsing fast train ISD data...")
fast_data = parse_isd_array(fast_isd_raw)
print(f"  Found {len(fast_data)} fast train platform entries")

print("\nParsing slow/harbour line ISD data...")
slow_data = parse_isd_array(slow_isd_raw)
print(f"  Found {len(slow_data)} slow/harbour platform entries")

# Create reference_data directory if it doesn't exist
ref_dir = Path("reference_data")
ref_dir.mkdir(exist_ok=True)

# Write JSON files
fast_file = ref_dir / "fast_isd.json"
slow_file = ref_dir / "slow_isd.json"

with open(fast_file, 'w') as f:
    json.dump(fast_data, f, indent=2)
print(f"\n✓ Created {fast_file}")

with open(slow_file, 'w') as f:
    json.dump(slow_data, f, indent=2)
print(f"✓ Created {slow_file}")

# Print sample entries
print("\n=== Sample Fast Train Entries ===")
for section, data in list(fast_data.items())[:5]:
    print(f"{section}: {data['station']} platform = {data['platform_length_km']:.3f} km")

print("\n=== Sample Slow/Harbour Entries ===")
for section, data in list(slow_data.items())[:5]:
    print(f"{section}: {data['station']} platform = {data['platform_length_km']:.3f} km")

print("\nDone! ISD reference files created successfully.")
