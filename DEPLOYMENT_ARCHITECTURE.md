# SPM Analysis App - Deployment Architecture Analysis

## Executive Summary

**Recommendation**: **Option B - Hybrid Architecture** (Local DuckDB for reference data + Direct MySQL for reports)

This provides the best balance of:
- ✓ Minimal storage consumption
- ✓ Low complexity
- ✓ Fast local analysis
- ✓ Real-time reporting to website
- ✓ No sync conflicts

---

## Current Situation

### Data Volume Analysis
```
Raw SPM Data:
- File size: 3,000-12,000 rows × ~50 bytes/row = 150KB-600KB per file
- Daily volume: 50 files/day × 400KB avg = 20MB/day
- Monthly volume: 20MB × 30 = 600MB/month
- Yearly volume: 600MB × 12 = 7.2GB/year
```

**Problem**: Storing raw data would consume 7-10GB/year, eating into the 50GB MySQL limit.

**Solution**: Store only analysis results (reports), not raw data.

---

## Option A: Full Local (SQLite/DuckDB) + Periodic Sync

### Architecture
```
┌─────────────────────────────────────┐
│  SPM Analysis App (Local)           │
│  ┌──────────────────────────────┐  │
│  │ FastAPI Backend              │  │
│  │ - Processes CSV uploads      │  │
│  │ - Analyzes data              │  │
│  │ - Generates reports          │  │
│  └──────────────────────────────┘  │
│              ↓                      │
│  ┌──────────────────────────────┐  │
│  │ DuckDB/SQLite Local DB       │  │
│  │ - Corridor maps              │  │
│  │ - Train codes                │  │
│  │ - Staff data (synced)        │  │
│  │ - Analysis reports (temp)    │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
              ↓ Periodic Sync (every hour/day)
┌─────────────────────────────────────┐
│  Website (Remote)                   │
│  ┌──────────────────────────────┐  │
│  │ MySQL Database               │  │
│  │ - Staff master data          │  │
│  │ - Analysis reports (final)   │  │
│  │ - Abnormalities/violations   │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Data Tables (Local DuckDB)

```sql
-- Reference Data (Static, ~10MB total)
CREATE TABLE corridor_stations (
    corridor_id TEXT,
    station_code TEXT,
    distance_km DECIMAL(10,3),
    station_index INT
);

CREATE TABLE train_corridor_map (
    train_number TEXT PRIMARY KEY,
    train_code INT,
    type INT,
    route TEXT,
    direction TEXT,
    from_expected TEXT,
    to_expected TEXT
);

-- Synced from MySQL (Updated daily)
CREATE TABLE staff (
    staff_id TEXT PRIMARY KEY,
    staff_name TEXT,
    designation TEXT,
    depot TEXT,
    synced_at TIMESTAMP
);

-- Temporary local storage (Cleared after sync)
CREATE TABLE analysis_reports (
    run_id TEXT PRIMARY KEY,
    staff_id TEXT,
    train_number TEXT,
    from_station TEXT,
    to_station TEXT,
    run_date DATE,
    max_speed DECIMAL(5,2),
    avg_speed DECIMAL(5,2),
    total_distance DECIMAL(10,2),
    violations_count INT,
    created_at TIMESTAMP,
    synced_to_mysql BOOLEAN DEFAULT FALSE
);

CREATE TABLE speed_violations (
    violation_id TEXT PRIMARY KEY,
    run_id TEXT,
    location_km DECIMAL(10,3),
    station_section TEXT,
    speed_recorded DECIMAL(5,2),
    speed_limit DECIMAL(5,2),
    severity TEXT  -- 'minor', 'moderate', 'severe'
);
```

### Pros
✓ **Complete offline capability** - Works without internet
✓ **Fast local queries** - DuckDB is extremely fast for analytics
✓ **No network latency** - All analysis happens locally
✓ **Simple backup** - Single DuckDB file (~50MB)
✓ **Low MySQL load** - Only sync operations hit the server

### Cons
✗ **Sync complexity** - Need to handle sync failures, conflicts
✗ **Data staleness** - Staff data could be outdated between syncs
✗ **Delayed reporting** - Website doesn't get reports immediately
✗ **Sync conflicts** - If multiple users, need conflict resolution
✗ **Network reliability** - Failed syncs need retry logic

### Complexity: **Medium-High**
- Need to build sync service (bi-directional for staff data)
- Handle sync failures and retries
- Manage sync state tracking
- Implement conflict resolution

---

## Option B: Hybrid Architecture (Local DuckDB + Direct MySQL)

### Architecture
```
┌─────────────────────────────────────┐
│  SPM Analysis App (Local)           │
│  ┌──────────────────────────────┐  │
│  │ FastAPI Backend              │  │
│  │ - Processes CSV uploads      │  │
│  │ - Analyzes data              │  │
│  │ - Writes reports to MySQL    │  │
│  └──────────────────────────────┘  │
│         ↓ Read          ↓ Write     │
│  ┌──────────┐    ┌──────────────┐  │
│  │ DuckDB   │    │ MySQL Client │  │
│  │ (Local)  │    │ (Direct)     │  │
│  └──────────┘    └──────────────┘  │
│  - Corridors           ↓            │
│  - Train codes         ↓            │
│  - Station data  ┌──────────────┐  │
│                  │ MySQL (Web)  │  │
│                  │ - Staff data │  │
│                  │ - Reports    │  │
│                  └──────────────┘  │
└─────────────────────────────────────┘
```

### Data Split

**Local DuckDB (Read-Only Reference Data)**:
- Corridor mapping (UPLOCALS.csv, DNLOCALS.csv, etc.)
- Train-to-corridor lookup (train_corridor_map.csv)
- Station distance tables
- PSR (speed restriction) data
- Fast halts data

**Remote MySQL (Live Transactional Data)**:
- Staff master data (read from MySQL)
- Analysis reports (write to MySQL)
- Speed violations (write to MySQL)
- Brake feel test results (write to MySQL)

### MySQL Tables (Website Database)

```sql
-- Already exists in your DB
CREATE TABLE staff (
    staff_id VARCHAR(20) PRIMARY KEY,
    staff_name VARCHAR(100),
    designation VARCHAR(50),
    depot VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New tables for SPM analysis
CREATE TABLE spm_analysis_runs (
    run_id VARCHAR(50) PRIMARY KEY,
    staff_id VARCHAR(20),
    train_number VARCHAR(20),
    train_code INT,
    from_station VARCHAR(10),
    to_station VARCHAR(10),
    run_date DATE,
    run_time TIME,
    max_speed DECIMAL(5,2),
    avg_speed DECIMAL(5,2),
    total_distance DECIMAL(10,2),
    duration_minutes INT,
    violations_count INT,
    bft_detected BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id),
    INDEX idx_staff_date (staff_id, run_date),
    INDEX idx_train (train_number),
    INDEX idx_date (run_date)
);

CREATE TABLE spm_speed_violations (
    violation_id INT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(50),
    location_km DECIMAL(10,3),
    station_section VARCHAR(50),
    speed_recorded DECIMAL(5,2),
    speed_limit DECIMAL(5,2),
    overspeed_amount DECIMAL(5,2),
    severity ENUM('minor', 'moderate', 'severe', 'critical'),
    timestamp TIME,
    FOREIGN KEY (run_id) REFERENCES spm_analysis_runs(run_id) ON DELETE CASCADE,
    INDEX idx_run (run_id),
    INDEX idx_severity (severity)
);

CREATE TABLE spm_brake_tests (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(50),
    detected_at_km DECIMAL(10,3),
    station_name VARCHAR(50),
    test_type ENUM('brake_feel', 'emergency_brake'),
    speed_before DECIMAL(5,2),
    speed_after DECIMAL(5,2),
    duration_seconds INT,
    FOREIGN KEY (run_id) REFERENCES spm_analysis_runs(run_id) ON DELETE CASCADE,
    INDEX idx_run (run_id)
);
```

### Data Flow

```python
# In your FastAPI backend (main.py)

from sqlalchemy import create_engine
import duckdb

# Local DuckDB for reference data (read-only)
duckdb_conn = duckdb.connect('spm_reference.duckdb', read_only=True)

# Remote MySQL for transactional data (read-write)
mysql_engine = create_engine(
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASS}@{MYSQL_HOST}/{MYSQL_DB}"
)

@app.post("/upload")
async def upload_spm_file(...):
    # 1. Process CSV file (in-memory, not stored)
    df = process_csv(file)

    # 2. Get corridor from local DuckDB
    corridor_info = duckdb_conn.execute(
        "SELECT * FROM train_corridor_map WHERE train_number = ?",
        [train_number]
    ).fetchone()

    # 3. Analyze speed violations using local corridor data
    violations = analyze_violations(df, corridor_info)

    # 4. Write results DIRECTLY to MySQL (no local storage)
    with mysql_engine.connect() as conn:
        # Insert analysis run
        conn.execute(
            "INSERT INTO spm_analysis_runs (...) VALUES (...)",
            run_data
        )

        # Insert violations (if any)
        if violations:
            conn.execute(
                "INSERT INTO spm_speed_violations (...) VALUES (...)",
                violations
            )

    # 5. Raw CSV is discarded (not stored anywhere)
    return {"success": True, "run_id": run_id}
```

### Pros
✓ **No sync complexity** - Direct writes to MySQL
✓ **Real-time reporting** - Website gets data immediately
✓ **Fresh staff data** - Always latest from MySQL
✓ **Minimal local storage** - Only 50MB for reference data
✓ **No sync conflicts** - Single source of truth (MySQL)
✓ **Simple backup** - DuckDB is version-controlled, MySQL has existing backup
✓ **Fast analysis** - DuckDB for heavy analytics, MySQL for simple queries

### Cons
✗ **Requires internet** - Need connection to write reports
✗ **MySQL load** - More frequent writes (but small data volume)
✗ **Network dependency** - Analysis fails if MySQL is unreachable

### Complexity: **Low**
- No sync service needed
- Direct MySQL connection (standard SQLAlchemy)
- Simple error handling (retry failed writes)

---

## Option C: Full Remote (All MySQL, Local Processing Only)

### Architecture
```
┌─────────────────────────────────────┐
│  SPM Analysis App (Local)           │
│  ┌──────────────────────────────┐  │
│  │ FastAPI Backend              │  │
│  │ - Processes CSV uploads      │  │
│  │ - Analyzes data (in-memory)  │  │
│  │ - No local DB                │  │
│  └──────────────────────────────┘  │
│              ↓ All operations       │
└──────────────┼──────────────────────┘
               ↓
┌──────────────────────────────────────┐
│  MySQL Database (Remote)             │
│  - Corridor maps                     │
│  - Train codes                       │
│  - Staff data                        │
│  - Analysis reports                  │
│  - Everything in MySQL               │
└──────────────────────────────────────┘
```

### Pros
✓ **Simple architecture** - Single database
✓ **No sync needed** - Everything is already in MySQL
✓ **Centralized data** - Easy to manage from website
✓ **No local storage** - Nothing stored locally

### Cons
✗ **Slow corridor lookups** - Network latency for reference data
✗ **High MySQL load** - Every analysis queries corridor tables
✗ **Poor analytics performance** - MySQL not optimized for analytical queries
✗ **Network dependency** - Completely unusable offline
✗ **Storage bloat** - Need to store corridor CSVs in MySQL (wasteful)

### Complexity: **Low**
- Simple, but poor performance

**Not Recommended** - Performance issues for analytical workload

---

## Option D: Local DuckDB + Cloud Storage (Future-Proof)

### Architecture
```
┌─────────────────────────────────────┐
│  SPM Analysis App (Local)           │
│  ┌──────────────────────────────┐  │
│  │ DuckDB                       │  │
│  │ - All reference data         │  │
│  │ - Temporary report storage   │  │
│  └──────────────────────────────┘  │
│              ↓                      │
│  ┌──────────────────────────────┐  │
│  │ Export Service               │  │
│  │ - Batch export to Parquet    │  │
│  │ - Upload to S3/GCS           │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
               ↓ Periodic upload
┌──────────────────────────────────────┐
│  Cloud Storage (S3/GCS)              │
│  - Analysis reports (Parquet)        │
│  - Long-term archive                 │
└──────────────────────────────────────┘
               ↓ Query from website
┌──────────────────────────────────────┐
│  Website + DuckDB WASM               │
│  - Query Parquet files directly      │
│  - No MySQL storage needed           │
└──────────────────────────────────────┘
```

### Pros
✓ **Minimal storage costs** - S3 is ~$0.023/GB/month (vs MySQL)
✓ **Scalable** - Can store years of data
✓ **Fast queries** - DuckDB can query Parquet on S3 directly
✓ **Future-proof** - Modern data lakehouse pattern

### Cons
✗ **Higher complexity** - Need cloud storage setup
✗ **Additional costs** - S3 storage + bandwidth
✗ **Overkill for now** - Not needed at current scale

### Complexity: **High**
- Requires cloud infrastructure setup
- More moving parts

**Not Recommended Now** - Consider for future (2-3 years)

---

## Detailed Comparison Matrix

| Criteria | Option A (Local + Sync) | Option B (Hybrid) | Option C (All MySQL) | Option D (Cloud) |
|----------|------------------------|-------------------|---------------------|------------------|
| **Complexity** | Medium-High | **Low** | Low | High |
| **Performance** | Excellent | **Excellent** | Poor | Excellent |
| **Offline Capability** | Yes | No | No | No |
| **Real-time Reporting** | No (delayed) | **Yes** | Yes | Partial |
| **Storage Cost** | Low | **Low** | Medium | Medium |
| **Network Dependency** | Low | Medium | **High** | Medium |
| **Maintenance** | Medium | **Low** | Low | High |
| **Sync Complexity** | High | **None** | None | Medium |
| **MySQL Load** | Low | **Low** | High | None |
| **Data Freshness** | Delayed | **Real-time** | Real-time | Delayed |
| **Scalability** | Medium | **Medium** | Low | High |

---

## Recommended Architecture: Option B (Hybrid)

### Why Option B?

1. **Simplicity**: No sync service, no conflict resolution, straightforward implementation
2. **Performance**: DuckDB handles heavy analytics locally, MySQL only for small writes
3. **Real-time**: Reports appear on website immediately
4. **Storage**: Minimal - reference data (~50MB) locally, only reports in MySQL
5. **Reliability**: If network fails, queue writes and retry (simple)

### Storage Calculation (Option B)

**Local DuckDB** (~50MB total):
```
- Corridor stations: 8 corridors × 50 stations × 100 bytes = 40KB
- Train corridor map: 1,824 trains × 200 bytes = 365KB
- Station distance tables: 8 files × 500KB = 4MB
- PSR data: ~5MB
- Fast halts: ~1MB
Total: ~10-50MB (one-time, version controlled)
```

**MySQL Database** (grows slowly):
```
Per analysis run:
- spm_analysis_runs: 1 row × 200 bytes = 200 bytes
- spm_speed_violations: ~5 violations × 100 bytes = 500 bytes
- Total per run: ~700 bytes

Daily: 50 runs × 700 bytes = 35KB/day
Monthly: 35KB × 30 = 1.05MB/month
Yearly: 1.05MB × 12 = 12.6MB/year

Even after 3 years: 40MB total (negligible for 50GB storage)
```

### Implementation Roadmap

#### Phase 1: Setup DuckDB Reference Database (Week 1)
```python
# create_duckdb_reference.py
import duckdb
import pandas as pd

conn = duckdb.connect('spm_reference.duckdb')

# Load corridor data
for corridor in ['UPLOCALS', 'DNLOCALS', 'UPTHB', 'DNTHB', 'UPHARBOUR', 'DNHARBOUR']:
    df = pd.read_csv(f'{corridor}.csv')
    conn.execute(f"CREATE TABLE {corridor} AS SELECT * FROM df")

# Load train corridor map
df = pd.read_csv('train_corridor_map.csv')
conn.execute("CREATE TABLE train_corridor_map AS SELECT * FROM df")

# Create indexes for fast lookup
conn.execute("CREATE INDEX idx_train ON train_corridor_map(train_number)")

conn.close()
```

#### Phase 2: Setup MySQL Tables (Week 1)
```sql
-- Run these on your MySQL database
-- (Tables shown in section above)
```

#### Phase 3: Update FastAPI Backend (Week 2)
```python
# main.py modifications
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import duckdb
import os

# Initialize connections
DUCKDB_PATH = Path(__file__).parent / "spm_reference.duckdb"
duckdb_conn = duckdb.connect(str(DUCKDB_PATH), read_only=True)

MYSQL_URL = os.getenv("MYSQL_URL")  # Load from env
mysql_engine = create_engine(MYSQL_URL)
SessionLocal = sessionmaker(bind=mysql_engine)

@app.post("/upload")
async def upload_spm_file(...):
    # Process CSV in-memory
    df = process_csv_data(file_content)

    # Get corridor info from DuckDB
    corridor = get_corridor_from_duckdb(train_number)

    # Analyze
    violations = detect_violations(df, corridor)

    # Write to MySQL
    db = SessionLocal()
    try:
        # Insert run
        run = SPMAnalysisRun(...)
        db.add(run)

        # Insert violations
        for v in violations:
            db.add(SPMViolation(...))

        db.commit()
    finally:
        db.close()

    return {"success": True}
```

#### Phase 4: Add Offline Queue (Week 3 - Optional)
```python
# For handling network failures
import queue
import json

offline_queue = queue.Queue()

def write_to_mysql_with_retry(data):
    try:
        write_to_mysql(data)
    except Exception as e:
        # Queue for later
        offline_queue.put(data)
        save_queue_to_disk()  # Persist across restarts

# Background task to retry queued writes
async def retry_queued_writes():
    while True:
        if not offline_queue.empty():
            try:
                data = offline_queue.get()
                write_to_mysql(data)
            except:
                offline_queue.put(data)  # Re-queue
        await asyncio.sleep(60)  # Check every minute
```

---

## Configuration Setup

### Environment Variables (.env)
```bash
# MySQL Connection
MYSQL_HOST=your-website-db-host.com
MYSQL_PORT=3306
MYSQL_USER=spm_app_user
MYSQL_PASSWORD=secure_password
MYSQL_DATABASE=railway_website_db

# DuckDB Path
DUCKDB_PATH=./spm_reference.duckdb

# App Settings
MAX_UPLOAD_SIZE_MB=10
ENABLE_OFFLINE_QUEUE=true
```

### MySQL User Permissions
```sql
-- Create dedicated user for SPM app
CREATE USER 'spm_app_user'@'%' IDENTIFIED BY 'secure_password';

-- Grant permissions (only what's needed)
GRANT SELECT ON railway_website_db.staff TO 'spm_app_user'@'%';
GRANT INSERT, SELECT ON railway_website_db.spm_analysis_runs TO 'spm_app_user'@'%';
GRANT INSERT, SELECT ON railway_website_db.spm_speed_violations TO 'spm_app_user'@'%';
GRANT INSERT, SELECT ON railway_website_db.spm_brake_tests TO 'spm_app_user'@'%';

FLUSH PRIVILEGES;
```

---

## Migration Path from Current System

### Step 1: Prepare DuckDB
```bash
# Load existing corridor CSVs into DuckDB
python create_duckdb_reference.py
```

### Step 2: Create MySQL Tables
```bash
# Run SQL scripts on website database
mysql -h your-host -u root -p railway_website_db < mysql_schema.sql
```

### Step 3: Update FastAPI
```bash
# Install MySQL driver
pip install sqlalchemy pymysql

# Update main.py with MySQL connection
# (Code shown above)
```

### Step 4: Test
```bash
# Test with sample file
curl -X POST http://localhost:8001/upload \
  -F "file=@sample.csv" \
  -F "staff_id=STF1234" \
  -F "train_number=K40"

# Verify in MySQL
mysql> SELECT * FROM spm_analysis_runs ORDER BY created_at DESC LIMIT 5;
```

---

## Monitoring & Maintenance

### DuckDB Reference Data Updates
```python
# update_reference_data.py
# Run this when corridor data changes (rare)

import duckdb
import pandas as pd
from datetime import datetime

# Backup old version
import shutil
shutil.copy('spm_reference.duckdb', f'backups/spm_reference_{datetime.now():%Y%m%d}.duckdb')

# Update with new data
conn = duckdb.connect('spm_reference.duckdb')
df = pd.read_csv('train_corridor_map_updated.csv')
conn.execute("DROP TABLE IF EXISTS train_corridor_map")
conn.execute("CREATE TABLE train_corridor_map AS SELECT * FROM df")
conn.close()
```

### MySQL Storage Monitoring
```sql
-- Check table sizes
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
    table_rows
FROM information_schema.TABLES
WHERE table_schema = 'railway_website_db'
AND table_name LIKE 'spm_%';

-- Purge old data (if needed, after 2+ years)
DELETE FROM spm_analysis_runs WHERE run_date < DATE_SUB(NOW(), INTERVAL 2 YEAR);
```

---

## Cost Analysis

### Option A (Local + Sync)
- Development: 40 hours
- Infrastructure: $0/month
- Maintenance: 4 hours/month (sync monitoring)

### Option B (Hybrid) ✓ RECOMMENDED
- Development: **20 hours**
- Infrastructure: **$0/month** (uses existing MySQL)
- Maintenance: **1 hour/month**

### Option C (All MySQL)
- Development: 15 hours
- Infrastructure: $0/month
- Maintenance: 1 hour/month
- **Performance**: Poor (not viable)

### Option D (Cloud)
- Development: 60 hours
- Infrastructure: ~$5-10/month (S3 + bandwidth)
- Maintenance: 2 hours/month

---

## Decision Matrix

| Your Requirement | Option A | Option B ✓ | Option C | Option D |
|------------------|----------|-----------|----------|----------|
| Minimal MySQL storage | ✓ | **✓** | ✗ | ✓ |
| Real-time website reporting | ✗ | **✓** | ✓ | ✗ |
| Fast analysis performance | ✓ | **✓** | ✗ | ✓ |
| Low complexity | ✗ | **✓** | ✓ | ✗ |
| Staff data sync | Manual | **Auto** | Auto | Manual |
| Works offline | ✓ | ✗ | ✗ | ✗ |
| Development time | 40h | **20h** | 15h | 60h |

---

## Final Recommendation

**Go with Option B - Hybrid Architecture**

### Implementation Plan:
1. **Week 1**: Create DuckDB reference database + MySQL tables
2. **Week 2**: Update FastAPI to use dual databases
3. **Week 3**: Add error handling and optional offline queue
4. **Week 4**: Testing and deployment

### Why This Works Best for You:
✓ Solves your storage problem (only 12MB/year in MySQL)
✓ Simple to implement (no sync complexity)
✓ Real-time reporting to your website
✓ Fast local analysis with DuckDB
✓ Uses your existing MySQL infrastructure
✓ Staff data always fresh from MySQL
✓ No raw data storage (files processed in-memory)

### Next Steps:
1. Confirm MySQL connection details (host, credentials)
2. Create MySQL tables using provided schema
3. Build DuckDB reference database from corridor CSVs
4. Update FastAPI backend with dual-database support
5. Test end-to-end flow

**Ready to proceed with Option B implementation?**
