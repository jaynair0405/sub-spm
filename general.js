const stations = [[1.0, 'CSMTH'], [2.0, 'MSDH'], [3.0, 'SNRDH'], [4.0, 'DKRD'], [5.0, 'RRD'], [6.0, 'CTGN'], [7.0, 'SVE'], [8.0, 'VDLR'], [9.0, 'GTBN'], [10.0, 'CHF'], [11.0, 'CLA'], [12.0, 'TKNG'], [13.0, 'CMBR'], [14.0, 'GV'], [15.0, 'MNKD'], [16.0, 'VSH'], [17.0, 'SNPD'], [18.0, 'JNJ'], [19.0, 'NEU'], [20.0, 'SWDV'], [21.0, 'BEPR'], [22.0, 'KHAG'], [23.0, 'MANR'], [24.0, 'KNDS'], [25.0, 'PNVL'], [26.0, 'BY'], [27.0, 'CHG'], [28.0, 'CRD'], [29.0, 'PR'], [30.0, 'DR'], [31.0, 'MTN'], [32.0, 'SION'], [33.0, 'VVH'], [34.0, 'GC'], [35.0, 'VK'], [36.0, 'KJMG'], [37.0, 'BND'], [38.0, 'NHR'], [39.0, 'MLND'], [40.0, 'TNA'], [41.0, 'KLVA'], [42.0, 'MBQ'], [43.0, 'DW'], [44.0, 'KOPR'], [45.0, 'DI'], [46.0, 'THK'], [47.0, 'KYN'], [48.0, 'SHD'], [49.0, 'ABY'], [50.0, 'TLA'], [51.0, 'KDV'], [52.0, 'VSD'], [53.0, 'ASO'], [54.0, 'ATG'], [55.0, 'THS'], [56.0, 'KE'], [57.0, 'OMB'], [58.0, 'KSRA'], [59.0, 'VLDI'], [60.0, 'ULNR'], [61.0, 'ABH'], [62.0, 'BUD'], [63.0, 'VGI'], [64.0, 'SHELU'], [65.0, 'NRL'],[66.0, 'BVS'],[67.0, 'KJT'], [68.0, 'AIRL'], [69.0,'RABE'],[70.0,'GNSL'],[71.0,'KPHN'],[72.0, 'TUH'],[73.0, 'SNRD'],[74.0, 'MSD'],[75.0, 'CSMT'],[76.0,'VSH_THB'],[77.0,'NEU_THB'],[78.0,'DIGH'],[79.0,'PDI'],[80.0,'KLY'],[81.0,'DLY'],[82.0,'LWJ'],[83.0,'KHPI']]

const routes = [['CSMTH', 'MSDH', 'SNRDH', 'DKRD', 'RRD', 'CTGN', 'SVE', 'VDLR', 'GTBN', 'CHF', 'CLA', 'TKNG', 'CMBR', 'GV', 'MNKD', 'VSH', 'SNPD', 'JNJ', 'NEU', 'SWDV', 'BEPR', 'KHAG', 'MANR', 'KNDS', 'PNVL'],['CSMT','MSD','SNRD','BY', 'CHG', 'CRD', 'PR', 'DR', 'MTN', 'SION','CLA', 'VVH', 'GC', 'VK', 'KJMG', 'BND', 'NHR', 'MLND', 'TNA', 'KLVA', 'MBQ', 'DW', 'KOPR', 'DI', 'THK', 'KYN', 'SHD', 'ABY', 'TLA', 'KDV', 'VSD', 'ASO', 'ATG', 'THS', 'KE', 'OMB', 'KSRA'],['CSMT','MSD','SNRD','BY', 'CHG', 'CRD', 'PR', 'DR', 'MTN', 'SION','CLA', 'VVH', 'GC', 'VK', 'KJMG', 'BND', 'NHR', 'MLND', 'TNA', 'KLVA', 'MBQ', 'DW', 'KOPR', 'DI', 'THK', 'KYN','VLDI', 'ULNR', 'ABH', 'BUD', 'VGI', 'SHELU', 'NRL', 'BVS', 'KJT','PDI','KLY','DLY','LWJ','KHPI'],['TNA','DIGH', 'AIRL', 'RABE', 'GNSL', 'KPHN','TUH','SNPD','VSH_THB'],['TNA','DIGH', 'AIRL', 'RABE', 'GNSL', 'KPHN','TUH','JNJ','NEU_THB','SWDV','BEPR','KHAG','MANR','KNDS','PNVL']]

const fastRoutes = [['CSMT','BY','PR','DR','MTN', 'SION','CLA','GC','VK','BND', 'MLND', 'TNA', 'KLVA', 'MBQ', 'DW','DI', 'KYN', 'SHD', 'ABY', 'TLA', 'KDV', 'VSD', 'ASO', 'ATG', 'THS', 'KE', 'OMB', 'KSRA'],['CSMT','BY','PR','DR','MTN', 'SION','CLA','GC','VK','BND', 'MLND', 'TNA', 'KLVA', 'MBQ', 'DW','DI', 'KYN','VLDI', 'ULNR', 'ABH', 'BUD', 'VGI', 'SHELU', 'NRL', 'BVS', 'KJT','PDI','KLY','DLY','LWJ','KHPI']]

const sectionsList = [['PNVL-KNDS', 48.970, 45.760, 3210, 95.0], ['KNDS-MANR', 45.76, 43.48, 2280.0, 95.0], ['MANR-KHAG', 43.48, 41.93, 1550.0, 95.0], ['MANR-KHAG', 41.93, 40.73, 1200.0, 90.0], ['MANR-KHAG', 40.73, 40.66, 70.0, 95.0], ['KHAG-BEPR', 40.66, 39.807, 853.00, 95.0], ['KHAG-BEPR', 39.807, 39.209, 598.00, 80.0], ['KHAG-BEPR', 39.209, 38.498, 711, 40.0],['BEPR-SWDV',  38.498,38.142, 356, 45.0], ['BEPR-SWDV', 38.142, 37.632, 510, 65.0], ['BEPR-SWDV', 37.632, 36.628, 1004, 80.0], ['BEPR-SWDV', 36.628, 36.168,460, 65.0], ['SWDV-NEU', 36.168, 34.47, 1698, 95.0],  ['NEU-JNJ', 34.47, 34.17, 299.99999999999716, 95.0], ['NEU-JNJ', 34.17, 34.06, 109.99999999999943, 85.0], ['NEU-JNJ', 34.06, 33.53, 530.0, 95.0], ['NEU-JNJ', 33.53, 33.364, 166.0, 90.0], ['NEU-JNJ', 33.364, 32.31, 1053.999999999995, 95.0], ['NEU-JNJ', 32.31, 31.94, 370.000000000001, 80.0], ['JNJ-SNPD', 31.94, 31.391, 549.0000000000031, 80.0], ['JNJ-SNPD', 31.391, 30.03, 1361, 95.0], ['SNPD-VSH', 30.03, 29.654, 376, 95.0], ['SNPD-VSH',29.654, 29.179, 475, 45.0], ['SNPD-VSH', 29.179, 28.76, 419, 95.0], ['SNPD-VSH', 28.76,28.630,130, 95.0],['VSH-MNKD', 28.630, 27.89, 740, 95.0],  ['VSH-MNKD', 27.89, 22.248, 5642, 95.0], ['VSH-MNKD',  22.248,21.208, 1040, 50.0], ['MNKD-GV', 21.208, 18.99, 2218, 95.0], ['GV-CMBR', 18.99, 17.33, 1660.0000000000002, 95.0], ['CMBR-TKNG', 17.33, 16.404, 926.0, 95.0], ['TKNG-CLA', 16.404, 15.569, 835, 40.0], ['TKNG-CLA', 15.569, 15.39, 179, 80.0],  ['CLA-CHF', 15.39, 13.48, 1910, 80.0], ['CHF-GTBN', 13.48, 11.48, 2000.0, 80.0], ['GTBN-VDLR', 11.48, 10.544, 936.0, 80.0],['GTBN-VDLR', 10.544, 10.019, 525.0, 30.0],['GTBN-VDLR',10.019, 9.11, 1780.000000000001, 80.0], ['VDLR-SVE', 9.11, 7.01, 2099.9999999999995, 80.0], ['SVE-CTGN', 7.01, 6.244, 766.0, 80.0],['CTGN-RRD', 6.244, 4.06, 2184, 60.0], ['RRD-DKRD', 4.06, 2.99, 1069.9999999999993, 60.0], ['DKRD-SNRDH', 2.99, 2.19, 800.0000000000002, 60.0], ['DKRD-SNRDH', 2.19, 2.08, 109.99999999999987, 60.0], ['SNRDH-MSD', 2.08, 1.22, 860.0000000000001, 40.0], ['MSDH-CSMTH', 1.22, 1.17, 50.00000000000004, 40.0], ['MSDH-CSMTH', 1.17, 1.02, 149.99999999999991, 30.0],['MSDH-CSMTH', 1.02, 0.01, 1020.0, 30.0], 

['CSMTH-MSDH',0.0,0.335,335,30.0],['CSMTH-MSDH',0.335,0.893,558,35.0],['CSMTH-MSDH',0.893,1.22,327,80.0],
['MSDH-SNRDH',1.22,1.719,499,80.0],['MSDH-SNRDH',1.719,2.029,310,60.0],['MSDH-SNRDH',2.029,2.08,51,40.0],
['SNRDH-DKRD',2.08,2.651,571,40.0],['SNRDH-DKRD',2.651,2.691,40, 80.0],['SNRDH-DKRD',2.691,2.927,236.0,55.0],['SNRDH-DKRD',2.927,2.99,63.0,80.0],['DKRD-RRD',2.99,3.353,363,80.0],['DKRD-RRD',3.353,3.78,427,50.0],
['DKRD-RRD', 3.78,4.06,280.0,80.0],['RRD-CTGN',4.06,4.68,620,80.0],['RRD-CTGN',4.68,5.18,500,60.0],
['CTGN-SVE',5.18,6.099,919.0,60.0],['CTGN-SVE',6.099,7.1,1001.0,80.0],['SVE-VDLR',7.1,9.11,2010.9,80.0],
['VDLR-GTBN',9.11,11.48,2370.0,80.0],['GTBN-CHF',11.48,13.68,2200.0,80.0],['CHF-CLA',13.68,15.21,1530,80.0],
['CLA-TKNG',15.21,15.47,260,80.0],['CLA-TKNG',15.47,16.1,630.0, 40.0],['CLA-TKNG',16.1,16.41,310.0,80.0],
['TKNG-CMBR',16.41,17.33,920,95.0],['CMBR-GV',17.33,18.99,1660.0,95.0],['GV-MNKD',18.99,20.84,1850.0,95.0],
['GV-MNKD',20.84,21.12,280,50.0],['MNKD-VSH',21.12,22.15,1030.0,50.0],['MNKD-VSH',22.15,28.582,6432.0,95.0],
['MNKD-VSH',28.582,28.89,308.0,45.0],['VSH-SNPD',28.89,29.0,110,45.0],['VSH-SNPD',29.0,29.60,600,30.0],
['VSH-SNPD', 29.60,30.03,430,85.0],['SNPD-JNJ',30.03,31.34,1310,85.0],['JNJ-NEU',31.34,31.628,288,85.0],
['JNJ-NEU',31.628,32.059,431,55.0],['JNJ-NEU',32.059,32.906,847,80.0],['JNJ-NEU',32.906,34.47,1564,95.0],
['NEU-SWDV',34.47,34.639,169,95.0],['NEU-SWDV',34.639,34.999,360,30.0],['NEU-SWDV', 34.999,35.359,360,90.0],
['NEU-SWDV',35.359,35.84,481,80.0], ['SWDV-BEPR',35.84,36.235,395,80.0],['SWDV-BEPR',36.235,36.53,295,95.0],['SWDV-BEPR',36.53,37.56,1030,80.0],['SWDV-BEPR',37.56,37.667,107,95.0],['SWDV-BEPR',37.667,37.926,259.00,65.0],['SWDV-BEPR',37.926,38.170,244,45.0],['BEPR-KHAG',38.170,38.535,365,45.0],['BEPR-KHAG',38.535,40.085,1550,80.0],['BEPR-KHAG',40.085,40.57,485,95.0],['KHAG-MANR',40.57,40.99,420.0,95.0],['KHAG-MANR',40.99,42.19,1200,90.0],['KHAG-MANR',42.19,43.47,1280.0,95.0],['MANR-KNDS',43.47,44.351,881.00, 95.0],['MANR-KNDS',44.351,45.106,755,90.0],['MANR-KNDS',45.106,45.38,274.0,95.0], ['KNDS-PNVL',45.38,48.94,4560.0,95.0],

['KYN-THK',53.625,52.130,1495.00,100.0],['KYN-THK', 52.13, 51.72, 410, 65.0],['KYN-THK', 51.72, 49.51, 2210, 100.0], ['THK-DI',49.51,48.06,1450,100.0],['DI-KOPR', 48.06, 46.86, 1200.0, 100.0],['KOPR-DW', 46.86, 42.46, 4400.0, 100.0], ['DW-MBQ', 42.46, 40.794, 1666, 100.0], ['DW-MBQ', 40.794, 39.98, 814, 80.0], ['MBQ-KLVA', 39.98, 39.796, 184.0, 80.0], ['MBQ-KLVA', 39.796, 38.551, 1245, 100.0], ['MBQ-KLVA', 38.551, 38.091, 460, 85.0],['MBQ-KLVA',38.091,35.4,2691,100.0], ['KLVA-TNA', 35.4, 33.868, 1532, 100.0], ['KLVA-TNA', 33.868, 33.487, 381,70.0],['KLVA-TNA', 33.487, 33.02, 467, 100.0],['TNA-MLND',33.02, 31.108, 1912, 100.0],['TNA-MLND',31.108,30.812,296,65.0],['TNA-MLND', 30.812, 30.56, 252, 100.0],['MLND-NHR',30.56,28.01,2550,100.0],['NHR-BND', 28.01, 26.56,1450.00,100.0],['BND-KJMG', 26.56, 24.69, 1869.99, 100.0], ['KJMG-VK', 24.69, 22.85,1839.99,100.0], ['VK-GC', 22.85, 19.3, 3550.000000000001, 100.0], ['GC-VVH', 19.3, 18.516, 784.0, 100.0],['GC-VVH', 18.516, 18.226, 290.0, 65.0], ['GC-VVH', 18.226, 17.8, 496, 100.0], ['VVH-CLA', 17.8, 15.39, 2410.0, 100.0], ['CLA-SION', 15.39, 12.71, 2679.9999999999995, 100.0], ['SION-MTN', 12.71, 10.948, 1762.0, 100.0], ['SION-MTN', 10.948, 10.623, 325, 65.0], ['SION-MTN', 10.623, 10.12, 503, 100.0],['MTN-DR', 10.12, 9.26, 860, 100.0], ['MTN-DR', 9.26, 8.85, 410.0000000000001, 100.0], ['DR-PR', 8.85, 7.65, 1199.9999999999993, 100.0], ['PR-CRD', 7.65, 6.07, 1580.0, 100.0], ['CRD-CHG', 6.07, 5.53, 540.0, 100.0], ['CHG-BY', 5.53, 4.04, 1490.0000000000002, 100.0], ['BY-SNRD', 4.04, 2.08, 1960.0, 100.0], ['SNRD-MSD', 2.08, 1.42, 660.0000000000001, 100.0], ['MSD-CSMT', 1.42, 0.6, 820.0, 30.0], ['MSD-CSMT', 0.6, 0.0, 600.0, 30.0],

['CSMT-MSD', 0.0, 0.7, 700.0, 30.0], ['CSMT-MSD', 0.7, 1.0, 300.0, 40.0], ['CSMT-MSD', 1.0, 1.22, 220.0, 100.0], ['MSD-SNRD', 1.22, 2.08, 860.0, 100.0], ['SNRD-BY', 2.08, 3.08, 1000.0, 100.0], ['SNRD-BY', 3.08, 3.23, 150.0, 80.0], ['SNRD-BY', 3.23, 4.04, 810.0, 100.0], ['BY-CHG', 4.04, 5.53, 1490.0, 100.0], ['CHG-CRD', 5.53, 6.07, 540.0, 100.0], ['CRD-PR', 6.07, 7.65, 1580.0, 100.0], ['PR-DR', 7.65, 8.85, 1200.0, 100.0], ['DR-MTN', 8.85, 10.12, 1270.0, 100.0], ['MTN-SION', 10.12, 12.71, 2590.0, 100.0], ['SION-CLA', 12.71, 15.39, 2680.0, 100.0], ['CLA-VVH', 15.39, 17.8, 2410.0, 100.0], ['VVH-GC', 17.8, 19.3, 1500.0, 100.0], ['GC-VK', 19.3, 24.69, 5390.0, 100.0], ['VK-KJMG', 24.69, 26.56, 1870.0, 100.0], ['KJMG-BND', 26.56, 27.911, 1351.0, 100.0], ['BND-NHR', 27.911, 29.181, 1270.0, 50.0], ['NHR-MLND', 29.181, 30.56, 1379.0, 100.0], ['MLND-TNA', 30.56, 33.02, 2460.0, 100.0], ['TNA-KLVA', 33.02, 33.181, 161.0, 100.0], ['TNA-KLVA', 33.181, 33.703, 522.0, 70.0], ['TNA-KLVA', 33.703, 35.4, 1697, 100.0], ['KLVA-MBQ', 35.4, 36.15, 750.0, 100.0], ['KLVA-MBQ', 36.15, 38.423, 2273.0, 100.0], ['KLVA-MBQ', 38.423, 38.741, 318.0, 85.0], ['KLVA-MBQ', 38.741, 39.842, 1101, 100.0], ['KLVA-MBQ', 39.842, 39.98, 138.0, 80.0], ['MBQ-DW', 39.98, 40.84, 860.0, 80.0], ['MBQ-DW', 40.84, 41.03, 190.0, 100.0], ['MBQ-DW', 41.03, 42.46, 1430.0, 100.0], ['DW-KOPR', 42.46, 46.86, 4400.0, 100.0], ['KOPR-DI', 46.86, 47.987, 1127.0, 100.0], ['KOPR-DI', 47.987, 48.06, 73.0, 100.0], ['DI-THK', 48.06, 48.235, 175.0, 100.0],['DI-THK', 48.235, 48.645, 410, 50.0],['DI-THK', 48.645, 49.51, 865, 100.0], ['THK-KYN', 49.51, 49.563, 53.0, 100.0], ['THK-KYN', 49.563, 49.847, 284.0, 70.0],['THK-KYN', 49.847, 52.714, 2867, 100.0],['THK-KYN', 52.714,53.034, 320, 55.0],['THK-KYN', 53.034, 53.650, 616, 100.0],
['KSRA-OMB', 120.56, 120.29, 269.999999999996, 75.0], ['KSRA-OMB', 120.29, 120.17, 120.0, 75.0], ['KSRA-OMB', 120.17, 119.31, 859.9, 75.0], ['KSRA-OMB', 119.31, 118.91, 400.0, 75.0], ['KSRA-OMB', 118.91, 113.43, 5480, 105.0], ['OMB-KE', 113.43, 110.31, 3120.0, 105.0], ['OMB-KE', 110.77, 109.81,960, 100.0], ['OMB-KE', 109.81, 108.30,1510, 105.0], ['OMB-KE', 108.30, 107.30, 1000, 80.0],  ['KE-THS', 107.3, 101.0, 6300, 105.0], ['THS-ATG', 101.0, 96, 5000.000000000002, 105.0], ['THS-ATG', 96.0, 95.6, 400, 80.0], ['THS-ATG', 95.6, 94.87,730, 105.0], ['ATG-ASO', 94.87,92.20,2670 , 105.0], ['ATG-ASO', 92.20, 91.36, 840, 85.0], ['ATG-ASO', 91.36, 90.36, 1000.00, 100.0], ['ATG-ASO', 90.36, 85.43, 4930, 105.0], ['ASO-VSD', 85.43, 80.53, 4900, 105.0], ['ASO-VSD', 80.87, 80.02, 850, 75.0],['ASO-VSD', 80.02,79.4 ,620, 105.0],  ['VSD-KDV',79.4, 72.59, 6810, 105.0],  ['VSD-KDV', 72.59, 72.09, 500, 85.0],['VSD-KDV',72.09, 71.4, 690, 105.0], ['KDV-TLA', 71.4, 65.77, 5630, 105.0], ['KDV-TLA', 65.77, 64.97,800, 90.0],['KDV-TLA', 64.97, 64.52,450, 105.0], ['KDV-TLA', 64.520, 64.05, 470.0,85.0], ['TLA-ABY', 64.05, 63.72,330,85], ['TLA-ABY', 63.72, 59.04,4680, 105.0], ['ABY-SHD', 59.04, 57.45, 1590, 105.0], ['SHD-KYN', 57.45, 56.25,1200,105.0], ['SHD-KYN', 56.25, 55.99,260, 105.0],
['SHD-KYN', 55.99, 55.540,450, 60.0],['SHD-KYN', 55.54, 53.21,2330, 105.0],


['KYN-SHD', 53.21, 54.09, 880.0, 105.0],['KYN-SHD', 54.09, 54.39, 300, 90.0],['KYN-SHD', 54.39, 56.25, 1860, 105.0], 
['SHD-ABY', 56.25, 57.96, 1710.0, 105.0],['ABY-TLA', 57.96, 63.48, 5519.9, 105.0],['ABY-TLA', 63.48, 64.05, 570, 85.0],
 ['TLA-KDV', 64.05, 64.38, 329.9999999999983, 85.0], ['TLA-KDV', 64.38, 71.2, 6820.000000000007, 105.0], ['TLA-KDV', 71.2, 71.7, 500.00, 90.0], 
 ['KDV-VSD', 71.7, 79.26, 7359.9, 105.0], ['KDV-VSD', 79.26, 79.4, 140.00000000000057, 105.0], 
 ['VSD-ASO', 79.4, 79.8, 400, 80.0],['VSD-ASO', 79.8, 85.43, 5630.000000000001, 105.0],
  ['ASO-ATG', 85.43, 90.020, 4590, 105.0], ['ASO-ATG', 90.020, 91.18, 1160.000000000011, 80.0], ['ASO-ATG', 91.18, 91.76, 580, 80.0], ['ASO-ATG', 91.76, 94.87, 3110.0, 105.0],

['ATG-THS', 94.87, 95.26, 390.0, 105.0], ['ATG-THS', 95.26, 95.72, 460, 85.0], ['ATG-THS', 95.72, 101.0, 5280.0, 105.0], ['THS-KE', 101.0, 107.03, 6030.000000000001, 105.0], ['KE-OMB', 107.03, 113.43, 6400.0000000000055, 105.0], ['OMB-KSRA', 113.43, 119.38, 5949.999999999989, 105.0], ['OMB-KSRA', 119.38, 119.7, 320, 50.0], ['OMB-KSRA', 119.7, 120.56,860, 105.0],

['KYN-VLDI',53.16,53.21, 50.0, 40.0], ['KYN-VLDI', 53.21, 55.48, 2269.96, 105.0],['VLDI-ULNR', 55.48, 57.22, 1740.0, 105.0], ['ULNR-ABH', 57.22, 59.16, 1939.99, 105.0], ['ULNR-ABH', 59.16, 59.83, 670.0, 95.0], ['ABH-BUD', 59.83, 60.12, 290.0, 95.0], ['ABH-BUD', 60.12, 66.73,6610, 105.0], ['ABH-BUD', 66.73, 67.18, 450, 90.0], ['ABH-BUD', 67.18, 67.27,90, 90.0],['BUD-VGI', 67.27, 67.55, 280, 85.0], ['BUD-VGI',67.55, 77.99, 10440.0, 105.0], ['VGI-SHELU', 77.99, 82.09, 4100.0, 105.0], ['SHELU-NRL', 82.09, 86.12, 4030.00, 105.0], ['NRL-BVS', 86.12, 92.85, 6729.99, 105.0], ['BVS-KJT', 92.85, 99.7, 6850.0, 105.0], 

['KJT-PDI',99.7,102.92,3200,80.0],['PDI-KLY',102.92,104.03,1110,90.0],['PDI-KLY',104.03,105.29,1250,70.0],['PDI-KLY',105.29,107.86,2570,90.0],['KLY-DLY',107.86,108.43,570,90.0],['DLY-LWJ',108.43,111.58,3150,90.0],['LWJ-KHPI',111.58,112.990,1410,90.0],['LWJ-KHPI',112.990,114.24,1250,30.0],


['KHPI-LWJ',114.24,112.990,1250,30.0],['KHPI-LWJ',112.990,111.58,1410,90.0],['LWJ-DLY',111.58,108.43,3150,90.0],
['DLY-KLY',108.43,107.86,570,90.0],['KLY-PDI',107.86,105.29,2570,90.0],['KLY-PDI',105.29,104.03,1250,70.0],
['KLY-PDI',104.03,102.92,1110,90.0],['PDI-KJT',102.92,99.7,3200,80.0],

['KJT-BVS',99.7,92.85,6850.08, 105.0],['BVS-NRL',92.85,86.12,6729.9, 105.0],['NRL-SHELU', 86.12, 82.09, 4030.0, 105.0],['SHELU-VGI',82.09,77.99,4100.0, 105.0], ['VGI-BUD',77.99,68.77,9220, 105.0],['VGI-BUD',68.77,67.79, 980, 85.0],['VGI-BUD',67.79,67.27, 520, 90.0],['BUD-ABH',67.27, 67.21, 60.0, 105.0], ['BUD-ABH', 67.21, 67.15, 59.9, 105.0],['BUD-ABH', 67.15, 66.23, 920.0, 105.0],['BUD-ABH',66.23, 66.2, 30.0, 105.0],['BUD-ABH',66.2,59.83, 6370.0, 105.0], ['ABH-ULNR',59.83,57.22,2609.99,105.0],['ULNR-VLDI',57.22,55.48,1740.0,105.0],['VLDI-KYN', 55.48, 53.21, 2269.9, 105.0]


]


const fastSectionsList =
[['CSMT-BY',0.0,0.497,497.0,30.0],['CSMT-BY',0.497,0.940,443.0,40.0],['CSMT-BY',0.940,1.198,258.0, 30.0],
['CSMT-BY',1.198,1.845,647,70.0], ['CSMT-BY',1.845,2.945,1100.0, 105.0], ['CSMT-BY',2.945,4.04,1095, 60.0], ['BY-PR', 4.04, 6.00, 1960.0, 105.0], ['BY-PR', 6.00, 6.337, 337.0, 70.0], ['BY-PR', 6.337, 7.312,975.0,105.0], ['BY-PR', 7.312, 7.65,338,80.0], ['PR-DR', 7.65, 7.966,316.0, 80.0], ['PR-DR', 7.966, 8.85,884.0, 105.0], ['DR-MTN',8.85, 10.12, 1270.0, 105.0], ['MTN-SION', 10.12, 10.46, 340.0, 105.0], ['MTN-SION', 10.46, 10.96,500.0, 65.0], ['MTN-SION', 10.96, 12.71, 1750.0, 105.0], ['SION-CLA', 12.71, 15.39, 2680.0, 105.0], ['CLA-GC', 15.39, 18.032, 2642.0, 105.0], ['CLA-GC', 18.032, 18.754, 722.0, 65.0], ['CLA-GC', 18.754, 19.3,546.0, 105.0], ['GC-VK', 19.3, 22.85, 3550.0, 105.0], ['VK-BND', 22.85, 26.56, 3710.0, 105.0], ['BND-MLND', 26.56, 30.56, 4000.0, 105.0], ['MLND-TNA', 30.56, 33.02, 2460.0, 105.0], ['TNA-KLVA', 33.02, 35.4, 2380.0, 105.0], ['KLVA-MBQ', 35.4, 36.631, 1231.0, 105.0], ['KLVA-MBQ', 36.631, 38.481,1850.0, 95.0], ['KLVA-MBQ', 38.481, 39.259,778.0, 85.0], ['KLVA-MBQ', 39.259, 39.98,721.0,100.0], ['MBQ-DW', 39.98, 41.949, 1969.0, 100.0], ['MBQ-DW', 41.949, 42.46,511.0, 105.0], ['DW-DI', 42.46, 48.06, 5600.0, 105.0], ['DI-KYN', 48.06, 52.579, 4519.0, 105.0], ['DI-KYN', 52.579, 52.961,382.0, 65.0], ['DI-KYN', 52.961, 53.550,589.0, 105.0],

['KYN-DI', 53.21, 48.06, 5149.8, 105.0], ['DI-DW', 48.06, 42.46, 5600.0, 105.0], ['DI-DW', 42.46, 41.417, 1042.9999999999993, 105.0], ['DW-MBQ', 41.417, 39.98, 1437.0, 100.0], ['MBQ-KLVA', 39.98, 38.409, 1570.999999999998, 100.0], ['MBQ-KLVA', 38.409, 37.437, 972.0000000000014, 85.0], ['MBQ-KLVA', 37.437, 36.433, 1003.9999999999977, 95.0], ['MBQ-KLVA', 36.433, 35.4, 1033.0000000000014, 105.0], ['KLVA-TNA', 35.4, 33.332, 2067.9999999999977, 105.0], ['KLVA-TNA', 33.332, 33.02, 311.9999999999976, 80.0], ['TNA-MLND', 33.02, 33.01, 10.000000000005116, 80.0], ['TNA-MLND', 33.01, 30.56, 2449.999999999999, 105.0], ['MLND-BND', 30.56, 26.56, 4000.0, 105.0], ['BND-VK', 26.56, 22.85, 3709.9999999999973, 105.0], ['VK-GC', 22.85, 19.3, 3550.000000000001, 105.0], ['GC-CLA', 19.3, 15.39, 3910.0, 105.0], ['CLA-SION', 15.39, 12.71, 2679.9999999999995, 105.0], ['SION-MTN', 12.71, 10.12, 2590.000000000002, 105.0], ['SION-MTN', 10.12, 10.03, 89.99999999999986, 105.0], ['MTN-DR', 10.03, 9.24, 789.9999999999991, 60.0], ['MTN-DR', 9.24, 8.85, 390.00000000000057, 105.0], ['DR-PR', 8.85, 7.65, 1199.9999999999993, 105.0], ['PR-BY', 7.65, 7.3, 350.0, 70.0], ['PR-BY', 7.3, 7.1,200, 105.0], ['PR-BY', 7.1, 7.09, 9.999999999999787, 105.0], ['PR-BY', 7.09, 7.04, 49.99999999999982, 80.0], ['PR-BY', 7.04, 6.03, 1009.9999999999998, 105.0], ['PR-BY', 6.03, 6.01, 20.000000000000462, 70.0], ['PR-BY', 6.01, 4.1, 1910.0000000000002, 105.0], ['PR-BY', 4.1, 4.06, 40.000000000000036, 65.0], ['PR-BY', 4.06, 4.04, 19.999999999999574, 105.0], ['BY-CSMT', 4.04, 3.18, 859.9999999999999, 105.0], ['BY-CSMT', 3.18, 3.11, 70.00000000000028, 65.0], ['BY-CSMT', 3.11, 2.18, 929.9999999999998, 105.0], ['BY-CSMT', 2.18, 2.16, 20.000000000000018, 50.0], ['BY-CSMT', 2.16, 1.17, 990.0000000000002, 105.0], ['BY-CSMT', 1.17, 1.05, 119.99999999999989, 60.0], ['BY-CSMT', 1.05, 1.03, 20.000000000000018, 105.0], ['BY-CSMT', 1.03, 0.05, 980.0, 50.0], ['BY-CSMT', 0.05, 0.0, 50.0, 105.0]]



const fastStationISD =[['SECTION','FROM','TO'],['KYN-DI',0.0,'KYN'],['KYN-DI',3.999,'DI Entry'], ['DI-DW',0.326,'DI '],['DI-DW',5.403,'DW Entry'],['DW-MBQ',0.284,'DW'],
['DW-MBQ',2.183,'MBQ Entry'],  ['MBQ-KLVA', 0.263, 'MBQ'], ['MBQ-KLVA', 3.998, 'KLVA Entry'],  ['KLVA-TNA', 0.268, 'KLVA'], ['KLVA-TNA', 2.266,'TNA Entry'], ['TNA-MLND', 0.46, 'TNA'], ['TNA-MLND', 2.21, 'MLND Entry'],  ['MLND-BND', 0.33, 'MLND'], ['MLND-BND', 3.297, 'BND Entry'],  ['BND-VK', 0.334, 'BND'],['BND-VK', 3.494, 'VK Entry'], ['VK-GC',0.268,'VK'],['VK-GC',3.428,'GC Entry'],['GC-CLA', 0.332, 'GC'],['GC-CLA',3.488,'CLA Entry'],['CLA-SION', 0.341,'CLA'], ['CLA-SION', 2.291, 'SION Entry'], ['SION-MTN', 0.192, 'SION'],['SION-MTN', 2.363,'MTN Entry'],['MTN-DR',0.263,'MTN'],['MTN-DR', 0.974, 'DR Entry'],['DR-PR',0.391,'DR'],
['DR-PR',0.866,'PR Entry'],['PR-BY', 0.185, 'PR'],['PR-BY', 3.498,'BY Entry'],
['BY-CSMT',0.326,'BY'],['BY-CSMT',3.884,'CSMT Entry'],['BY-CSMT', 0.26, 'CSMT'],


['CSMT-BY', 0.0, 'CSMT'], ['CSMT-BY', 3.901, 'BY Entry'], ['BY-PR', 0.326, 'BY '], 
['BY-PR', 3.408, 'PR Entry'],  ['PR-DR', 0.193, 'PR'], ['PR-DR', 0.772, 'DR Entry'], ['DR-MTN', 0.471, 'DR'], ['DR-MTN',1.004,'MTN Entry'],['MTN-SION', 0.266, 'MTN'],['MTN-SION',2.379,'SION Entry'],['SION-CLA', 0.271, 'SION'], ['SION-CLA',2.211,'CLA Entry'], ['CLA-GC', 0.321, 'CLA'], ['CLA-GC', 3.476, 'GC Entry'], ['GC-VK',0.332,'GC'],['GC-VK',3.427,'VK Entry'],['VK-BND', 0.26, 'VK'], ['VK-BND',3.385,'BND Entry'],['BND-MLND',0.334,'BND'],['BND-MLND', 3.541, 'MLND Entry'],['MLND-TNA',0.337,'MLND'],['MLND-TNA',2.190,'TNA Entry'],['TNA-KLVA',0.465,'TNA'],['TNA-KLVA',2.032,'KLVA Entry'], ['KLVA-MBQ', 0.268, 'KLVA'], ['KLVA-MBQ',4.629, 'MBQ Entry'], ['MBQ-DW', 0.271, 'MBQ'], ['MBQ-DW',1.865, 'DW Entry'],['DW-DI',0.286,'DW'],['DW-DI',5.483,'DI Entry'],['DI-KYN', 0.326, 'DI'], ['DI-KYN',4.486,'KYN Entry'], ['DI-KYN', 0.534, 'KYN'],['END',0.001,'END']]

const sectionsListTHB = 
[['PNVL-KNDS', 34.67, 31.459999999999997, 3210.0, 95.0], ['KNDS-MANR', 31.459999999999997, 29.179999999999996, 2280.0, 95.0], ['MANR-KHAG', 29.179999999999996, 27.63, 1550.0, 95.0], ['MANR-KHAG', 27.63, 26.429999999999996, 1200.0, 90.0], ['MANR-KHAG', 26.429999999999996, 26.359999999999996, 70.0, 95.0], ['KHAG-BEPR', 26.359999999999996, 25.507, 853.0, 95.0], ['KHAG-BEPR', 25.507, 24.909000000000002, 598.0, 80.0], ['KHAG-BEPR', 24.909000000000002, 24.197999999999997, 711.0, 40.0], ['BEPR-SWDV', 24.197999999999997, 23.842000000000002, 356.0, 45.0], ['BEPR-SWDV', 23.842000000000002, 23.331999999999997, 510.0, 65.0], ['BEPR-SWDV', 23.331999999999997, 22.328, 1004.0, 80.0], ['BEPR-SWDV', 22.328, 21.868, 460.0, 65.0], ['SWDV-NEU_THB', 21.868, 20.395, 1473, 95.0],
  
  ['NEU_THB-JNJ', 20.395, 17.689999999999998, 2705, 80.0], ['JNJ-TUH', 17.689999999999998, 15.43, 2260, 80.0], ['VSH_THB-SNPD', 18.64, 17.47, 1170, 80.0], ['SNPD-TUH', 17.47, 16.87, 600, 80.0], ['SNPD-TUH', 16.87, 16.25, 620, 30.0], ['SNPD-TUH', 16.25, 15.869999999999997, 380, 80.0], ['SNPD-TUH', 15.869999999999997, 15.810000000000002, 60, 50.0], ['SNPD-TUH', 15.810000000000002, 15.43, 380, 80.0], ['TUH-KPHN', 15.43, 13.689999999999998, 1740, 80.0], ['TUH-KPHN', 13.689999999999998, 13.380000000000003, 310, 70.0], ['TUH-KPHN', 13.380000000000003, 13.18, 200, 65.0], ['TUH-KPHN', 13.18, 12.25, 930, 65.0], ['KPHN-GNSL', 12.25, 12.100000000000001, 150, 65.0], ['KPHN-GNSL', 12.100000000000001, 11.979999999999997, 120, 50.0], ['KPHN-GNSL', 11.979999999999997, 11.122999999999998, 857, 80.0], ['KPHN-GNSL', 11.122999999999998, 11.022999999999996, 100, 75.0], ['KPHN-GNSL', 11.022999999999996, 10.719999999999999, 303, 80.0], ['GNSL-RABE', 10.72, 9.55, 1170, 80.0], ['GNSL-RABE', 9.55, 9.21, 340, 50.0], ['GNSL-RABE', 9.21, 8.4, 810, 80.0], ['RABE-AIRL', 8.399999999999999, 8.25, 150, 80.0], ['RABE-AIRL', 8.25, 8.159999999999997, 90, 70.0], ['RABE-AIRL', 8.159999999999997, 5.920000000000002, 2240, 80.0], ['AIRL-DIGH', 5.920000000000002, 3.299999999999997, 2620, 80.0], ['DIGH-TNA', 3.3, 2.660, 640, 80.0], ['DIGH-TNA',2.660, 1.830, 830, 20.0], ['DIGH-TNA', 1.830, 0.0, 1830, 80.0], ['TNA-DIGH', 0.0, 0.030000000000001137, 30.0, 80.0], ['TNA-DIGH', 0.030000000000001137, 0.269999999999996, 240.0, 70.0], ['TNA-DIGH', 0.269999999999996, 0.3200000000000003, 50.0, 80.0], ['TNA-DIGH', 0.3200000000000003, 0.4399999999999977, 120.0, 75.0], ['TNA-DIGH', 0.44, 1.800, 1360.0, 80.0], ['TNA-DIGH', 1.800, 2.55, 750.0, 20.0], ['TNA-DIGH', 2.55, 3.3, 750, 80.0], ['DIGH-AIRL', 3.3, 4.82, 1524.8, 80.0], ['DIGH-AIRL', 4.82, 5.200000000000003, 380.0, 75.0], ['DIGH-AIRL', 5.200000000000003, 5.920000000000002, 720.0, 80.0], ['AIRL-RABE', 5.920000000000002, 6.780000000000001, 860.0, 80.0], ['AIRL-RABE', 6.780000000000001, 7.119999999999997, 340.0, 75.0], ['AIRL-RABE', 7.119999999999997, 8.310000000000002, 1190.0, 80.0], ['RABE-GNSL', 8.310000000000002, 10.619999999999997, 2310.0, 80.0], ['GNSL-KPHN', 10.62, 11.72, 1100.0, 80.0], ['GNSL-KPHN', 11.72, 12.24, 520.0, 50.0], ['KPHN-TUH', 12.24, 12.38, 140.0, 50.0],['KPHN-TUH', 12.38, 12.490000000000002, 110.0, 70.0], ['KPHN-TUH', 12.490000000000002, 14.509999999999998, 2020.0, 80.0], ['KPHN-TUH', 14.509999999999998, 15.43, 920.0, 65.0], ['TUH-SNPD', 15.43, 15.479999999999997, 50.0, 65.0], ['TUH-SNPD', 15.479999999999997, 16.1, 620.0, 40.0], ['TUH-SNPD', 16.1, 16.88, 780.0, 30.0], ['SNPD-VSH_THB', 16.88, 18.64, 1760.0, 50.0], ['TUH-JNJ', 15.43, 17.689999999999998, 2260.0, 80.0], ['JNJ-NEU_THB', 17.689999999999998, 20.17, 2480.0, 80.0],  ['NEU_THB-SWDV', 20.169999999999998, 20.339000000000002, 169.0, 95.0], ['NEU_THB-SWDV', 20.339000000000002, 20.699, 360.0, 30.0], ['NEU_THB-SWDV', 20.699, 21.059, 360.0, 90.0], ['NEU_THB-SWDV', 21.059, 21.540000000000003, 481.0, 80.0], ['SWDV-BEPR', 21.540000000000003, 21.935, 395.0, 80.0], ['SWDV-BEPR', 21.935, 22.23, 295.0, 95.0], ['SWDV-BEPR', 22.23, 23.26, 1030.0, 80.0], ['SWDV-BEPR', 23.26, 23.367, 107.0, 95.0], ['SWDV-BEPR', 23.367, 23.626, 259.0, 65.0], ['SWDV-BEPR', 23.626, 23.919999999999998, 294.0, 45.0], ['BEPR-KHAG', 23.919999999999998, 24.285, 365.0, 45.0], ['BEPR-KHAG', 24.285, 25.785, 1500.0, 80.0], ['BEPR-KHAG', 25.785, 26.27, 485.0, 95.0], ['KHAG-MANR', 26.27, 26.69, 420.0, 95.0], ['KHAG-MANR', 26.69, 27.889999999999997, 1200.0, 90.0], ['KHAG-MANR', 27.889999999999997, 29.169999999999998, 1280.0, 95.0], ['MANR-KNDS', 29.169999999999998, 30.051, 881.0, 95.0], ['MANR-KNDS', 30.051, 30.806, 755.0, 90.0], ['MANR-KNDS', 30.806, 31.080000000000002, 274.0, 95.0], ['KNDS-PNVL', 31.080000000000002, 34.64, 4560.0, 95.0]]

const sectionSelector = [
  {
    name: "HB",
    stations: ['CSMTH', 'MSDH', 'SNRDH', 'DKRD', 'RRD', 'CTGN', 'SVE', 'VDLR', 'GTBN', 'CHF', 'CLA', 'TKNG', 'CMBR', 'GV', 'MNKD', 'VSH', 'SNPD', 'JNJ', 'NEU', 'SWDV', 'BEPR', 'KHAG', 'MANR', 'KNDS', 'PNVL']
  },
  {
    name: "NE",
    stations: ['CSMT','MSD','SNRD','BY', 'CHG', 'CRD', 'PR', 'DR', 'MTN', 'SION','CLA', 'VVH', 'GC', 'VK', 'KJMG', 'BND', 'NHR', 'MLND', 'TNA', 'KLVA', 'MBQ', 'DW', 'KOPR', 'DI', 'THK', 'KYN', 'SHD', 'ABY', 'TLA', 'KDV', 'VSD', 'ASO', 'ATG', 'THS', 'KE', 'OMB', 'KSRA']
  },
  {
    name: "SE",
    stations: ['CSMT','MSD','SNRD','BY', 'CHG', 'CRD', 'PR', 'DR', 'MTN', 'SION','CLA', 'VVH', 'GC', 'VK', 'KJMG', 'BND', 'NHR', 'MLND', 'TNA', 'KLVA', 'MBQ', 'DW', 'KOPR', 'DI', 'THK', 'KYN','VLDI', 'ULNR', 'ABH', 'BUD', 'VGI', 'SHELU', 'NRL', 'BVS', 'KJT']
  },
  {
    name: "LL",
    stations: ['CSMT','MSD','SNRD','BY', 'CHG', 'CRD', 'PR', 'DR', 'MTN', 'SION','CLA', 'VVH', 'GC', 'VK', 'KJMG', 'BND', 'NHR', 'MLND', 'TNA', 'KLVA', 'MBQ', 'DW', 'KOPR', 'DI', 'THK', 'KYN']
  },
  {
    name: "THB",
    stations: ['TNA','AIRL','RABE', 'GNSL', 'KPHN', 'TUH']
  }
];

const trainCodes = {
    mainLine: {
        fastLocalsSE: { KHPI: ["950XX"], KJT: ["951XX"], BUD: ["952XX"], ABH: ["953XX"] },
        fastLocalsNE: { KSRA: ["954XX"], ASO: ["955XX"], TLA: ["956XX"] },
        fastLocals: { KYN: ["957XX"], DI: ["958XX"], TNA: ["959XX"] },
        slowLocalsSE: { KHPI: ["960XX"], KJT: ["961XX"], BUD: ["962XX"], ABH: ["963XX"] },
        slowLocalsNE: { KSRA: ["964XX"], ASO: ["965XX"], TLA: ["966XX"] },
        slowLocals: { KYN: ["970XX","971XX"], DI: ["972XX"], TNA: ["973XX","974XX"], GC: ["975XX"], CLA: ["976XX"] }
    },
    harbourLine: {
        harbour: { PNVL: ["980XX", "981XX", "982XX"], BEPR: ["983XX","984XX"], VSH: ["985XX"], MNKD_CMBR: ["986XX"], GMN: ["987XX"], BA: ["988XX"],PNVL_GMN: ["989XX"] },
        transHarbour: {  TNA_PNVL: ["990XX"], TNA_NEU: ["992XX","993XX"], TNA_VSH: ["994XX","995XX"] },
        portLine: { URAN_NEU: ["996XX"], URAN_BEPR: ["997XX"] }
    }
};

const stationsSEAndNE = {
  se: ['KYN','VLDI', 'ULNR', 'ABH', 'BUD', 'VGI', 'SHELU', 'NRL', 'BVS', 'KJT','PDI','KLY','DLY','LWJ','KHPI'],
  ne: ['KYN','SHD', 'ABY', 'TLA', 'KDV', 'VSD', 'ASO', 'ATG', 'THS', 'KE', 'OMB', 'KSRA']
};
const sheds = {
  NCS: {
    medha: [
      ['6001-6002-6003-6004'],
      ['6005-6006-6007-6008'],
      ['6009-6010-6011-6012'],
      ['6013-6014-6015-6016']
    ],
    ac_bhel: [
      ['7055-7056-7057-7058'],
      ['7026-7028-7027-7025'],
      ['7051-7052-7053-7054'],
      ['7059-7060-7061-7062'],
      ['7063-7064-7065-7066']
    ],
    bombardier: [
      ['5241-5243-5244-5242'],
      ['5249-5251-5252-5250'],
      ['5253-5255-5256-5254'],
      ['5261-5263-5264-5262'],
      ['5265-5268-5267-5266'],
      ['5269-5271-5272-5270'],
      ['5273-5276-5275-5274'],
      ['5277-5280-5279-5278'],
      ['5281-5284-5283-5282'],
      ['5302-5304-5303-5301'],
      ['5306-5308-5307-5305'],
      ['5310-5312-5311-5309'],
      ['5314-5316-5315-5313'],
      ['5318-5320-5319-5317'],
      ['5322-5324-5323-5321'],
      ['5326-5328-5327-5325'],
      ['5330-5332-5331-5329'],
      ['5334-5336-5335-5333'],
      ['5338-5340-5339-5337'],
      ['5342-5344-5343-5341'],
      ['5346-5348-5347-5345'],
      ['5349-5350-5351-5352'],
      ['5353-5354-5355-5356'],
      ['5357-5358-5359-5360'],
      ['5361-5362-5363-5364'],
      ['5365-5366-5367-5368'],
      ['5401-5402-5403-5404'],
      ['5405-5406-5407-5408'],
      ['5409-5410-5411-5412'],
      ['5413-5414-5415-5416'],
      ['5417-5418-5419-5420'],
      ['5421-5422-5423-5424'],
      ['5425-5426-5427-5428'],
      ['5429-5430-5431-5432']
    ],
    siemens: [[ '1085-1087-1088-1086' ],
  [ '1101-1103-1104-1102' ],
  [ '1105-1107-1108-1106' ],
  [ '1109-1111-1112-1110' ],
  [ '1126-1128-1127-1125' ],
  [ '1185-2057-1059-1176' ],
  [ '1211-1213-1212-1210' ],
  [ '2029-2031-2032-2030' ],
  [ '2061-2063-2064-2062' ],
  [ '2069-2071-2072-2070' ],
  [ '2077-2079-2080-2078' ],
  [ '2089-2091-2092-2090' ],
  [ '2113-2115-2116-2114' ],
  [ '2117-1200-2120-2118' ],
  [ '2119-2127-2128-2126' ],
  [ '2129-2131-2132-2130' ],
  [ '2177-2179-2180-2178' ],
  [ '2198-2200-2199-2197' ],
  [ '2214-2216-2215-2213' ],
  [ '2218-2220-2219-2217' ],
  [ '2230-2232-2231-2229' ],
  [ '2245-2247-2248-2246' ],
  [ '2257-2259-1157-2258' ],
  [ '2261-2263-2264-2262' ],
  [ '2265-2267-2268-2266' ],
  [ '2269-2271-2272-2270' ],
  [ '2277-2279-2280-2278' ],
  [ '2281-2283-2284-2282' ],
  [ '1018-2194-2196-2195-2193' ],
  [ '1168-1201-1071-2096-1199 ' ]] 
  },
  KCS: {
    siemens: [[ '1005-1006-1007-1008' ],
  [ '1011-1010-1009-1012' ],
  [ '1014-1016-1015-1013' ],
  [ '1022-1024-1023-1033' ],
  [ '1030-1019-1031-1029' ],
  [ '1038-1098-1039-1037' ],
  [ '1046-1035-1047-1045' ],
  [ '1048-1050-1052-1099' ],
  [ '1053-1055-1056-1054' ],
  [ '1057-1060-1186-1184' ],
  [ '1065-1067-1068-1066' ],
  [ '1069-2099-1072-1070' ],
  [ '1077-1079-1080-1078' ],
  [ '1084-2012-2011-2009' ],
  [ '1093-1095-1096-1094' ],
  [ '1113-1115-1116-1114' ],
  [ '1121-2170-1124-1122' ],
  [ '1133-1135-1136-1134' ],
  [ '1137-1139-1140-1138' ],
  [ '1145-1147-1148-1146' ],
  [ '1149-1151-1152-1150' ],
  [ '1153-1155-1156-1154' ],
  [ '1173-1017-1174-1172' ],
  [ '1175-1164-1177-1058' ],
  [ '1179-2234-1178-1180' ],
  [ '2022-2024-1034-2021' ],
  [ '2023-1032-1198-1196' ],
  [ '2025-2027-2028-2026' ],
  [ '2033-2035-2036-2034' ],
  [ '2049-2051-2052-2050' ],
  [ '2053-2055-2056-2054' ],
  [ '2085-2087-2088-2086' ],
  [ '2093-2260-1081-2094' ],
  [ '2097-2253-2100-2098' ],
  [ '2133-2135-2136-2134' ],
  [ '2182-2184-2183-2181' ],
  [ '2202-2204-2203-2201' ],
  [ '2210-2212-2211-2209' ]]
    
  },
  SNPD: {
    
    siemens: [[ '1001-1003-1004-1002' ],
  [ '1020-1040-1051-1049' ],
  [ '1042-1021-1043-1041' ],
  [ '1061-1063-1064-1062' ],
  [ '1073-1075-1076-1074' ],
  [ '1090-1091-1092-1089' ],
  [ '1117-1119-1120-1118' ],
  [ '1130-1132-1131-1129' ],
  [ '1141-1143-1144-1142' ],
  [ '1161-1163-1160-1162' ],
  [ '1167-1166-1165-2250' ],
  [ '1170-1097-1171-1169' ],
  [ '1188-2141-1189-1187' ],
  [ '1191-2144-1192-1190' ],
  [ '1194-2143-1195-1193' ],
  [ '1197-1044-1100-1036' ],
  [ '1203-1205-1204-1202' ],
  [ '1207-1209-1208-1206' ],
  [ '2001-2003-2004-2002' ],
  [ '2006-2008-2007-2005' ],
  [ '2014-2016-2015-2013' ],
  [ '2018-2020-2019-2017' ],
  [ '2038-2039-2040-2037' ],
  [ '2045-2047-2048-2046' ],
  [ '2059-2142-2060-2058' ],
  [ '2101-2103-2104-2102' ],
  [ '2109-2111-2112-2110' ],
  [ '2137-2139-2140-2138' ],
  [ '2146-2148-2147-2145' ],
  [ '2151-2152-2191-2149' ],
  [ '2154-2156-2155-2153' ],
  [ '2158-2160-2159-2157' ],
  [ '2162-2164-2163-2161' ],
  [ '2166-2168-2167-2165' ],
  [ '2174-2176-2175-2173' ],
  [ '2186-2188-2187-2185' ],
  [ '2190-2192-2150-2189' ],
  [ '2222-2224-2223-2221' ],
  [ '2228-2226-2227-2225' ],
  [ '2233-2235-2256-2254' ],
  [ '2237-2239-2240-2238' ],
  [ '2249-2251-2252-1082' ],
  [ '2301-2236-2303-2302' ],
  [ '1028-1027-2172-2169' ],
  [ '1123-2171-1026-1025' ] ] 
  }
};


function getRouteData() {
  // Get the original data processing
  const tripRouteData = tripRouteSetter();
  const joinSectionOutput = joinSectionAndDistance();
  const scheduledHalts = processHalts().scheduled;
  const stationPairs = clubStationsForTrip();
  
  // Get trip information to identify from and to stations
  const tripInfo = tripStationInfo();
  const fromStation = tripInfo.fromStation;
  const toStation = tripInfo.toStation;
  
  Logger.log(`Trip: ${fromStation} to ${toStation}`);
  
  // Create a map for quick lookup of scheduled halts
  const scheduledHaltMap = new Map();
  scheduledHalts.forEach(halt => {
    scheduledHaltMap.set(halt.station, halt);
  });
  
  // Create a set of valid section names for filtering
  const validSections = new Set(stationPairs);
  
  // Process the data in a more structured way
  const processedRows = [];
  
  for (let i = 0; i < tripRouteData.length; i++) {
    const [section, distance, stationName] = tripRouteData[i];
    
    // Parse the station data
    const isEntry = stationName.includes("Entry");
    const actualStation = isEntry ? stationName.replace(" Entry", "") : stationName.trim();
    const [startStation, endStation] = section.split("-");
    
    // Skip reverse direction entries UNLESS it contains the "to" station
    if (!validSections.has(section)) {
      // Check if this row contains the "to" station - if so, keep it
      if (actualStation === toStation) {
        Logger.log(`Keeping section ${section} because it contains "to" station ${toStation}`);
      } else {
        Logger.log(`Skipping section ${section} - not in validSections and doesn't contain "to" station`);
        continue;
      }
    }
    
    // Create a structured object for this row
    const rowData = {
      section,
      distance,
      stationName,
      isEntry,
      actualStation,
      startStation,
      endStation,
      isScheduledHalt: scheduledHaltMap.has(actualStation),
      originalIndex: i
    };
    
    // Set initial distance based on rules
    if (isEntry) {
      // If it's an entry and the end station matches and has a section distance
      if (endStation === actualStation && joinSectionOutput[section] !== undefined) {
        // Convert from meters to kilometers
        rowData.distance = joinSectionOutput[section] / 1000;
      } else {
        rowData.distance = 0;
      }
    } else if (!scheduledHaltMap.has(actualStation)) {
      // If it's not an entry and not a scheduled halt
      rowData.distance = 0;
    }
    
    // Add to processed rows
    processedRows.push(rowData);
  }
  
  // Find Entry-Station pairs for cumulative calculations
  const entryStationPairs = [];
  
  for (let i = 0; i < processedRows.length; i++) {
    const row = processedRows[i];
    
    // Look for entries with distances
    if (row.isEntry && row.distance > 0) {
      // Find the matching station
      for (let j = i + 1; j < processedRows.length; j++) {
        const nextRow = processedRows[j];
        if (!nextRow.isEntry && nextRow.actualStation === row.actualStation) {
          // Found a matching pair
          entryStationPairs.push({
            entry: row,
            station: nextRow
          });
          Logger.log(`Found Entry-Station pair: ${row.actualStation} Entry (${row.distance}) -> ${nextRow.actualStation} Station (${nextRow.distance})`);
          break;
        }
      }
    }
  }
  
  Logger.log(`Total Entry-Station pairs found: ${entryStationPairs.length}`);
  entryStationPairs.forEach((pair, index) => {
    Logger.log(`Pair ${index}: ${pair.entry.actualStation} Entry -> ${pair.station.actualStation} Station`);
  });
  
  // Perform the cumulative calculations
  let cumulativeDistance = 0;
  
  Logger.log("Starting cumulative calculations...");
  
  for (let i = 0; i < entryStationPairs.length; i++) {
    const pair = entryStationPairs[i];
    
    Logger.log(`Processing pair ${i}: ${pair.entry.actualStation} Entry (original: ${pair.entry.distance}) -> ${pair.station.actualStation} Station (original: ${pair.station.distance})`);
    
    const originalEntryValue = pair.entry.distance;
    const originalStationValue = pair.station.distance;
    
    if (i === 0) {
      // First pair: use the standard logic
      pair.entry.distance = Math.max(0, originalEntryValue - originalStationValue);
      pair.station.distance = originalEntryValue;
      cumulativeDistance = originalEntryValue;
      
      Logger.log(`Pair ${i} result: Entry = ${pair.entry.distance}, Station = ${pair.station.distance}, Cumulative = ${cumulativeDistance}`);
    } else {
      // Subsequent pairs: apply the same logic but add to previous cumulative
      const newEntryDistance = cumulativeDistance + (originalEntryValue - originalStationValue);
      const newStationDistance = cumulativeDistance + originalEntryValue;
      
      Logger.log(`Pair ${i} calculation: Previous cumulative = ${cumulativeDistance}`);
      Logger.log(`Entry calculation = ${cumulativeDistance} + (${originalEntryValue} - ${originalStationValue}) = ${newEntryDistance}`);
      Logger.log(`Station calculation = ${cumulativeDistance} + ${originalEntryValue} = ${newStationDistance}`);
      
      pair.entry.distance = newEntryDistance;
      pair.station.distance = newStationDistance;
      cumulativeDistance = newStationDistance;
      
      Logger.log(`Pair ${i} result: Entry = ${pair.entry.distance}, Station = ${pair.station.distance}, Cumulative = ${cumulativeDistance}`);
    }
  }
  
  // Convert back to the original array format, but filter out Entry stations with zero distance
  const preliminaryData = [];
  let firstEntryFound = false;
  
  processedRows.forEach(row => {
    // Include all non-Entry stations
    if (!row.isEntry) {
      preliminaryData.push([row.section, row.distance, row.stationName]);
    }
    // For Entry stations, either include the first one or ones with non-zero distance
    else if (!firstEntryFound || row.distance > 0) {
      preliminaryData.push([row.section, row.distance, row.stationName]);
      firstEntryFound = true;
    }
  });
  
  // **FIX 1: Set the "from" station distance to 0**
  for (let i = 0; i < preliminaryData.length; i++) {
    const [section, distance, stationName] = preliminaryData[i];
    const actualStation = stationName.includes("Entry") ? stationName.replace(" Entry", "") : stationName.trim();
    
    if (actualStation === fromStation && !stationName.includes("Entry")) {
      preliminaryData[i][1] = 0;
      Logger.log(`Set from station ${fromStation} distance to 0`);
      break; // Only set the first occurrence
    }
  }
  
  // **FIX 2: Ensure the "to" station is included**
  // Check if the last entry is the "to" station's Entry, and if so, add the actual station
  if (preliminaryData.length > 0) {
    const lastRow = preliminaryData[preliminaryData.length - 1];
    const [lastSection, lastDistance, lastStationName] = lastRow;
    
    // Check if last row is an Entry for the "to" station
    if (lastStationName.includes("Entry")) {
      const lastActualStation = lastStationName.replace(" Entry", "").trim();
      
      if (lastActualStation === toStation) {
        Logger.log(`Last entry is ${toStation} Entry, need to add actual ${toStation} station`);
        
        // Look through the original tripRouteData to find the station that follows this entry
        let foundStationRow = null;
        
        for (let i = 0; i < tripRouteData.length; i++) {
          const [section, distance, stationName] = tripRouteData[i];
          
          // Look for the Entry row first
          if (stationName.includes("Entry")) {
            const entryStation = stationName.replace(" Entry", "").trim();
            if (entryStation === toStation) {
              // Found the Entry, now look for the next row which should be the station
              if (i + 1 < tripRouteData.length) {
                const nextRow = tripRouteData[i + 1];
                const [nextSection, nextDistance, nextStationName] = nextRow;
                const nextActualStation = nextStationName.includes("Entry") ? 
                  nextStationName.replace(" Entry", "").trim() : nextStationName.trim();
                
                if (nextActualStation === toStation && !nextStationName.includes("Entry")) {
                  // This is our station row
                  foundStationRow = [nextSection, nextDistance, nextStationName];
                  Logger.log(`Found station row in original data: [${nextSection}, ${nextDistance}, ${nextStationName}]`);
                  break;
                }
              }
            }
          }
        }
        
        if (foundStationRow) {
          // Calculate the proper distance for this station
          // The station distance should be: Entry distance + section distance
          const entryDistance = lastDistance;
          const [stationSection, originalStationDistance, stationName] = foundStationRow;
          
          // Get the inter-station distance for this section from joinSectionOutput
          const sectionDistance = joinSectionOutput[stationSection] ? joinSectionOutput[stationSection] / 1000 : 0;
          const calculatedStationDistance = entryDistance + sectionDistance;
          
          Logger.log(`Entry distance: ${entryDistance}, Section distance: ${sectionDistance}, Calculated station distance: ${calculatedStationDistance}`);
          
          foundStationRow[1] = calculatedStationDistance; // Update the distance
          preliminaryData.push(foundStationRow);
          Logger.log(`Added to station: [${foundStationRow[0]}, ${foundStationRow[1]}, ${foundStationRow[2]}]`);
        } else {
          Logger.log(`Could not find the station row for ${toStation} in original tripRouteData`);
          Logger.log(`Will create it manually...`);
          
          // Create the station row manually
          // Find what section this station should belong to
          const stationSection = stationPairs.find(pair => pair.startsWith(toStation + "-"));
          if (stationSection) {
            // Calculate distance: Entry distance + section distance
            const sectionDistance = joinSectionOutput[stationSection] ? joinSectionOutput[stationSection] / 1000 : 0;
            const calculatedDistance = lastDistance + sectionDistance;
            
            const manualStationRow = [stationSection, calculatedDistance, toStation];
            preliminaryData.push(manualStationRow);
            Logger.log(`Created to station manually: [${stationSection}, ${calculatedDistance}, ${toStation}]`);
          } else {
            Logger.log(`Could not determine section for ${toStation}`);
          }
        }
      }
    }
  }
  
  Logger.log("Fixed trip route data:");
  Logger.log(preliminaryData);
  
  // Write the result to the spreadsheet
  const spreadsheet = SpreadsheetApp.openByUrl(url);
  const sectionsSheet = spreadsheet.getSheetByName('SignalAndSpeed');
  sectionsSheet.getRange(2, 1, sectionsSheet.getLastRow(), 3).clearContent();
  sectionsSheet.getRange(2, 1, preliminaryData.length, preliminaryData[0].length).setValues(preliminaryData);
  
  Logger.log("Fixed data has been written to the SignalAndSpeed sheet.");
  
  return {
    tripRouteData: preliminaryData,
    joinSectionOutput: joinSectionOutput,
    scheduledHalts: scheduledHalts
  };
}









function getRouteData2005() {
  // Cache function calls to avoid repeating expensive operations
  const tripRouteData = tripRouteSetter();
  const joinSectionOutput = joinSectionAndDistance();
  const scheduledHalts = processHalts().scheduled;
  const stationPairs = clubStationsForTrip();
  
  // Create a map for quick lookup of scheduled halts
  const scheduledHaltMap = new Map();
  scheduledHalts.forEach(halt => {
    scheduledHaltMap.set(halt.station, halt);
  });
  
  // Create a set of valid section names for filtering
  const validSections = new Set(stationPairs);
  
  // Process the data in a more structured way
  // First convert array data to objects for clarity
  const processedRows = [];
  
  for (let i = 0; i < tripRouteData.length; i++) {
    const [section, distance, stationName] = tripRouteData[i];
    
    // Skip reverse direction entries
    if (!validSections.has(section)) {
      continue;
    }
    
    // Parse the station data
    const isEntry = stationName.includes("Entry");
    const actualStation = isEntry ? stationName.replace(" Entry", "") : stationName.trim();
    const [startStation, endStation] = section.split("-");
    
    // Create a structured object for this row
    const rowData = {
      section,
      distance,
      stationName,
      isEntry,
      actualStation,
      startStation,
      endStation,
      isScheduledHalt: scheduledHaltMap.has(actualStation),
      originalIndex: i
    };
    
    // Set initial distance based on rules
    if (isEntry) {
      // If it's an entry and the end station matches and has a section distance
      if (endStation === actualStation && joinSectionOutput[section] !== undefined) {
        // Convert from meters to kilometers
        rowData.distance = joinSectionOutput[section] / 1000;
      } else {
        rowData.distance = 0;
      }
    } else if (!scheduledHaltMap.has(actualStation)) {
      // If it's not an entry and not a scheduled halt
      rowData.distance = 0;
    }
    
    // Add to processed rows
    processedRows.push(rowData);
  }
  
  // Find Entry-Station pairs for cumulative calculations
  const entryStationPairs = [];
  
  for (let i = 0; i < processedRows.length; i++) {
    const row = processedRows[i];
    
    // Look for entries with distances
    if (row.isEntry && row.distance > 0) {
      // Find the matching station
      for (let j = i + 1; j < processedRows.length; j++) {
        const nextRow = processedRows[j];
        if (!nextRow.isEntry && nextRow.actualStation === row.actualStation) {
          // Found a matching pair
          entryStationPairs.push({
            entry: row,
            station: nextRow
          });
          break;
        }
      }
    }
  }
  
  // Perform the cumulative calculations
  let cumulativeDistance = 0;
  
  for (let i = 0; i < entryStationPairs.length; i++) {
    const pair = entryStationPairs[i];
    
    // Add entry distance to cumulative
    cumulativeDistance += pair.entry.distance;
    
    if (i === 0) {
      // First pair: subtract station value from entry
      const entryValue = pair.entry.distance;
      const stationValue = pair.station.distance;
      
      pair.entry.distance = Math.max(0, entryValue - stationValue);
      pair.station.distance = entryValue;
    } else {
      // Subsequent pairs
      const prevStationValue = entryStationPairs[i-1].station.distance;
      const entryValue = pair.entry.distance;
      const stationValue = pair.station.distance;
      
      const newStationValue = prevStationValue + entryValue;
      const newEntryValue = Math.max(0, newStationValue - stationValue);
      
      pair.entry.distance = newEntryValue;
      pair.station.distance = newStationValue;
    }
  }
  
  // Convert back to the original array format, but filter out Entry stations with zero distance
  // (except for the first station)
  const finalData = [];
  let firstEntryFound = false;
  
  processedRows.forEach(row => {
    // Include all non-Entry stations
    if (!row.isEntry) {
      finalData.push([row.section, row.distance, row.stationName]);
    }
    // For Entry stations, either include the first one or ones with non-zero distance
    else if (!firstEntryFound || row.distance > 0) {
      finalData.push([row.section, row.distance, row.stationName]);
      firstEntryFound = true;
    }
    // Skip Entry stations with zero distance (except the first one)
  });
  
  Logger.log("Final optimized trip route data (filtered zero-distance Entries):");
  Logger.log(finalData);
  
  // Write the result to the spreadsheet
  const spreadsheet = SpreadsheetApp.openByUrl(url);
  const sectionsSheet = spreadsheet.getSheetByName('SignalAndSpeed');
  sectionsSheet.getRange(2, 1, sectionsSheet.getLastRow(), 3).clearContent();
  sectionsSheet.getRange(2, 1, finalData.length, finalData[0].length).setValues(finalData);
  
  Logger.log("Data has been written to the SignalAndSpeed sheet.");
  
  return {
    tripRouteData: finalData,
    joinSectionOutput: joinSectionOutput,
    scheduledHalts: scheduledHalts
  };
}

function getRouteDataWithFillZeros() {
  // First, get the processed data from our previous function
  const { tripRouteData, joinSectionOutput, scheduledHalts } = getRouteData();
  
  // Get trip info and the full list of stations in order
  const tripInfo = tripStationInfo();
  const fromStation = tripInfo.fromStation;
  const toStation = tripInfo.toStation;
  const stationsInOrder = finalRoutesList();
  
  // Get the static KM mapping (distances from CSMT)
  const fastStationKMMap = getFastStationKMMap();
  
  Logger.log("Trip direction: " + fromStation + " to " + toStation);
  
  // Create a filtered dataset without the "Entry" marker for the "from" station (if it exists)
  const filteredTripRouteData = tripRouteData.filter(row => {
    // Check if this row is an Entry marker for the "from" station
    if (row[2].includes("Entry") && row[2].trim().replace(" Entry", "") === fromStation) {
      Logger.log(`Filtering out Entry marker for from station: ${row[0]} ${row[2]}`);
      return false;
    }
    return true;
  });
  
  // Create a map of station names to their row indices in the filtered data
  const stationToIndexMap = new Map();
  for (let i = 0; i < filteredTripRouteData.length; i++) {
    const stationName = filteredTripRouteData[i][2];
    if (!stationName.includes("Entry")) {
      // Extract just the station code (e.g., "KYN" from "KYN ")
      const stationCode = stationName.trim();
      stationToIndexMap.set(stationCode, i);
    }
  }
  
  // Find known distances in our data
  const knownDistances = new Map();
  for (let i = 0; i < filteredTripRouteData.length; i++) {
    const row = filteredTripRouteData[i];
    const distance = row[1];
    const stationName = row[2];
    
    if (!stationName.includes("Entry") && distance > 0) {
      const stationCode = stationName.trim();
      knownDistances.set(stationCode, distance);
    }
  }
  
  // Calculate the distance from fromStation for each station using the static map
  // The distances stored in the fastStationKMMap are relative to CSMT
  
  // Distance from fromStation to each station in the route
  const distanceFromStart = new Map();
  
  // Base value - the distance of the fromStation from CSMT
  const fromStationBaseValue = fastStationKMMap[fromStation] || 0;
  
  // Calculate distances for all stations in the route
  stationsInOrder.forEach(station => {
    if (fastStationKMMap[station] !== undefined) {
      // Calculate distance from fromStation
      // If going from CSMT, this is just the value in the map
      // If going to CSMT, it's the difference between station and fromStation
      // For other routes, it's the relative difference
      const stationDistanceFromCSMT = fastStationKMMap[station];
      
      // The distance from start is the absolute difference from the fromStation
      let distanceFromStartValue = Math.abs(stationDistanceFromCSMT - fromStationBaseValue);
      
      // If we're traveling away from CSMT, stations farther from CSMT have higher distances
      // If we're traveling towards CSMT, stations closer to CSMT have higher distances
      if ((fromStationBaseValue > stationDistanceFromCSMT && toStation !== "CSMT") ||
          (fromStationBaseValue < stationDistanceFromCSMT && toStation === "CSMT")) {
        // Adjust distance for direction
        distanceFromStartValue = knownDistances.get(toStation) - distanceFromStartValue;
      }
      
      distanceFromStart.set(station, distanceFromStartValue);
    }
  });
  
  // Give preference to known distances from our data
  knownDistances.forEach((distance, station) => {
    distanceFromStart.set(station, distance);
  });
  
  // Set the fromStation distance to 0
  distanceFromStart.set(fromStation, 0);
  
  Logger.log("Calculated distances from start:");
  Logger.log(Object.fromEntries(distanceFromStart));
  
  // Fill in zero distances using the calculated values
  for (let i = 0; i < filteredTripRouteData.length; i++) {
    const row = filteredTripRouteData[i];
    const stationName = row[2];
    
    // Process all regular stations
    if (!stationName.includes("Entry")) {
      const stationCode = stationName.trim();
      
      // Use our calculated distance if available
      if (distanceFromStart.has(stationCode)) {
        const calculatedDistance = distanceFromStart.get(stationCode);
        
        // Update the distance in our data
        filteredTripRouteData[i][1] = calculatedDistance;
        
        Logger.log(`Updated ${stationCode} distance to ${calculatedDistance}`);
      }
    }
  }
  
  // Sort the data by distance to ensure proper ordering
  filteredTripRouteData.sort((a, b) => a[1] - b[1]);
  
  Logger.log("Final trip route data with filled zeros:");
  Logger.log(filteredTripRouteData);
  
  // Write the result to the spreadsheet
  const spreadsheet = SpreadsheetApp.openByUrl(url);
  const sectionsSheet = spreadsheet.getSheetByName('SignalAndSpeed');
  sectionsSheet.getRange(2, 1, sectionsSheet.getLastRow(), 3).clearContent();
  sectionsSheet.getRange(2, 1, filteredTripRouteData.length, filteredTripRouteData[0].length).setValues(filteredTripRouteData);
  
  Logger.log("Data has been written to the SignalAndSpeed sheet.");
  
  return {
    tripRouteData: filteredTripRouteData,
    joinSectionOutput: joinSectionOutput,
    scheduledHalts: scheduledHalts
  };
}



function generateStationLocations(sectionsList) {
  const stationMap = new Map();

  sectionsList.forEach(([section, startKM, endKM]) => {
    stationMap.set(section.split("-")[0], startKM);
    stationMap.set(section.split("-")[1], endKM);
  });

  // Convert to sorted array based on distance (descending if towards CSMT)
  return [...stationMap.entries()].sort((a, b) => b[1] - a[1]);
}

function getTrainDirectionAndSection(trainNo) {
 
    const trainData = getLatestTrainData(); // Get latest train data to access from/to
    const trainCode = trainCodeFinder(trainNo);
    if (!trainCode) {
        Logger.log("Train code not found.");
        return null;
    }
    
    const lastDigit = parseInt(trainCode.toString().slice(-1));
    const direction = (lastDigit % 2 === 0) ? "UP" : "DN";
    
    for (const [section, data] of Object.entries(trainCodes)) {
        if (typeof data === 'object') {
            for (const [subSection, codes] of Object.entries(data)) {
                for (const [key, values] of Object.entries(codes)) {
                    if (values.some(value => trainCode.toString().startsWith(value.slice(0, 3)))) {
                        if (section === "harbourLine" && subSection === "transHarbour") {
                            // Check stations to determine specific THB route
                            const fromStation = trainData.from;
                            const toStation = trainData.to;
                            
                            // For VSH_THB-TNA route
                            if (fromStation === "VSH_THB" || toStation === "VSH_THB" || 
                                fromStation === "SNPD" || toStation === "SNPD") {
                                return direction + "THB_VSH";
                            }
                            // For PNVL-TNA route
                            else if (fromStation === "PNVL" || toStation === "PNVL" || 
                                     fromStation === "JNJ" || toStation === "JNJ" || 
                                     fromStation === "NEU_THB" || toStation === "NEU_THB" ||
                                     fromStation === "SWDV" || toStation === "SWDV" ||
                                     fromStation === "BEPR" || toStation === "BEPR" ||
                                     fromStation === "KHAG" || toStation === "KHAG" ||
                                     fromStation === "MANR" || toStation === "MANR" ||
                                     fromStation === "KNDS" || toStation === "KNDS") {
                                return direction + "THB_PNVL";
                            }
                            // Default THB case
                            else {
                                return direction + "THB";
                            }
                        } else if (section === "harbourLine" && subSection === "portLine") {
                            return direction + "PORT";
                        } else {
                            return direction + subSection.toUpperCase();
                        }
                    }
                }
            }
        }
    }
    
    Logger.log("No matching section found.");
    return null;
}

function getTrainDirectionAndSection130525(trainNo) {
    const trainCode = trainCodeFinder(trainNo);
    if (!trainCode) {
        Logger.log("Train code not found.");
        return null;
    }
    
    const lastDigit = parseInt(trainCode.toString().slice(-1));
    const direction = (lastDigit % 2 === 0) ? "UP" : "DN";
    
    for (const [section, data] of Object.entries(trainCodes)) {
        if (typeof data === 'object') {
            for (const [subSection, codes] of Object.entries(data)) {
                for (const [key, values] of Object.entries(codes)) {
                    if (values.some(value => trainCode.toString().startsWith(value.slice(0, 3)))) {
                        if (section === "harbourLine" && subSection === "transHarbour") {
                            return direction + "THB";
                        } else if (section === "harbourLine" && subSection === "portLine") {
                            return direction + "PORT";
                        } else {
                            return direction + subSection.toUpperCase();
                        }
                    }
                }
            }
        }
    }
    
    Logger.log("No matching section found.");
    return null;
}


function getStations() {
 
  const trDir = getTrainDirectionAndSection()
Logger.log(trDir)
  return stations;
}

function getTrainTypeForTheTrip() {
  const dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("Database");
  const lr = dataSheet.getLastRow();
  Logger.log(lr);
  const trainType = dataSheet.getRange(lr, 13).getValue(); // Column M
  Logger.log(trainType);
 return trainType.toLowerCase();
}

function tripStationInfo(){
  const dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("Database");
  const lr = dataSheet.getLastRow();
  Logger.log(lr)
  const tripData = dataSheet.getRange(lr,1,1,12).getValues();
  const fronStn = tripData.flat()[4]
  const toStn=  tripData.flat()[5] 
  Logger.log({fromStation:fronStn,toStation:toStn}) 
  
  return {fromStation:fronStn,toStation:toStn}
}

function getWheelDiaForTheTrip() {
  const dataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("Database");
  const lr = dataSheet.getLastRow();
  Logger.log(lr);
  const wheelDia = dataSheet.getRange(lr, 14).getValue(); // Column M
  Logger.log(typeof wheelDia);
 return wheelDia;
}

// Convert speed from km/h to meters/second
function kmphToMps(speedKmph) {
  return (speedKmph * 1000) / 3600; // (km/h * 1000m/km) / (3600s/h)
}

// Calculate time difference in seconds between two timestamps
function getTimeDiffInSeconds(time1, time2) {
  // Assuming time format is "HH:mm:ss" or "HH:mm"
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  
  const seconds1 = hours1 * 3600 + minutes1 * 60;
  const seconds2 = hours2 * 3600 + minutes2 * 60;
  
  return Math.abs(seconds2 - seconds1);
}

// Calculate distance for a single time period
function calculateDistance(speedKmph, timeDiffSeconds) {
  // const speedMps = kmphToMps(speedKmph);
  
  return speedKmph * timeDiffSeconds; // distance in meters
}

// Main function to calculate total distance from sheet data
function calculateTotalDistance(startDist = null, endDist = null) {
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName('SPM Data');
  const data = sheet.getRange("A1:D"+sheet.getLastRow()).getValues();
  
  // Remove header
  const rows = data.slice(1);
 
  // If start and end distances are specified, find the corresponding row indices
  let startIndex = 0;
  let endIndex = rows.length - 1;
  
  if (startDist !== null && endDist !== null) {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][3] >= startDist && startIndex === 0) {
        startIndex = i;
      }
      if (rows[i][3] <= endDist) {
        endIndex = i;
      }
    }
  }
  // Logger.log(startIndex)
  // Logger.log(endIndex)
  let totalDistance = 0;
  
  // Calculate distance for each time period between selected rows
  for (let i = startIndex; i < endIndex; i++) {
    const currentSpeed = rows[i][2]; // Speed from current row
   // const timeDiff = getTimeDiffInSeconds(rows[i][1], rows[i + 1][1]);
    const distance = calculateDistance(currentSpeed,5/18);
    // Logger.log(distance)
    totalDistance += distance;
  }
  Logger.log(totalDistance)
  return totalDistance;
}

// Function to get distance between specific distances
function getDistanceBetweenPoints(startDistance, endDistance) {
  
  return calculateTotalDistance(startDistance,endDistance);
}

// Function to get total distance (entire dataset)
function getTotalDistance() {
  return calculateTotalDistance();
}





function processSPMDataForAnalysis() {
  try {
    //filterAndTransformData();
   // duplicateDataRemover();
   const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0");
  const sheet = ss.getSheetByName("Reports");
  sheet.getRange("A265:O350").clearContent()//+sheet.getLastRow()
   const trainType = getTrainTypeForTheTrip();
   const trainData = getLatestTrainData();
    const isTransHarbour = isTrainTransHarbour(trainData.trainCode);
    trainType === 'fast' ? getCleanRouteData() : transformArrayForRoutes();
    getAndSetStationNamesInSPMData();
    if (isTransHarbour){
      processTrainSpeedLimitsForTHBLines()
      Logger.log("THB LINE")
    }else{
    processTrainSpeedLimits()
    }
    //findClosestValueInSheetForPSR();
     findClosestValueInSheetForTSR();
    //processTrainTSRLimits()
    return "Data processed successfully!";
  } catch (e) {
    Logger.log("Error in processSPMDataForAnalysis: " + e);
    throw e; // Re-throw the error so it reaches the client
  }
}
function generateReports() {
  try {
      pasteReportsToSheet();
     // createBrakingLineChartsInDestinationSheet();
     createBrakingLineChartsFixed()
      findChartsToDelete();
      createComboChartSections();
      // processHaltsWithBraking()
      processHaltsWithSignalBraking()
      createBrakingLineChartsForNonScheduledHalts()
      generateOverspeedReport()
      getDriverHistoryByUniqueRuns() 
      generateStartToFirstHaltChart()
      creatPDFwithCrewName();
      return "Reports generated successfully!";
  } catch (e) {
    Logger.log("Error in generateReports: " + e);
    throw e; // Re-throw the error so it reaches the client
  }
}

function creatPDFwithCrewName() {
  
const ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/11V2xAxjEGOlSSI1a84GwK168MgVdi1kgcIBuALfuoFU/edit?gid=0#gid=0")
const pdfSheet = ss.getSheetByName("Reports")

const date = new Date(pdfSheet.getRange("D10").getValue())

var timeZone = Session.getScriptTimeZone();
var localTime = Utilities.formatDate(date, timeZone, "dd-MM-yyyy")

let pdfNameFirst = pdfSheet.getRange("D7").getValue();
let pdfNameSecond = localTime;
let pdfNameThird = pdfSheet.getRange("H4").getValue();
let pdfNameFourth = pdfSheet.getRange("H7").getValue();
let pdfName = pdfNameFirst+pdfNameSecond+pdfNameThird+pdfNameFourth
let sheets = ss.getSheets()

for(let i = 0;i<sheets.length;i++){
  if(sheets[i].getSheetName()!= "Reports"){
   sheets[i].hideSheet()
   
  }

}

var recipient = "mdjayakumar.nair@gmail.com"
let myFile = DriveApp.getFileById("1NniWYZ3oXRhCYmdKR_8T8PBEFDYDHMaB97aePvRLSSQ")

let pdfFile = myFile.getAs('application/pdf').setName(pdfName)

let creatPDF = DriveApp.createFile(pdfFile)
//folder of pdf == https://drive.google.com/drive/folders/1A869xowv2azN1MRu_U9cXh2hdfBHRKkU

GmailApp.sendEmail(recipient, "PDF Report", "Please find attached the PDF report.", {
    attachments: [creatPDF]
  });


let myFolder = DriveApp.getFolderById("1QEJLUOqDG1EAX8SgNhI_tbttdeU8RUgC") // googledrive folder spm reports id

creatPDF.moveTo(myFolder)


for(let i = 0;i<sheets.length;i++){
  if(sheets[i].getSheetName()!= "Reports"){
   sheets[i].showSheet()
   
}
}
}


function trainCodeFinder(trainNo) {
 
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName('All Locals');
  const range = sheet.getRange("A2:B" + sheet.getLastRow());
  const data = range.getValues();

  // Convert array to a Map for fast lookup
  const trainMap = new Map(data.map(row => [row[0], row[1]]));

  let trainCode = trainMap.get(trainNo) || null; // O(1) lookup

  Logger.log(trainCode);
  return trainCode;
}

function extraDistanceTracker(){
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var spmData = spmDataSheet.getDataRange().getValues();
  
  var result = findoutClosestValuesInSPMData();
  Logger.log(result)

  var targetStations = ["SNRD","MTN","VVH","NHR","TNA","DW","DI"];
  var differences = findDistanceDifferences(result, targetStations);
  Logger.log(differences);
}

function findDistanceDifferences(result, targetStations) {
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var spmData = spmDataSheet.getDataRange().getValues();
  
  var differences = [];
  
  for (var i = 0; i < targetStations.length; i++) {
    var targetStation = targetStations[i];
    
    // Find the target station's distance from the result
    var targetStationDistance = null;
    for (var j = 0; j < result.closestStationsWithClosestValues.length; j++) {
      if (result.closestStationsWithClosestValues[j].station === targetStation) {
        targetStationDistance = result.closestStationsWithClosestValues[j].distance;
        break;
      }
    }
    
    if (targetStationDistance === null) {
      Logger.log("Target station '" + targetStation + "' not found.");
      continue;
    }
    
    // Find the closest cumulative distance in the SPM data sheet
    var closestCumulativeDistance = null;
    var minDiff = Infinity;
    for (var k = 1; k < spmData.length; k++) {
      if (spmData[k][2] === 0 && spmData[k][3] === 0) {
        var cumulativeDistance = spmData[k][4];
        var diff = Math.abs(cumulativeDistance / 1000 - targetStationDistance);
        if (diff < minDiff) {
          minDiff = diff;
          closestCumulativeDistance = cumulativeDistance / 1000;
        }
      }
    }
    
    if (closestCumulativeDistance === null) {
      Logger.log("No matching cumulative distance found for target station '" + targetStation + "'.");
      continue;
    }
    
    // Calculate the difference
    var difference = Math.abs(targetStationDistance - closestCumulativeDistance);
    Logger.log("Target station '" + targetStation + "' distance: " + targetStationDistance);
    Logger.log("Closest cumulative distance: " + closestCumulativeDistance);
    Logger.log("Difference: " + difference);
    
    differences.push({
      station: targetStation,
      targetDistance: targetStationDistance,
      closestCumulativeDistance: closestCumulativeDistance,
      difference: difference
    });
  }
  
  return differences;
}

function findClosestValuesInSPMDataWhereCAndDAreZero() {
  // Get the closest and previous stations (assuming these functions are already defined)
  var closestStations = findClosestStations();

  // Open the SPM Data sheet and get all data
  var spmDataSheet = SpreadsheetApp.openByUrl(url).getSheetByName("SPM Data");
  var spmData = spmDataSheet.getDataRange().getValues();

  // Filter SPM data where columns C and D are 0
  var filteredSPMData = spmData.filter(function(row) {
    return row[2] === 0 && row[3] === 0; // Columns C and D are 0
  });

  // Find closest values in the filtered SPM data
  
  var closestStationsWithClosestValues = [];

  // Process closest stations
  for (var i = 0; i < closestStations.length; i++) {
    var closestDistance = findClosestCumulativeDistance(filteredSPMData, closestStations[i].distance);
    closestStationsWithClosestValues.push({
      station: closestStations[i].station,
      distance: closestDistance
    });
  }


  Logger.log("Closest Stations with Closest Values (where C and D are 0):");
  Logger.log(closestStationsWithClosestValues);

  // Return the results
  return {
    
    closestStationsWithClosestValues: closestStationsWithClosestValues
  };
}


function interStationDistanceTracker(){
  var interStationDistances = findClosestValuesInSPMDataWhereCAndDAreZero();
  Logger.log(interStationDistances);
}

function calculateDistanceDifferences() {
  // Step 1: Get closest station data from findoutClosestValuesInSPMData()
  var closestStationsData = findoutClosestValuesInSPMData().closestStationsWithClosestValues;

  // Step 2: Get closest station data where columns C and D are 0
  var closestStationsWhereCAndDAreZero = findClosestValuesInSPMDataWhereCAndDAreZero().closestStationsWithClosestValues;

  // Step 3: Calculate the differences
  var distanceDifferences = [];

  for (var i = 0; i < closestStationsData.length; i++) {
    var stationName = closestStationsData[i].station;
    var originalDistance = closestStationsData[i].distance;
    
    // Find the corresponding station in the filtered data
    var filteredStation = closestStationsWhereCAndDAreZero.find(function(station) {
      return station.station === stationName;
    });

    if (filteredStation) {
      var filteredDistance = filteredStation.distance;
      var difference = Math.abs(originalDistance - filteredDistance);

      distanceDifferences.push({
        station: stationName,
        originalDistance: originalDistance,
        filteredDistance: filteredDistance,
        difference: difference
      });
    } else {
      // If the station is not found in the filtered data, log a warning
      Logger.log("Warning: Station " + stationName + " not found in filtered data.");
    }
  }

  // Step 4: Log and return the results
  Logger.log("Distance Differences:");
  Logger.log(distanceDifferences);

  return distanceDifferences;
}


function getClosestStationsWithClosestDistance() {
  // Step 1: Call the existing function
  var result = findoutClosestValuesInSPMData();

  // Step 2: Extract the closest stations data
  var closestStationsWithClosestValues = result.closestStationsWithClosestValues;

  // Step 3: Log and return the result
  Logger.log("Closest Stations with Closest Distances:");
  Logger.log(closestStationsWithClosestValues);

  return closestStationsWithClosestValues;
}


function calculateInterStationDistances(stationData) {
  var interStationDistances = [];

  for (var i = 0; i < stationData.length; i++) {
    var station = stationData[i].station;
    var distance = stationData[i].distance;

    // Calculate inter-station distance
    var interStationDistance = null;
    if (i > 0) {
      var previousDistance = stationData[i - 1].distance;
      interStationDistance = distance - previousDistance;
    }

    interStationDistances.push({
      station: station,
      distance: distance,
      interStationDistance: interStationDistance
    });
  }

  return interStationDistances;
}

function calculateInterStationDistancesForBothDatasets() {
  // Get the closest stations data from both functions
  var closestStationsData = getClosestStationsWithClosestDistance();
  var closestStationsWhereCAndDAreZero = findClosestValuesInSPMDataWhereCAndDAreZero().closestStationsWithClosestValues;

  // Calculate inter-station distances for both datasets
  var interStationDistances1 = calculateInterStationDistances(closestStationsData);
  var interStationDistances2 = calculateInterStationDistances(closestStationsWhereCAndDAreZero);

  // Log and return the results
  Logger.log("Inter-Station Distances for Dataset 1:");
  Logger.log(interStationDistances1);

  Logger.log("Inter-Station Distances for Dataset 2:");
  Logger.log(interStationDistances2);

  return {
    dataset1: interStationDistances1,
    dataset2: interStationDistances2
  };
}

function getLatestTrainData() {
  var sheet = SpreadsheetApp.openByUrl(url).getSheetByName("Database");
  if (!sheet) {
    Logger.log("Sheet 'Database' not found.");
    return null;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) { // Assuming row 1 contains headers
    Logger.log("No data available.");
    return null;
  }

  var data = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0]; // Get last row data

  // Extracting required fields using column indices (1-based index in Sheets)
  var trainNo = data[3]; // Column 5 (Train No)
  var trainData = {
    trainNo: trainNo,
    trainCode: trainCodeFinder(trainNo), // Call trainCodeFinder function
    from: data[4],           // Column 6 (From)
    to: data[5],             // Column 7 (To)
    trainType: data[12],     // Column 13 (Train Type)
    wheelDiameter: data[13]  // Column 14 (Wheel Diameter)
  };

  Logger.log(trainData);
  return trainData;
}


const hbAndlocalLineISD =[['SECTION','FROM','TO'],['PNVL-KNDS', 0.0, 'PNVL'], ['PNVL-KNDS', 3.004, 'KNDS  Entry'], ['KNDS-MANR', 0.276, 'KNDS'], ['KNDS-MANR', 1.639, 'MANR  Entry'], ['MANR-KHAG', 0.274, 'MANR'], ['MANR-KHAG', 2.627, 'KHAG  Entry'], ['KHAG-BEPR', 0.276, 'KHAG'], ['KHAG-BEPR', 2.064, 'BEPR  Entry'], ['BEPR-SWDV', 0.27, 'BEPR'], ['BEPR-SWDV', 2.097, 'SWDV Entry'], ['SWDV-NEU', 0.306, 'SWDV'], ['SWDV-NEU', 1.128, 'NEU  Entry'], ['NEU-JNJ', 0.272, 'NEU'], ['NEU-JNJ', 2.219, 'JNJ  Entry'], ['JNJ-SNPD', 0.27, 'JNJ'], ['JNJ-SNPD', 1.602, 'SNPD  Entry'], ['SNPD-VSH', 0.267, 'SNPD'], ['SNPD-VSH', 0.898, 'VSH  Entry'], ['VSH-MNKD', 0.264, 'VSH'], ['VSH-MNKD', 7.187, 'MNKD  Entry'], ['MNKD-GV', 0.267, 'MNKD'], ['MNKD-GV', 1.749, 'GV  Entry'], ['GV-CMBR', 0.272, 'GV'], ['GV-CMBR', 1.369, 'CMBR  Entry'], ['CMBR-TKNG', 0.264, 'CMBR'], ['CMBR-TKNG', 0.978, 'TKNG  Entry'], ['TKNG-CLA', 0.27, 'TKNG'], ['TKNG-CLA', 0.96, 'CLA Entry'], ['CLA-CHF', 0.28, 'CLA'], ['CLA-CHF', 1.674, 'CHF  Entry'], ['CHF-GTBN', 0.263, 'CHF'], ['CHF-GTBN', 1.404, 'GTBN  Entry'], ['GTBN-VDLR', 0.262, 'GTBN'], ['GTBN-VDLR', 2.388, 'VDLR  Entry'], ['VDLR-SVE', 0.262, 'VDLR'], ['VDLR-SVE', 1.758, 'SVE  Entry'], ['SVE-CTGN', 0.281, 'SVE'], ['SVE-CTGN', 1.507, 'CTGN  Entry'], ['CTGN-RRD', 0.267, 'CTGN'], ['CTGN-RRD', 0.77, 'RRD  Entry'], ['RRD-DKRD', 0.264, 'RRD'], ['RRD-DKRD', 1.013, 'DKRD  Entry'], ['DKRD-SNRDH', 0.265, 'DKRD'], ['DKRD-SNRDH', 0.417, 'SNRD  Entry'], ['SNRDH-MSDH', 0.263, 'SNRDH'], ['SNRDH-MSDH', 0.839, 'MSD  Entry'], ['MSDH-CSMTH', 0.268, 'MSDH'], ['MSDH-CSMTH', 0.988, 'CSMTH  Entry'], ['MSDH-CSMTH', 0.265, 'CSMTH'], 


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
 ['PDI-KJT', 2.801, 'KJT Entry'], ['KJT-BVS', .262, 'KJT'], ['KJT-BVS', 6.702, 'BVS Entry'], ['BVS-NRL', .280, 'BVS'], ['BVS-NRL', 6.716, 'NRL Entry'],['NRL-SHELU', .351, 'NRL'], ['NRL-SHELU', 4.018, 'SHELU Entry'], ['SHELU-VGI', .266, 'SHELU'],['SHELU-VGI', 3.996,'VGI Entry'],['VGI-BUD', .264,'VGI'],['VGI-BUD',10.763, 'BUD Entry'],['BUD-ABH',.316, 'BUD'], ['BUD-ABH', 7.626, 'ABH Entry'], ['ABH-ULNR', .272, 'ABH'], ['ABH-ULNR', 2.488, 'ULNR Entry'], ['ULNR-VLDI', .268, 'ULNR'], ['ULNR-VLDI', 1.965, 'VLDI Entry'], ['VLDI-KYN', .266, 'VLDI'], ['VLDI-KYN', 2.216, 'KYN Entry'], ['VLDI-KYN', .270, 'KYN']

]



function processTrainTSRLimits() {
  const ss = SpreadsheetApp.openByUrl(url);
  const sheet = ss.getSheetByName("SPM Data");
  
  // Load train data
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  
  // Define column indices
  const TIME_COL = 1;
  const SPEED_COL = 2;
  const DISTANCE_COL = 3;
  const CUM_DIST_COL = 4;
  const TSR_COL = 11; // Column for TSR
  
  // Get the train type for this trip
  const trainType = getTrainTypeForTheTrip();
  Logger.log("Detected train type for TSR: " + trainType);
  
  // Get station information based on train type (same logic as PSR)
  let stationToKMMap;
  let enhancedStations;
  
  if (trainType === "fast") {
    // For fast trains, we need all stations regardless of halts
    stationToKMMap = getFastStationKMMap();
    Logger.log("Using Fast train station map for TSR");
    
    // Get detected halting stations
    const detectedHalts = matchHaltsWithStations();
    Logger.log("Detected halting stations for TSR: " + JSON.stringify(detectedHalts));
    
    // Get ordered list of all stations on this route
    const orderedStations = finalRoutesList();
    Logger.log("Ordered stations for TSR route: " + JSON.stringify(orderedStations));
    
    if (!orderedStations || orderedStations.length < 2) {
      Logger.log("Error: Could not determine route stations for TSR");
      return "Error: Could not determine route stations for TSR";
    }
    
    // Create a map of stations that have halts and their actual distances
    const haltingStationMap = {};
    detectedHalts.forEach(halt => {
      if (halt.station !== "Unknown") {
        haltingStationMap[halt.station] = halt.distance;
      }
    });
    
    // Calculate the last data point's cumulative distance
    const lastCumDist = data.length > 1 ? data[data.length - 1][CUM_DIST_COL] : 0;
    
    // Use the separate function to calculate directional distances
    enhancedStations = calculateDirectionalDistances(
      orderedStations,
      stationToKMMap,
      haltingStationMap,
      0, // Start distance
      lastCumDist // End distance (estimated)
    );
    
    Logger.log("Enhanced stations for Fast train TSR: " + JSON.stringify(enhancedStations));
  } else {
    // For slow trains, use the original logic with only halting stations
    stationToKMMap = getStationKMMap();
    Logger.log("Using Slow train station map for TSR");
    
    // Get detected halting stations
    const detectedStations = matchHaltsWithStations();
    Logger.log("Detected stations for TSR: " + JSON.stringify(detectedStations));
    
    // Enhance the station data with official KM posts
    enhancedStations = detectedStations.map(station => ({
      name: station.station,
      actualCumDist: station.distance,
      officialKM: stationToKMMap[station.station] || null
    })).filter(station => station.name !== "Unknown" && station.officialKM !== null);
    
    // Sort by actualCumDist to ensure proper order
    enhancedStations.sort((a, b) => a.actualCumDist - b.actualCumDist);
  }
  
  Logger.log("Enhanced stations with KM posts for TSR: " + JSON.stringify(enhancedStations));
  
  // Get TSR segment-based limits dynamically
  const tsrSegmentLimits = getTSRSegmentBasedLimits(enhancedStations);
  Logger.log("TSR segment limits: " + JSON.stringify(tsrSegmentLimits));
  
  // Process each data point to apply the correct TSR speed limit
  for (let i = 1; i < data.length; i++) { // Skip header row
    const cumDist = data[i][CUM_DIST_COL];
    
    // Get normalized position within the current segment
    const position = normalizePosition(cumDist, enhancedStations);
    
    // Get correct TSR speed limit
    const tsrSpeedLimit = getTSRSpeedLimit(position, tsrSegmentLimits);
    
    // Update the TSR value
    if (tsrSpeedLimit !== null) {
      data[i][TSR_COL] = tsrSpeedLimit;
    }
  }
  
  // Write the updated data back to the sheet
  dataRange.setValues(data);
  
  return `TSR speed limits adjusted successfully for ${trainType} train`;
}

function getTSRSegmentBasedLimits(enhancedStations) {
  const tsrData = getTSRData();
  
  if (!tsrData || tsrData.length === 0) {
    Logger.log("No TSR data found");
    return [];
  }
  
  const segmentLimits = [];
  
  // Process each consecutive pair of stations to create segments
  for (let i = 0; i < enhancedStations.length - 1; i++) {
    const currentStation = enhancedStations[i];
    const nextStation = enhancedStations[i + 1];
    
    const segmentName = `${currentStation.name}-${nextStation.name}`;
    const segmentStartKM = currentStation.officialKM;
    const segmentEndKM = nextStation.officialKM;
    
    // Determine if KM increases or decreases in this segment
    const isIncreasing = segmentEndKM > segmentStartKM;
    const segmentKMStart = Math.min(segmentStartKM, segmentEndKM);
    const segmentKMEnd = Math.max(segmentStartKM, segmentEndKM);
    const totalSegmentKM = segmentKMEnd - segmentKMStart;
    
    // Find TSR restrictions that overlap with this segment
    const applicableTSRs = tsrData.filter(tsr => {
      const tsrStart = Math.min(tsr.fromKM, tsr.toKM);
      const tsrEnd = Math.max(tsr.fromKM, tsr.toKM);
      
      // Check if TSR overlaps with segment
      return !(tsrEnd <= segmentKMStart || tsrStart >= segmentKMEnd);
    });
    
    if (applicableTSRs.length > 0) {
      const limits = [];
      
      // Convert TSR KM positions to percentage within segment
      applicableTSRs.forEach(tsr => {
        const tsrStartKM = Math.min(tsr.fromKM, tsr.toKM);
        const tsrEndKM = Math.max(tsr.fromKM, tsr.toKM);
        
        // Clip TSR to segment boundaries
        const clippedStartKM = Math.max(tsrStartKM, segmentKMStart);
        const clippedEndKM = Math.min(tsrEndKM, segmentKMEnd);
        
        if (clippedStartKM < clippedEndKM) {
          // Convert to percentages based on segment direction
          let startPct, endPct;
          
          if (isIncreasing) {
            startPct = (clippedStartKM - segmentKMStart) / totalSegmentKM;
            endPct = (clippedEndKM - segmentKMStart) / totalSegmentKM;
          } else {
            // For decreasing KM, flip the percentages
            startPct = (segmentKMEnd - clippedEndKM) / totalSegmentKM;
            endPct = (segmentKMEnd - clippedStartKM) / totalSegmentKM;
          }
          
          limits.push({
            startPct: Math.max(0, Math.min(1, startPct)),
            endPct: Math.max(0, Math.min(1, endPct)),
            limit: tsr.speed
          });
        }
      });
      
      if (limits.length > 0) {
        // Sort and merge overlapping limits
        limits.sort((a, b) => a.startPct - b.startPct);
        const mergedLimits = mergeTSRLimits(limits);
        
        segmentLimits.push({
          segment: segmentName,
          limits: mergedLimits
        });
      }
    }
  }
  
  return segmentLimits;
}

function mergeTSRLimits(limits) {
  if (limits.length === 0) return [];
  
  const merged = [];
  let current = {...limits[0]};
  
  for (let i = 1; i < limits.length; i++) {
    const next = limits[i];
    
    // If overlapping or adjacent with same speed, merge
    if (next.startPct <= current.endPct + 0.001 && next.limit === current.limit) {
      current.endPct = Math.max(current.endPct, next.endPct);
    } else if (next.startPct <= current.endPct) {
      // If overlapping with different speed, prioritize stricter (lower) speed
      if (next.limit < current.limit) {
        // Split current limit if needed
        if (next.startPct > current.startPct) {
          merged.push({
            startPct: current.startPct,
            endPct: next.startPct,
            limit: current.limit
          });
        }
        current = {
          startPct: next.startPct,
          endPct: Math.max(current.endPct, next.endPct),
          limit: next.limit
        };
      } else {
        // Keep current limit, but may need to extend it
        current.endPct = Math.max(current.endPct, next.endPct);
      }
    } else {
      // No overlap, add current and start new
      merged.push(current);
      current = {...next};
    }
  }
  
  merged.push(current);
  return merged;
}

function getTSRSpeedLimit(position, tsrSegmentLimits) {
  if (!position) return null;
  
  // Find the TSR segment definition
  const tsrSegment = tsrSegmentLimits.find(s => s.segment === position.segment);
  if (!tsrSegment) return null;
  
  // Find the applicable TSR limit within the segment
  for (const limit of tsrSegment.limits) {
    if (position.percentage >= limit.startPct &&
        position.percentage < limit.endPct) {
      return limit.limit;
    }
  }
  
  return null;
}


const interSignalDataFastSection =[['KYN-DI', 'KYN S-48 ', 0.0], ['KYN-DI', 'KYN S-39', 340.0], ['KYN-DI', 'KYN S-19', 242.0], ['KYN-DI', 'KYN S-8', 584.0], ['KYN-DI', 'K-5102', 798.0], ['KYN-DI', 'K-5008', 481.0], ['KYN-DI', 'K-5002', 419.0], ['KYN-DI', 'K-4910', 454.0], ['KYN-DI', 'K-4902', 471.0], ['KYN-DI', 'K-4814', 399.0], ['KYN-DI', 'DI S-41', 481.0], ['DI-DW', 'DI S-33', 510.0], ['DI-DW', 'K-4708', 342.0], ['DI-DW', 'K-4702', 390.0], ['DI-DW', 'K-4610', 661.0], ['DI-DW', 'K-4512', 601.0], ['DI-DW', 'K-4508', 390.0], ['DI-DW', 'K-4502', 400.0], ['DI-DW', 'K-4410', 382.0], ['DI-DW', 'K-4404', 390.0], ['DI-DW', 'K-4314', 390.0], ['DI-DW', 'K-4308', 390.0], ['DI-DW', 'DW S-67', 477.0], ['DI-DW', 'DW S-65', 396.0], ['DW-MBQ', 'DW S-54', 460.0], ['DW-MBQ', 'DW S-49', 334.0], ['DW-MBQ', 'DW S-46', 471.0], ['DW-MBQ', 'K-4020', 442.0], ['DW-MBQ', 'K-4014', 367.0], ['MBQ-KLVA', 'K-3912', 839.0], ['MBQ-KLVA', 'K-3904', 430.0], ['MBQ-KLVA', 'K-3810', 526.0], ['MBQ-KLVA', 'K-3804', 578.0], ['MBQ-KLVA', 'K-3712', 405.0], ['MBQ-KLVA', 'K-3704', 666.0], ['MBQ-KLVA', 'K-3604', 578.0], ['MBQ-KLVA', 'K-3514', 659.0], ['KLVA-TNA', 'K-3506', 486.0], ['KLVA-TNA', 'K-3414', 497.0], ['KLVA-TNA', 'K-3408', 351.0], ['KLVA-TNA', 'TNA S-90', 505.0], ['KLVA-TNA', 'TNA S-82', 475.0], ['KLVA-TNA', 'TNA S-65', 350.0], ['TNA-MLND', 'TNA S-46', 536.0], ['TNA-MLND', 'TNA S-11', 520.0], ['TNA-MLND', 'MLND S-16', 909.0], ['TNA-MLND', 'K-056', 511.0], ['MLND-BND', 'MLND S-11', 492.0], ['MLND-BND', 'K-054', 513.0], ['MLND-BND', 'K-052', 527.0], ['MLND-BND', 'K-2808', 462.0], ['MLND-BND', 'K-050', 654.0], ['MLND-BND', 'K-048', 412.0], ['MLND-BND', 'BND S-24', 366.0], ['BND-VK', 'K-046', 686.0], ['BND-VK', 'K-2514', 360.0], ['BND-VK', 'K-044 A', 390.0], ['BND-VK', 'K-044', 416.0], ['BND-VK', 'K-042', 606.0], ['BND-VK', 'VK S-30', 663.0], ['BND-VK', 'VK S-25', 546.0], ['VK-GC', 'VK S-22', 782.0], ['VK-GC', 'K-038', 398.0], ['VK-GC', 'K-036', 400.0], ['VK-GC', 'K-036 A', 397.0], ['VK-GC', 'K-034', 403.0], ['VK-GC', 'K-032', 433.0], ['VK-GC', 'K-030', 519.0], ['VK-GC', 'K-028', 609.0], ['GC-CLA', 'K-026', 613.0], ['GC-CLA', 'VVH S-42', 360.0], ['GC-CLA', 'VVH S-34', 400.0], ['GC-CLA', 'VVH S-9', 580.0], ['GC-CLA', 'VVH S-3', 400.0], ['GC-CLA', 'K-024', 430.0], ['GC-CLA', 'K-024 A', 450.0], ['GC-CLA', 'K-024 B', 613.0], ['CLA-SION', 'CLA S-43', 587.0], ['CLA-SION', 'CLA S-47', 695.0], ['CLA-SION', 'K-022', 471.0], ['CLA-SION', 'K-020', 647.0], ['SION-MTN', 'K-018', 666.0], ['SION-MTN', 'K-016', 406.0], ['SION-MTN', 'K-016 A', 390.0], ['SION-MTN', 'K-014', 390.0], ['SION-MTN', 'DR S-28', 350.0], ['SION-MTN', 'DR S-29', 446.0], ['SION-MTN', 'DR S-32', 591.0], ['MTN-DR', 'DR S-35', 518.0], ['MTN-DR', 'DR S-37', 368.0], ['MTN-DR', 'DR S-42', 459.0], ['DR-PR', 'DR S-45', 267.0], ['DR-PR', 'K-012', 235.0], ['DR-PR', 'PR S-29', 272.0], ['PR-BY', 'PR S-11', 388.0], ['PR-BY', 'PR S-14', 700.0], ['PR-BY', 'PR S-13', 700.0], ['PR-BY', 'BY S-49', 673.0], ['PR-BY', 'BY S-41', 500.0], ['PR-BY', 'BY S-34', 340.0], ['PR-BY', 'BY S-28', 345.0], ['BY-CSMT', 'BY S-15', 530.0], ['BY-CSMT', 'K-008', 769.0], ['BY-CSMT', 'MZN S-12', 360.0], ['BY-CSMT', 'MZN S-15', 414.0], ['BY-CSMT', 'K-004', 500.0], ['BY-CSMT', 'CSMT S-61', 540.0], ['BY-CSMT', 'CSMT S-81', 358.0], ['BY-CSMT', 'CSMT S-48', 335.0], ['BY-CSMT', 'CSMT S-28', 370.0], ['BY-CSMT', 'CSMT PF-6 EMU BOARD', 495.0],['BY-CSMT', 'CSMT PF-6 EMU BOARD', 495.0], ['CSMT-BY', 'CSMT S-5', 0.0], ['CSMT-BY', 'CSMT S-45', 515.0], ['CSMT-BY', 'CSMT S-56', 290.0], ['CSMT-BY', 'MZN S-5', 370.0], ['CSMT-BY', 'MZN S-2', 530.0], ['CSMT-BY', 'MZN S-1', 340.0], ['CSMT-BY', 'K-007', 680.0], ['CSMT-BY', 'BY S-1', 446.0], ['CSMT-BY', 'BY S-2', 649.0], ['BY-PR', 'BY S-25', 425.0], ['BY-PR', 'K-009', 650.0], ['BY-PR', 'BY S-46', 330.0], ['BY-PR', 'BY S-51', 325.0], ['BY-PR', 'K-013', 375.0], ['BY-PR', 'K-015', 390.0], ['BY-PR', 'PR S-2', 740.0], ['BY-PR', 'PR S-20', 440.0], ['PR-DR', 'PR S-22', 363.0], ['PR-DR', 'DR S-2', 363.0], ['PR-DR', 'DR S-5', 493.0], ['DR-MTN', 'DR S-8', 389.0], ['DR-MTN', 'DR S-15', 578.0], ['DR-MTN', 'DR S-17', 400.0], ['MTN-SION', 'DR S-21', 313.0], ['MTN-SION', 'K-017', 575.0], ['MTN-SION', 'K-017 A', 406.0], ['MTN-SION', 'K-019', 396.0], ['MTN-SION', 'K-021', 403.0], ['MTN-SION', 'K-021A', 421.0], ['SION-CLA', 'K-023', 404.0], ['SION-CLA', 'CLA S-4', 794.0], ['SION-CLA', 'K-025', 685.0], ['SION-CLA', 'K-025 A', 620.0], ['CLA-GC', 'CLA S-11', 425.0], ['CLA-GC', 'K-027', 484.0], ['CLA-GC', 'K-029', 588.0], ['CLA-GC', 'K-031', 480.0], ['CLA-GC', 'VVH S-6', 450.0], ['CLA-GC', 'VVH S-27', 430.0], ['CLA-GC', 'VVH S-37', 525.0], ['CLA-GC', 'VVH S-49', 405.0], ['GC-VK', 'K-035', 470.0], ['GC-VK', 'K-037', 684.0], ['GC-VK', 'K-039', 465.0], ['GC-VK', 'K-041', 537.0], ['GC-VK', 'K-041 A', 400.0], ['GC-VK', 'K-043', 400.0], ['GC-VK', 'VK S-2', 400.0], ['VK-BND', 'VK S-5', 784.0], ['VK-BND', 'K-047', 400.0], ['VK-BND', 'K-047 A', 456.0], ['VK-BND', 'K-049', 669.0], ['VK-BND', 'K-051', 407.0], ['VK-BND', 'K-053', 459.0], ['VK-BND', 'K-053 A', 417.0], ['VK-BND', 'BND S-2', 432.0], ['BND-MLND', 'BND S-17', 432.0], ['BND-MLND', 'BND S-27', 736.0], ['BND-MLND', 'K-2715', 577.0], ['BND-MLND', 'K-055', 596.0], ['BND-MLND', 'K-057', 678.0], ['BND-MLND', 'MLND S-3', 330.0], ['MLND-TNA', 'MLND S-6', 919.0], ['MLND-TNA', 'K-059', 760.0], ['MLND-TNA', 'TNA S-4', 590.0], ['MLND-TNA', 'TNA S-18', 445.0], ['MLND-TNA', 'TNA S-51', 422.0], ['TNA-KLVA', 'TNA S-71', 515.0], ['TNA-KLVA', 'TNA S-75', 220.0], ['TNA-KLVA', 'K-3403', 565.0], ['TNA-KLVA', 'K-3409', 400.0], ['TNA-KLVA', 'K-3501', 400.0], ['TNA-KLVA', 'K-3507', 400.0], ['KLVA-MBQ', 'K-3513', 421.0], ['KLVA-MBQ', 'K-3601', 400.0], ['KLVA-MBQ', 'K-3609', 1516.0], ['KLVA-MBQ', 'K-3703', 408.0], ['KLVA-MBQ', 'K-3711', 602.0], ['KLVA-MBQ', 'K-3803', 500.0], ['KLVA-MBQ', 'K-3809', 500.0], ['KLVA-MBQ', 'K-3905', 500.0], ['KLVA-MBQ', 'K-3911', 504.0], ['MBQ-DW', 'K-4001', 399.0], ['MBQ-DW', 'K-4017', 707.0], ['MBQ-DW', 'DW S-3', 516.0], ['MBQ-DW', 'DW S-7', 719.0], ['DW-DI', 'DW S-14', 600.0], ['DW-DI', 'K-4301', 551.0], ['DW-DI', 'DCC S-9', 410.0], ['DW-DI', 'K-4401', 398.0], ['DW-DI', 'K-4407', 391.0], ['DW-DI', 'K-4413', 392.0], ['DW-DI', 'K-4507', 395.0], ['DW-DI', 'K-4509', 340.0], ['DW-DI', 'K-4515', 411.0], ['DW-DI', 'K-4613', 689.0], ['DW-DI', 'K-4705', 626.0], ['DW-DI', 'DI S-29', 416.0], ['DI-KYN', 'DI S-39', 657.0], ['DI-KYN', 'K-4815', 444.0], ['DI-KYN', 'K-4903', 486.0], ['DI-KYN', 'K-4913', 580.0], ['DI-KYN', 'K-5003', 400.0], ['DI-KYN', 'K-5011', 418.0], ['DI-KYN', 'KYN S-3', 418.0], ['DI-KYN', 'KYN S-12', 780.0], ['DI-KYN', 'KYN S-13', 565.0], ['DI-KYN', 'KYN S-46', 450.0], ['DI-KYN', 'KYN S-56', 435.0]]

const interSignalDistance = [['CSMT-MSD', 'CSMT PF-3 S-3', 0.0], ['CSMT-MSD', 'L-001', 617.0], ['CSMT-MSD', 'L-003', 250.0], ['MSD-SNRD', 'L-005', 392.0], ['MSD-SNRD', 'L-007', 409.0], ['MSD-SNRD', 'L-009', 339.0], ['SNRD-BY', 'L-011', 427.0], ['SNRD-BY', 'L-013', 501.0], ['SNRD-BY', 'L-015', 446.0], ['SNRD-BY', 'BY S-14', 396.0], ['BY-CHG', 'BY S-23', 433.0], ['BY-CHG', 'BY S-29', 371.0], ['BY-CHG', 'L-021', 364.0], ['BY-CHG', 'L-023', 421.0], ['CHG-CRD', 'L-025', 325.0], ['CRD-PR', 'L-027', 459.0], ['CRD-PR', 'L-029', 420.0], ['CRD-PR', 'PR S-1', 543.0], ['CRD-PR', 'PR S-3', 453.0], ['PR-DR', 'PR S-19', 523.0], ['PR-DR', 'DR S-4', 468.0], ['DR-MTN', 'DR S-6', 438.0], ['DR-MTN', 'L-031', 540.0], ['DR-MTN', 'L-033', 420.0], ['MTN-SION', 'DR S-20', 464.0], ['MTN-SION', 'DR D-24', 414.0], ['MTN-SION', 'L-035', 449.0], ['MTN-SION', 'L-037', 442.0], ['MTN-SION', 'L-039', 455.0], ['MTN-SION', 'L-041', 425.0], ['SION-CLA', 'L-043', 503.0], ['SION-CLA', 'L-045', 670.0], ['SION-CLA', 'L-049', 515.0], ['SION-CLA', 'L-051', 389.0], ['SION-CLA', 'CLA S-1', 389.0], ['CLA-VVH', 'CLA S-8', 590.0], ['CLA-VVH', 'CLA S-21', 566.0], ['CLA-VVH', 'L-053', 463.0], ['CLA-VVH', 'VVH S-2', 481.0], ['CLA-VVH', 'VVH S-7', 535.0], ['VVH-GC', 'VVH S-29', 421.0], ['VVH-GC', 'L-055', 349.0], ['VVH-GC', 'VVH S-47', 424.0], ['GC-VK', 'VVH S-56', 633.0], ['GC-VK', 'L-057', 390.0], ['GC-VK', 'L-059', 430.0], ['GC-VK', 'L-061', 402.0], ['GC-VK', 'L-063', 425.0], ['GC-VK', 'L-065', 453.0], ['GC-VK', 'L-067', 396.0], ['GC-VK', 'VK S-1', 437.0], ['VK-KJMG', 'VK S-3', 694.0], ['VK-KJMG', 'L-071', 649.0], ['VK-KJMG', 'L-075', 641.0], ['KJMG-BND', 'L-077', 548.0], ['KJMG-BND', 'L-079', 491.0], ['KJMG-BND', 'L-081', 557.0], ['KJMG-BND', 'BND S-14', 433.0], ['BND-NHR', 'BND S-16', 419.0], ['BND-NHR', 'L-083', 436.0], ['BND-NHR', 'L-085', 384.0], ['BND-NHR', 'L-087', 394.0], ['NHR-MLND', 'L-089', 489.0], ['NHR-MLND', 'L-091', 411.0], ['NHR-MLND', 'L-093', 410.0], ['NHR-MLND', 'L-095', 472.0], ['NHR-MLND', 'MLND S-4', 400.0], ['MLND-TNA', 'MLND S-5', 469.0], ['MLND-TNA', 'L-097', 460.0], ['MLND-TNA', 'L-099', 370.0], ['MLND-TNA', 'TNA S-2', 407.0], ['MLND-TNA', 'TNA S-19', 634.0], ['MLND-TNA', 'TNA S-56', 444.0], ['TNA-KLVA', 'TNA S-69', 410.0], ['TNA-KLVA', 'TNA S-77', 408.0], ['TNA-KLVA', 'L-3403', 481.0], ['TNA-KLVA', 'KLVA S-2', 319.0], ['TNA-KLVA', 'L-3413', 379.0], ['TNA-KLVA', 'L-3505', 449.0], ['KLVA-MBQ', 'L-3511', 411.0], ['KLVA-MBQ', 'KLVA S-8', 461.0], ['KLVA-MBQ', 'KLVA S-12', 658.0], ['KLVA-MBQ', 'L-3705', 482.0], ['KLVA-MBQ', 'L-3717', 544.0], ['KLVA-MBQ', 'L-3805', 290.0], ['KLVA-MBQ', 'L-3809', 583.0], ['KLVA-MBQ', 'L-3905', 399.0], ['KLVA-MBQ', 'L-3911', 701.0], ['MBQ-DW', 'L-4001', 443.0], ['MBQ-DW', 'L-4011', 249.0], ['MBQ-DW', 'L-4017', 439.0], ['MBQ-DW', 'DW S-2', 393.0], ['MBQ-DW', 'DW S-5', 438.0], ['MBQ-DW', 'DW S-6', 394.0], ['DW-KOPR', 'L-4211', 476.0], ['DW-KOPR', 'DW S-17', 351.0], ['DW-KOPR', 'L-4307', 520.0], ['DW-KOPR', 'L-4401', 623.0], ['DW-KOPR', 'L-4411', 632.0], ['DW-KOPR', 'L-4507', 750.0], ['DW-KOPR', 'L-4601', 622.0], ['DW-KOPR', 'L-4609', 553.0], ['KOPR-DI', 'DI S-19', 446.0], ['KOPR-DI', 'DI S-27', 642.0], ['DI-THK', 'DI S-37', 583.0], ['DI-THK', 'L-4811', 404.0], ['DI-THK', 'L-4903', 657.0], ['THK-KYN', 'TCY S-2', 444.0], ['THK-KYN', 'TCY S-3', 462.0], ['THK-KYN', 'L-5011', 532.0], ['THK-KYN', 'KYN S-2', 381.0], ['THK-KYN', 'KYN S-11', 698.0], ['THK-KYN', 'KYN S-10', 401.0], ['THK-KYN', 'KYN S-32', 673.0], ['THK-KYN', 'KYN S-53', 519.0],['KYN-THK', 'KYN PF-3 S37', 0.0], ['KYN-THK', 'KYN S-17', 447.0], ['KYN-THK', 'KYN S-20', 432.0], ['KYN-THK', 'KYN S-7', 725.0], ['KYN-THK', 'L-5014', 550.0], ['KYN-THK', 'TCY S-21', 494.0], ['KYN-THK', 'L-4912', 674.0], ['THK-DI', 'L-4906', 425.0], ['THK-DI', 'L-4818', 425.0], ['THK-DI', 'L-4810', 549.0], ['DI-KOPR', 'DI S-36', 449.0], ['DI-KOPR', 'L-4710', 400.0], ['DI-KOPR', 'L-4702', 420.0], ['KOPR-DW', 'DI S-16', 473.0], ['KOPR-DW', 'L-4602', 596.0], ['KOPR-DW', 'L-4506', 732.0], ['KOPR-DW', 'L-4410', 669.0], ['KOPR-DW', 'L-4314', 660.0], ['KOPR-DW', 'L-4308', 524.0], ['KOPR-DW', 'DW S-66', 300.0], ['KOPR-DW', 'DW S-64', 541.0], ['DW-MBQ', 'DW S-53', 467.0], ['DW-MBQ', 'DW S-48', 387.0], ['DW-MBQ', 'DW S-45', 364.0], ['DW-MBQ', 'L-4020', 550.0], ['DW-MBQ', 'L-4014', 282.0], ['MBQ-KLVA', 'L-3912', 830.0], ['MBQ-KLVA', 'L-3906', 430.0], ['MBQ-KLVA', 'L-3816', 425.0], ['MBQ-KLVA', 'L-3808', 429.0], ['MBQ-KLVA', 'L-3718', 600.0], ['MBQ-KLVA', 'L-3708', 471.0], ['MBQ-KLVA', 'L-3702', 426.0], ['MBQ-KLVA', 'KLVA S-29', 480.0], ['MBQ-KLVA', 'L-3602', 454.0], ['MBQ-KLVA', 'L-3512', 405.0], ['KLVA-TNA', 'L-3506', 445.0], ['KLVA-TNA', 'KLVA S-25', 373.0], ['KLVA-TNA', 'L-3408', 406.0], ['KLVA-TNA', 'TNA S-88', 460.0], ['KLVA-TNA', 'TNA S-86', 465.0], ['KLVA-TNA', 'TNA S-72', 321.0], ['TNA-MLND', 'TNA S-59', 391.0], ['TNA-MLND', 'TNA S-32', 422.0], ['TNA-MLND', 'TNA S-9', 410.0], ['TNA-MLND', 'L-092', 504.0], ['TNA-MLND', 'MLND S-17', 419.0], ['TNA-MLND', 'MLND S-15', 460.0], ['MLND-NHR', 'L-090', 547.0], ['MLND-NHR', 'L-088', 499.0], ['MLND-NHR', 'L-086', 585.0], ['MLND-NHR', 'L-084', 667.0], ['NHR-BND', 'L-082', 584.0], ['NHR-BND', 'L-080', 417.0], ['NHR-BND', 'BND S-23', 404.0], ['BND-KJMG', 'L-078', 741.0], ['BND-KJMG', 'L-076', 343.0], ['BND-KJMG', 'L-074', 525.0], ['BND-KJMG', 'L-072', 436.0], ['KJMG-VK', 'L-070', 510.0], ['KJMG-VK', 'L-066', 688.0], ['KJMG-VK', 'VK S-23', 706.0], ['VK-GC', 'VK S-21', 433.0], ['VK-GC', 'L-064', 404.0], ['VK-GC', 'L-062', 596.0], ['VK-GC', 'L-060', 425.0], ['VK-GC', 'L-058', 448.0], ['VK-GC', 'L-056', 452.0], ['VK-GC', 'L-056 A', 535.0], ['VK-GC', 'VVH S-57', 408.0], ['GC-VVH', 'VVH S-54', 424.0], ['GC-VVH', 'VVH S-41', 477.0], ['GC-VVH', 'VVH S-33', 430.0], ['VVH-CLA', 'VVH S-14', 442.0], ['VVH-CLA', 'L-054', 461.0], ['VVH-CLA', 'L-052', 436.0], ['VVH-CLA', 'CLA S-26', 401.0], ['VVH-CLA', 'CLA S-34', 565.0], ['CLA-SION', 'CLA S-42', 619.0], ['CLA-SION', 'L-050', 400.0], ['CLA-SION', 'L-048', 390.0], ['CLA-SION', 'L-046', 714.0], ['CLA-SION', 'L-044', 598.0], ['SION-MTN', 'L-042', 477.0], ['SION-MTN', 'L-040', 400.0], ['SION-MTN', 'L-038', 786.0], ['SION-MTN', 'DR S-27', 400.0], ['SION-MTN', 'L-036', 650.0], ['MTN-DR', 'DR S-33', 456.0], ['MTN-DR', 'L-032', 367.0], ['MTN-DR', 'DR S-36', 441.0], ['MTN-DR', 'DR S-41', 475.0], ['DR-PR', 'PR S-28', 407.0], ['DR-PR', 'PR S-26', 378.0], ['PR-CRD', 'PR S-12', 400.0], ['PR-CRD', 'L-028', 496.0], ['PR-CRD', 'L-026', 476.0], ['PR-CRD', 'L-024', 426.0], ['CRD-CHG', 'L-022', 439.0], ['CRD-CHG', 'L-020', 340.0], ['CHG-BY', 'L-018', 420.0], ['CHG-BY', 'BY S-39', 275.0], ['BY-SNRD', 'BY S-16', 874.0], ['BY-SNRD', 'L-014', 277.0], ['BY-SNRD', 'L-012', 667.0], ['BY-SNRD', 'L-010', 401.0], ['SNRD-MSD', 'L-008', 436.0], ['SNRD-MSD', 'L-006', 340.0], ['SNRD-MSD', 'L-004', 475.0], ['MSD-CSMT', 'L-002', 340.0], ['MSD-CSMT', 'CSMT S-54', 352.0], ['MSD-CSMT', 'CSMT S-26', 480.0], ['MSD-CSMT', 'CSMT PF-4 EMU BOARD', 415.0],['CSMTH-MSDH', 'CSMT S-1', 0.0], ['CSMTH-MSDH', 'CSMT S-34', 416.0], ['CSMTH-MSDH', 'H-03', 479.0], ['MSDH-SNRDH', 'H-05', 380.0], ['MSDH-SNRDH', 'H-07', 427.0], ['SNRDH-DKRD', 'H-09', 678.0], ['SNRDH-DKRD', 'H-11', 311.0], ['SNRDH-DKRD', 'H-13', 413.0], ['DKRD-RRD', 'H-15', 394.0], ['DKRD-RRD', 'H-17', 408.0], ['DKRD-RRD', 'H-19', 514.0], ['RRD-CTGN', 'H-21', 555.0], ['RRD-CTGN', 'H-23', 420.0], ['CTGN-SEV', 'H-25', 539.0], ['CTGN-SEV', 'H-27', 387.0], ['CTGN-SEV', 'H-29', 413.0], ['CTGN-SEV', 'H-31', 426.0], ['SEV-VDLR', 'H-33', 594.0], ['SEV-VDLR', 'H-35', 531.0], ['SEV-VDLR', 'RVJ S-1', 423.0], ['SEV-VDLR', 'RVJ S-6', 584.0], ['VDLR-GTBN', 'RVJ S-9', 344.0], ['VDLR-GTBN', 'RVJ S-22', 555.0], ['VDLR-GTBN', 'H-41', 909.0], ['VDLR-GTBN', 'H-43', 755.0], ['GTBN-CHF', 'H-45', 650.0], ['GTBN-CHF', 'H-47', 498.0], ['GTBN-CHF', 'H-49', 433.0], ['CHF-CLA', 'CLA S-5', 286.0], ['CHF-CLA', 'CLA S-2', 1062.0], ['CHF-CLA', 'CLA S-12', 697.0], ['CLA-TKNR', 'H-51', 744.0], ['CLA-TKNR', 'H-53', 497.0], ['CMBR-GV', 'CMBR S-10', 692.0], ['CMBR-GV', 'CMBR S-9', 556.0], ['CMBR-GV', 'H-55', 513.0], ['CMBR-GV', 'H-57', 520.0], ['CMBR-GV', 'H-59', 612.0], ['GV-MNKD', 'H-61', 575.0], ['GV-MNKD', 'MNKD S-1', 504.0], ['GV-MNKD', 'MNKD S-2', 390.0], ['GV-MNKD', 'MNKD S-4', 523.0], ['MNKD-VSH', 'H-2201', 378.0], ['MNKD-VSH', 'H-2209', 400.0], ['MNKD-VSH', 'H-2215', 395.0], ['MNKD-VSH', 'H-2305', 420.0], ['MNKD-VSH', 'H-2311', 446.0], ['MNKD-VSH', 'H-2401', 382.0], ['MNKD-VSH', 'H-2411', 609.0], ['MNKD-VSH', 'H-2503', 527.0], ['MNKD-VSH', 'H-2513', 496.0], ['MNKD-VSH', 'H-2603', 482.0], ['MNKD-VSH', 'H-2613', 524.0], ['MNKD-VSH', 'H-2703', 423.0], ['MNKD-VSH', 'H-2707', 394.0], ['MNKD-VSH', 'H-2715', 406.0], ['MNKD-VSH', 'VSH S-2', 437.0], ['MNKD-VSH', 'VSH S-5', 718.0], ['VSH-SNPD', 'H-2921', 358.0], ['VSH-SNPD', 'H-2935', 398.0], ['VSH-SNPD', 'H-3001', 430.0], ['SNPD-JNJ', 'H-3013', 489.0], ['SNPD-JNJ', 'H-3109', 519.0], ['SNPD-JNJ', 'H-3141', 425.0], ['SNPD-JNJ', 'JNJ S-4', 433.0], ['JNJ-NEU', 'JNJ S-6', 481.0], ['JNJ-NEU', 'JNJ S-10', 502.0], ['JNJ-NEU', 'NEU S-4', 688.0], ['JNJ-NEU', 'NEU S-33', 817.0], ['NEU-SWDV', 'NEU S-41', 552.0], ['NEU-SWDV', 'H-3515', 401.0], ['NEU-SWDV', 'H-3601', 468.0], ['SWDV-BEPR', 'H-3617', 777.0], ['SWDV-BEPR', 'H-3703', 374.0], ['SWDV-BEPR', 'BEPR S-2', 412.0], ['SWDV-BEPR', 'H-3717', 412.0], ['SWDV-BEPR', 'BEPR S-8', 406.0], ['BEPR-KHAG', 'BEPR S-22', 346.0], ['BEPR-KHAG', 'H-3907', 473.0], ['BEPR-KHAG', 'H-3917', 501.0], ['BEPR-KHAG', 'H-4005', 600.0], ['BEPR-KHAG', 'H-4013', 423.0], ['KHAG-MNSV', 'H-4103', 409.0], ['KHAG-MNSV', 'H-4115', 399.0], ['KHAG-MNSV', 'H-4201', 444.0], ['KHAG-MNSV', 'H-4211', 586.0], ['KHAG-MNSV', 'H-4301', 558.0], ['KHAG-MNSV', 'H-4311', 513.0], ['MNSV-KNDS', 'H-4401', 379.0], ['MNSV-KNDS', 'H-4409', 400.0], ['MNSV-KNDS', 'H-4421', 563.0], ['MNSV-KNDS', 'H-4509', 560.0], ['KNDS-PNVL', 'H-4517', 400.0], ['KNDS-PNVL', 'H-4607', 393.0], ['KNDS-PNVL', 'H-4615', 435.0], ['KNDS-PNVL', 'H-4703', 373.0], ['KNDS-PNVL', 'PNVL S-402', 528.0], ['KNDS-PNVL', 'PNVL S-403', 512.0], ['KNDS-PNVL', 'PNVL PF-1 EMU BOARD', 634.0],['PNVL-KNDS', 'PNVL S-422', 0.0], ['PNVL-KNDS', 'PNVL S-425', 485.0], ['PNVL-KNDS', 'H-4714', 413.0], ['PNVL-KNDS', 'H-4704', 405.0], ['PNVL-KNDS', 'H-4614', 400.0], ['PNVL-KNDS', 'H-4608', 392.0], ['PNVL-KNDS', 'H-4600', 392.0], ['PNVL-KNDS', 'H-4512', 392.0], ['KNDS-MNSV', 'H-4506', 424.0], ['KNDS-MNSV', 'H-4418', 459.0], ['KNDS-MNSV', 'H-4406', 505.0], ['KNDS-MNSV', 'H-4314', 466.0], ['MNSV-KHAG', 'H-4306', 503.0], ['MNSV-KHAG', 'H-4216', 425.0], ['MNSV-KHAG', 'H-4210', 399.0], ['MNSV-KHAG', 'H-4202', 478.0], ['MNSV-KHAG', 'H-4116', 390.0], ['MNSV-KHAG', 'H-4106', 379.0], ['MNSV-KHAG', 'H-4014', 380.0], ['KHAG-BEPR', 'H-4006', 434.0], ['KHAG-BEPR', 'H-4000', 460.0], ['KHAG-BEPR', 'H-3912', 610.0], ['KHAG-BEPR', 'BEPR S-23', 367.0], ['KHAG-BEPR', 'BEPR S-12', 367.0], ['BEPR-SWDV', 'BEPR S-5', 523.0], ['BEPR-SWDV', 'BEPR S-3', 346.0], ['BEPR-SWDV', 'H-3706', 400.0], ['BEPR-SWDV', 'H-3620', 433.0], ['BEPR-SWDV', 'H-3602', 800.0], ['SWDV-NEU', 'H-3514', 471.0], ['SWDV-NEU', 'NEU S-42', 419.0], ['NEU-JNJ', 'NEU S-23', 942.0], ['NEU-JNJ', 'NEU S-5', 479.0], ['NEU-JNJ', 'H-3310', 415.0], ['NEU-JNJ', 'JNJ S-30', 372.0], ['NEU-JNJ', 'JNJ S-29', 429.0], ['NEU-JNJ', 'JNJ S-20', 389.0], ['JNJ-SNPD', 'JNJ S-21', 418.0], ['JNJ-SNPD', 'H-3110', 453.0], ['JNJ-SNPD', 'H-3018', 454.0], ['JNJ-SNPD', 'H-3004', 509.0], ['SNPD-VSH', 'H-2936', 452.0], ['SNPD-VSH', 'VSH S-30', 383.0], ['VSH-MNKD', 'VSH S-23', 787.0], ['VSH-MNKD', 'S-25', 390.0], ['VSH-MNKD', 'H-2804', 402.0], ['VSH-MNKD', 'H-2728', 400.0], ['VSH-MNKD', 'H-2710', 401.0], ['VSH-MNKD', 'H-2614', 465.0], ['VSH-MNKD', 'H-2604', 550.0], ['VSH-MNKD', 'H-2514', 483.0], ['VSH-MNKD', 'H-2504', 480.0], ['VSH-MNKD', 'H-2412', 534.0], ['VSH-MNKD', 'H-2404', 433.0], ['VSH-MNKD', 'H-2314', 391.0], ['VSH-MNKD', 'H-2306', 380.0], ['VSH-MNKD', 'H-2216', 355.0], ['VSH-MNKD', 'H-2212', 369.0], ['VSH-MNKD', 'MNKD S-20', 403.0], ['VSH-MNKD', 'MNKD S-19', 584.0], ['MNKD-GV', 'MNKD S-12', 418.0], ['MNKD-GV', 'MNKD S-6', 336.0], ['MNKD-GV', 'H-58', 814.0], ['GV-CMBR', 'H-56', 879.0], ['GV-CMBR', 'H-54', 620.0], ['GV-CMBR', 'CMBR S-2', 591.0], ['CMBR-TKNG', 'CMBR S-4', 417.0], ['CMBR-TKNG', 'H-52', 700.0], ['TKNG-CLA', 'CLA S-28', 571.0], ['TKNG-CLA', 'CLA S-29', 538.0], ['CLA-CHF', 'CLA S-44', 693.0], ['CLA-CHF', 'CLA S-48', 756.0], ['CLA-CHF', 'H-50', 669.0], ['CHF-GTBN', 'H-48', 531.0], ['CHF-GTBN', 'H-46', 879.0], ['GTBN-VDLR', 'H-44', 785.0], ['GTBN-VDLR', 'RVJ S-24', 936.0], ['GTBN-VDLR', 'RVJ S-19', 422.0], ['GTBN-VDLR', 'RVJ S-11', 748.0], ['VDLR-SEV', 'RVJ S-4', 547.0], ['VDLR-SEV', 'H-38', 398.0], ['VDLR-SEV', 'H-36', 485.0], ['VDLR-SEV', 'H-34', 578.0], ['SEV-CTGN', 'H-32', 606.0], ['SEV-CTGN', 'H-30', 395.0], ['SEV-CTGN', 'H-28', 569.0], ['SEV-CTGN', 'H-26', 382.0], ['CTGN-RRD', 'H-24', 418.0], ['CTGN-RRD', 'H-20', 553.0], ['RRD-DKRD', 'H-18', 489.0], ['RRD-DKRD', 'H-16', 415.0], ['RRD-DKRD', 'H-14', 426.0], ['DKRD-SNRDH', 'H-12', 444.0], ['DKRD-SNRDH', 'H-10', 338.0], ['SNRDH-MSDH', 'H-08', 337.0], ['SNRDH-MSDH', 'H-06', 397.0], ['SNRDH-MSDH', 'H-04', 373.0], ['MSDH-CSMTH', 'CSMT S-57', 340.0], ['MSDH-CSMTH', 'CSMT S-53', 298.0], ['MSDH-CSMTH', 'CSMT S-46', 273.0], ['MSDH-CSMTH', 'CSMT S-23', 209.0], ['MSDH-CSMTH', 'CSMT PF-2 EMU BOARD', 469.0],
['KJT-BVS', 'KJT S-63', 385.0], ['KJT-BVS', 'KJT S-78', 689.0], ['KJT-BVS', 'GATE-27', 526.0], ['KJT-BVS', 'SE-9706', 737.0], ['KJT-BVS', 'GATE-26', 682.0], ['KJT-BVS', 'SE-9602', 620.0], ['KJT-BVS', 'GATE-25', 575.0], ['KJT-BVS', 'SE-9410', 837.0], ['KJT-BVS', 'BVS S-20', 813.0], ['KJT-BVS', 'BVS S-19', 1230.0], ['BVS-NRL', 'BVS S-16', 800.0], ['BVS-NRL', 'SE-9012', 860.0], ['BVS-NRL', 'GATE-22', 800.0], ['BVS-NRL', 'SE-8906', 683.0], ['BVS-NRL', 'SE-8808', 905.0], ['BVS-NRL', 'SE-8710', 925.0], ['BVS-NRL', 'NRL S-3', 676.0], ['BVS-NRL', 'NRL S-6', 876.0], ['NRL-SHELU', 'NRL S-12', 896.0], ['NRL-SHELU', 'GATE-20', 757.0], ['NRL-SHELU', 'SE-8308', 825.0], ['NRL-SHELU', 'SE-8214', 641.0], ['NRL-SHELU', 'SE-8206', 525.0], ['NRL-SHELU', 'GATE-19', 716.0], ['SHELU-VGI', 'SE-8014', 702.0], ['SHELU-VGI', 'GATE-18', 696.0], ['SHELU-VGI', 'SE-7912', 600.0], ['SHELU-VGI', 'VGI S-25', 600.0], ['SHELU-VGI', 'VGI S-24', 1020.0], ['VGI-BUD', 'VGI S-21', 575.0], ['VGI-BUD', 'GATE-16', 970.0], ['VGI-BUD', 'SE-7514', 575.0], ['VGI-BUD', 'SE-7504', 565.0], ['VGI-BUD', 'SE-7406', 860.0], ['VGI-BUD', 'SE-7308', 900.0], ['VGI-BUD', 'SE-7220', 835.0], ['VGI-BUD', 'SE-7114', 880.0], ['VGI-BUD', 'SE-7014', 950.0], ['VGI-BUD', 'SE-6914', 950.0], ['VGI-BUD', 'BUD S-28', 900.0], ['VGI-BUD', 'BUD S-24', 1138.0], ['VGI-BUD', 'BUD S-17', 807.0], ['BUD-ABH', 'BUD S-16', 401.0], ['BUD-ABH', 'SE-6526', 1009.0], ['BUD-ABH', 'SE-6410', 966.0], ['BUD-ABH', 'GATE-7', 1160.0], ['BUD-ABH', 'SE-6214', 576.0], ['BUD-ABH', 'SE-6202', 802.0], ['BUD-ABH', 'ABH S-38', 900.0], ['BUD-ABH', 'ABH S-25', 1059.0], ['BUD-ABH', 'ABH S-22', 594.0], ['ABH-ULNR', 'GATE-4', 804.0], ['ABH-ULNR', 'SE-5714', 1092.0], ['ABH-ULNR', 'SE-5616', 767.0], ['ULNR-VLDI', 'SE-5602', 831.0], ['ULNR-VLDI', 'KYN S-84', 1147.0], ['VLDI-KYN', 'KYN S-81', 740.0], ['VLDI-KYN', 'KYN PF-5 STARTING', 990.0],['KYN-VLDI', 'KYN EMU BOARD', 0.0], ['KYN-VLDI', 'KYN PF-4 S-56', 52.0], ['KYN-VLDI', 'KYN S-82', 1189.0], 
['KYN-VLDI', 'SE-5511', 961.0], ['VLDI-ULNR', 'SE-5609', 1156.0], ['VLDI-ULNR', 'SE-5707', 758.0], ['ULNR-ABH', 'GATE', 1145.0], ['ULNR-ABH', 'ABH S-2', 544.0], ['ULNR-ABH', 'ABH S-6', 780.0], ['ABH-BUD', 'ABH S-15', 907.0], ['ABH-BUD', 'ABH S-18', 740.0], ['ABH-BUD', 'SE-6205', 726.0], ['ABH-BUD', 'GATE-7', 978.0], ['ABH-BUD', 'SE-6315', 690.0], ['ABH-BUD', 'SE-6411', 700.0], ['ABH-BUD', 'SE-6513', 675.0], ['ABH-BUD', 'SE-6515', 626.0], ['ABH-BUD', 'BUD S-2', 580.0], ['ABH-BUD', 'BUD S-9', 965.0], ['BUD-VGI', 'BUD S-12', 1149.0], ['BUD-VGI', 'BUD S-14', 358.0], ['BUD-VGI', 'SE-6913', 880.0], ['BUD-VGI', 'SE-7013', 950.0], ['BUD-VGI', 'SE-7113', 949.0], ['BUD-VGI', 'SE-7223', 1134.0], ['BUD-VGI', 'SE-7307', 490.0], ['BUD-VGI', 'SE-7403', 800.0], ['BUD-VGI', 'SE-7413', 705.0], ['BUD-VGI', 'SE-7507', 575.0], ['BUD-VGI', 'GATE-16', 565.0], ['BUD-VGI', 'SE-7613', 800.0], ['BUD-VGI', 'VGI S-2', 400.0], ['BUD-VGI', 'VGI S-7', 420.0], ['BUD-VGI', 'VGI S-3', 959.0], ['VGI-SHELU', 'VGI S-8', 375.0], ['VGI-SHELU', 'GATE-18', 820.0], ['VGI-SHELU', 'SE-8009', 706.0], ['VGI-SHELU', 'GATE-19', 697.0], ['VGI-SHELU', 'SE-8115', 620.0], ['VGI-SHELU', 'SE-8205', 541.0], ['SHELU-NRL', 'SE-8303', 695.0], ['SHELU-NRL', 'GATE-20', 825.0], ['SHELU-NRL', 'NRL S-27', 766.0], ['SHELU-NRL', 'NRL S-21', 1105.0], ['SHELU-NRL', 'NRL S-18', 574.0], ['NRL-BVS', 'NRL S-17', 800.0], ['NRL-BVS', 'SE-8801', 800.0], ['NRL-BVS', 'SE-8813', 800.0], ['NRL-BVS', 'GATE-22', 840.0], ['NRL-BVS', 'SE-9007', 800.0], ['NRL-BVS', 'SE-9105', 860.0], ['NRL-BVS', 'BVS S-2', 890.0], ['NRL-BVS', 'BVS S-3', 1153.0], ['BVS-KJT', 'BVS S-8', 890.0], ['BVS-KJT', 'GATE-25', 905.0], ['BVS-KJT', 'SE-9511', 590.0], ['BVS-KJT', 'GATE-26', 590.0], ['BVS-KJT', 'SE-9615', 724.0], ['BVS-KJT', 'GATE-27', 722.0], ['BVS-KJT', 'SE-9803', 513.0], ['BVS-KJT', 'KJT S-77', 515.0], ['BVS-KJT', 'KJT S-59', 991.0],
['KSRA-OMB', 'KSRA S-28', 0.0], ['KSRA-OMB', 'KSRA A STR', 780.0], ['KSRA-OMB', 'IBS DIST', 1285.0], ['KSRA-OMB', 'IBS', 1000.0], ['KSRA-OMB', 'OMB DIST', 2090.0], ['KSRA-OMB', 'OMB HOME', 1600.0], ['OMB-KE', 'IB DIST', 2730.0], ['OMB-KE', 'IBS', 1000.0], ['OMB-KE', 'KE DIST', 1700.0], ['OMB-KE', 'KE HOME', 1000.0], ['OMB-KE', 'KE STR', 1162.0], ['KE-THS', 'KE ASTR', 480.0], ['KE-THS', 'IBS DIST', 960.0], ['KE-THS', 'IBS ', 1000.0], ['KE-THS', 'THS DIST', 2202.0], ['KE-THS', 'THS HOME ', 1337.0], ['THS-ATG', 'IBS DIST', 1358.0], ['THS-ATG', 'IBS HOME', 1000.0], ['THS-ATG', 'ATG DIST', 1236.0], ['THS-ATG', 'ATG HOME', 1234.0], ['THS-ATG', 'ATG STR', 1074.0], ['ATG-ASO', 'ATG A STR', 300.0], ['ATG-ASO', 'GATE-69', 1114.0], ['ATG-ASO', 'IBS DIST', 2450.0], ['ATG-ASO', 'IBS', 1100.0], ['ATG-ASO', 'GATE DIST', 1100.0], ['ATG-ASO', 'GATE ', 1020.0], ['ATG-ASO', 'ASO DIST', 510.0], ['ATG-ASO', 'ASO HOME', 1020.0], ['ATG-ASO', 'ASO STR', 1167.0], ['ASO-VSD', 'ASO ADV.STR', 250.0], ['ASO-VSD', 'IBS DIST', 1032.0], ['ASO-VSD', 'IBS ', 1000.0], ['ASO-VSD', 'GATE', 1586.0], ['ASO-VSD', 'VSD HOME', 1015.0], ['ASO-VSD', 'VSD STR', 1098.0], ['VSD-KDV', 'VSD ASTR', 490.0], ['VSD-KDV', 'IBS DIST', 1850.0], ['VSD-KDV', 'IBS HOME', 1050.0], ['VSD-KDV', 'KDV DIST', 1910.0], ['VSD-KDV', 'KDV HOME', 1001.0], ['VSD-KDV', 'KDV STR', 1207.0], ['KDV-TLA', 'KDV ASTR', 290.0], ['KDV-TLA', 'GATE 55', 1250.0], ['KDV-TLA', 'GATE 54', 700.0], ['KDV-TLA', 'IBS HOME', 770.0], ['KDV-TLA', 'GATE 52', 1180.0], ['KDV-TLA', 'TLA DIST', 860.0], ['KDV-TLA', 'TLA S-25', 1030.0], ['KDV-TLA', 'TLA S-21', 765.0], ['TLA-ABY', 'TLA S-19', 952.0], ['TLA-ABY', 'NE-6212', 338.0], ['TLA-ABY', 'NE-6114', 793.0], ['TLA-ABY', 'NE-6102', 793.0], ['TLA-ABY', 'NE-6008', 749.0], ['TLA-ABY', 'Gate 48', 633.0], ['TLA-ABY', 'NE-5918', 533.0], ['ABY-SHD', 'NE-5863', 540.0], ['ABY-SHD', 'NE-5816', 520.0], ['ABY-SHD', 'NE-5702', 1158.0], ['SHD-KYN', 'NE-5604', 890.0], ['SHD-KYN', 'NE-5510', 563.0], ['SHD-KYN', 'KYN S-78', 563.0], ['SHD-KYN', 'KYN S-81', 1060.0], ['SHD-KYN', 'KYN PF-3 STARTING', 550.0], ['SHD-KYN', 'KYN EMU BOARD', 260.0],
['KYN-SHD', 'KYN PF3 EMU BOARD', 0.0], ['KYN-SHD', 'KYN PF3 S-53', 2.0], ['KYN-SHD', 'KYN S-72', 830.0], ['KYN-SHD', 'NE-5501', 799.0], ['KYN-SHD', 'NE-5515', 799.0], ['KYN-SHD', 'NE-5611', 617.0], ['SHD-ABY', 'NE-5703', 736.0], ['SHD-ABY', 'NE-5783', 637.0], ['SHD-ABY', 'NE-5829', 469.0], ['SHD-ABY', 'NE-5891', 630.0], ['SHD-ABY', 'GATE 48 S-1', 570.0], ['ABY-TLA', 'NE-6003', 761.0], ['ABY-TLA', 'NE-6101', 776.0], ['ABY-TLA', 'NE-6111', 729.0], ['ABY-TLA', 'TLA S-2', 719.0], ['ABY-TLA', 'TLA S-3', 1332.0], ['ABY-TLA', 'TLA S-5', 430.0], ['TLA-KDV', 'TLA S-8', 360.0], ['TLA-KDV', 'Gate dist', 580.0], ['TLA-KDV', 'GATE 52 S-1', 1000.0], ['TLA-KDV', 'IB DIST', 680.0], ['TLA-KDV', 'IBS', 1150.0], ['TLA-KDV', 'GATE 55 S-1', 1542.0], ['TLA-KDV', 'KDV HOME S-3', 1315.0], ['TLA-KDV', 'KDV STR S-12', 1350.0], ['KDV-VSD', 'KDV A/STR S-13', 321.0], ['KDV-VSD', 'IB DIST', 2000.0], ['KDV-VSD', 'IBS', 1000.0], ['KDV-VSD', 'VSD DIST', 1630.0], ['KDV-VSD', 'VSD HOME S-2', 1360.0], ['KDV-VSD', 'VSD STR S-3', 1210.0], ['VSD-ASO', 'VSD A/STR S-11', 400.0], ['VSD-ASO', 'GATE 64 S-1', 452.0], ['VSD-ASO', 'IBS S-12', 1500.0], ['VSD-ASO', 'ASO DIST', 1450.0], ['VSD-ASO', 'ASO HOME S-2', 1030.0], ['VSD-ASO', 'ASO STR S-7', 1280.0], ['ASO-ATG', 'ASO A/STR S-12', 300.0], ['ASO-ATG', 'Gate 67 S-1', 1119.0], ['ASO-ATG', 'IB DIST', 1830.0], ['ASO-ATG', 'IBS S-14', 1000.0], ['ASO-ATG', 'GATE DIST', 1580.0], ['ASO-ATG', 'GATE-69 S-4', 1000.0], ['ASO-ATG', 'ATG HOME S-3', 1499.0], ['ASO-ATG', 'ATG STR S-12', 1118.0], ['ATG-THS', 'ATG A/STR S-13', 380.0], ['ATG-THS', 'IB DIST', 1610.0], ['ATG-THS', 'IBS S-14', 1000.0], ['ATG-THS', 'THS DIST', 1620.0], ['ATG-THS', 'THS HOME S-2', 1061.0], ['THS-KE', 'IB DIST', 1759.0], ['THS-KE', 'IBS S-5', 1000.0], ['THS-KE', 'KE DIST', 1323.0], ['THS-KE', 'KE HOME S-3', 1086.0], ['THS-KE', 'KE STR S-12', 1219.0], ['KE-OMB', 'KE A/STR S-13', 432.0], ['KE-OMB', 'IB DIST', 1150.0], ['KE-OMB', 'IBS', 1040.0], ['KE-OMB', 'OMB DIST', 2220.0], ['KE-OMB', 'OMB HOME S-2', 1070.0], ['OMB-KSRA', 'IB DIST', 2370.0], ['OMB-KSRA', 'IBS HOME S-5', 1290.0], ['OMB-KSRA', 'KSRA DIST', 1200.0], ['OMB-KSRA', 'KSRA HOME S-2', 992.0], ['OMB-KSRA', 'KSRA S-54', 1420.0]]

const edgeCaseOfTNA = [['TNA-MLND', 'TNA S-44',0],['TNA-MLND', 'TNA S-8', 582.0],['TNA-MLND', 'L-092', 504.0],['TNA-MLND', 'MLND S-17', 419.0], ['TNA-MLND', 'MLND S-15', 460.0]]

const edgeCaseOfKYN = [['KYN-THK', 'KYN PF1 S-35', 0.0], ['KYN-THK', 'KYN S-14', 263.0],['KYN-THK', 'KYN S-20', 385.0], ['KYN-THK', 'KYN S-7', 725.0], ['KYN-THK', 'L-5014', 550.0], ['KYN-THK', 'TCY S-21', 494.0], ['KYN-THK', 'L-4912', 674.0]]

const edgeCaseOfVDLR = [['VDLR-GTBN', 'RVJ S-7', 0.0], ['VDLR-GTBN', 'RVJ S-15', 517.0],['VDLR-GTBN', 'RVJ S-22', 465.0], ['VDLR-GTBN', 'H-41', 909.0], ['VDLR-GTBN', 'H-43', 755.0]]






