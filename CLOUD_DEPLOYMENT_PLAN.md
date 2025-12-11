# SPM Analysis App - Cloud Deployment Plan (Option A)

## 🎯 Project Goal

Deploy a professional, cloud-based SPM analysis system on Hostinger VPS that:
- ✅ Works for 2-3 users from any computer
- ✅ Stores files centrally on server
- ✅ Integrates with existing Node.js website
- ✅ Connects to MySQL database (bbtro)
- ✅ Provides downloadable analysis reports
- ✅ Serves as template for migrating rail-data-app

---

## 📅 Timeline: 3-4 Weeks

### **Week 1**: Server Setup & Database
- Days 1-2: VPS environment setup
- Days 3-4: MySQL tables & reference data
- Day 5: Testing & verification

### **Week 2**: FastAPI Backend Development
- Days 1-2: File upload & storage
- Days 3-4: Analysis logic & DuckDB integration
- Day 5: API endpoints & testing

### **Week 3**: Frontend Integration
- Days 1-2: Integrate spm.html with website
- Days 3-4: User interface & dashboards
- Day 5: Testing & refinement

### **Week 4**: Deployment & Launch
- Days 1-2: Production deployment (systemd/Docker)
- Days 3-4: User testing & bug fixes
- Day 5: Launch & documentation

---

## 🏗️ Final Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Hostinger VPS                                                   │
│                                                                 │
│ ┌─────────────────────┐         ┌─────────────────────┐       │
│ │ Nginx (Port 80/443) │────────▶│ Node.js Website     │       │
│ │ Reverse Proxy       │         │ (Existing)          │       │
│ └──────────┬──────────┘         └─────────────────────┘       │
│            │                                                    │
│            │ /api/spm/*                                        │
│            ↓                                                    │
│ ┌─────────────────────────────────────────────────┐           │
│ │ FastAPI Backend (Port 8001)                     │           │
│ │ ┌─────────────────────────────────────────┐    │           │
│ │ │ Endpoints:                              │    │           │
│ │ │ - POST /upload (receive CSV)            │    │           │
│ │ │ - POST /analyze (run analysis)          │    │           │
│ │ │ - GET /download/{run_id} (get CSV)      │    │           │
│ │ │ - GET /runs (list all runs)             │    │           │
│ │ │ - GET /reports/{run_id} (PDF report)    │    │           │
│ │ └─────────────────────────────────────────┘    │           │
│ └───────────────┬─────────────────────────────────┘           │
│                 │                                               │
│                 ├──▶ DuckDB (spm_reference.duckdb - 50MB)     │
│                 │    - Corridor data (fast lookups)           │
│                 │                                              │
│                 └──▶ MySQL (localhost:3306)                   │
│                      Database: bbtro                           │
│                      - Staff data                              │
│                      - Analysis results                        │
│                      - File metadata                           │
│                                                                 │
│ ┌─────────────────────────────────────────────────┐           │
│ │ File Storage: /var/www/spm_uploads/             │           │
│ │ └── 2024/                                        │           │
│ │     └── 12/                                      │           │
│ │         ├── STF1234/                             │           │
│ │         │   ├── RUN_20241205_143022.csv          │           │
│ │         │   └── RUN_20241205_150315.xlsx         │           │
│ │         └── STF1956/                             │           │
│ │             └── RUN_20241205_091234.csv          │           │
│ └─────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                    Access via HTTPS
            https://yourwebsite.com/spm-analysis

        ┌──────────────┬──────────────┬──────────────┐
        │  Office PC 1 │  Office PC 2 │  Office PC 3 │
        │  (Browser)   │  (Browser)   │  (Browser)   │
        └──────────────┴──────────────┴──────────────┘
```

---

## 📦 Tech Stack

### Server Environment
- **OS**: Ubuntu/Debian (Hostinger VPS)
- **Python**: 3.10+
- **Node.js**: (Already installed)
- **MySQL**: (Already installed - bbtro database)
- **Nginx**: Reverse proxy

### Python Stack
- **FastAPI**: REST API framework
- **Uvicorn**: ASGI server
- **SQLAlchemy**: MySQL ORM
- **Polars**: CSV processing
- **DuckDB**: Reference data queries
- **Pandas**: Excel support
- **Pydantic**: Data validation

### Deployment
- **systemd**: Service management
- **Nginx**: Reverse proxy + SSL
- **Let's Encrypt**: Free SSL certificates

---

## 🔧 Week 1: Server Setup & Database

### Day 1-2: VPS Environment Setup

#### Step 1.1: SSH into VPS

```bash
# From your Mac terminal
ssh your_username@your_hostinger_ip

# Example:
# ssh root@123.45.67.89
# or
# ssh user@yourwebsite.com
```

#### Step 1.2: Update System

```bash
# Update package lists
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget vim build-essential
```

#### Step 1.3: Install Python 3.10+

```bash
# Check current Python version
python3 --version

# If < 3.10, install Python 3.10
sudo apt install -y python3.10 python3.10-venv python3-pip

# Verify installation
python3.10 --version
```

#### Step 1.4: Create Project Directory

```bash
# Create application directory
sudo mkdir -p /var/www/spm-analysis
sudo chown $USER:$USER /var/www/spm-analysis
cd /var/www/spm-analysis

# Create subdirectories
mkdir -p uploads/{2024,2025}
mkdir -p logs
mkdir -p backups
```

#### Step 1.5: Create Virtual Environment

```bash
cd /var/www/spm-analysis

# Create virtual environment
python3.10 -m venv venv

# Activate it
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# You should see (venv) in your terminal prompt
```

#### Step 1.6: Install Python Dependencies

```bash
# Create requirements.txt
cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
sqlalchemy==2.0.23
pymysql==1.1.0
cryptography==41.0.7
polars==0.19.19
pandas==2.1.3
openpyxl==3.1.2
duckdb==0.9.2
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
EOF

# Install all dependencies
pip install -r requirements.txt
```

#### Step 1.7: Upload Local Code to Server

**From your Mac** (new terminal window):

```bash
# Navigate to your local project
cd "/Users/neeraja/spm analysis app"

# Create deployment package (exclude venv, uploads, etc.)
tar -czf spm-deploy.tar.gz \
  --exclude='venv' \
  --exclude='uploads' \
  --exclude='*.pyc' \
  --exclude='__pycache__' \
  --exclude='.git' \
  .

# Upload to server
scp spm-deploy.tar.gz your_username@your_server:/var/www/spm-analysis/

# SSH back to server and extract
ssh your_username@your_server
cd /var/www/spm-analysis
tar -xzf spm-deploy.tar.gz
rm spm-deploy.tar.gz
```

---

### Day 3-4: MySQL Database Setup

#### Step 2.1: Access MySQL

```bash
# Connect to MySQL
mysql -u root -p

# Or if you have a specific user:
mysql -u your_mysql_user -p bbtro
```

#### Step 2.2: Create Tables for SPM App

```sql
USE bbtro;

-- Table 1: Raw file metadata
CREATE TABLE IF NOT EXISTS spm_raw_files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(50) UNIQUE NOT NULL,
    staff_id VARCHAR(20),
    train_number VARCHAR(20),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL COMMENT 'Relative path from /var/www/spm_uploads/',
    file_size_kb INT,
    file_type ENUM('csv', 'xlsx', 'xls'),
    upload_date DATE NOT NULL,
    upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploaded_by_user VARCHAR(50) COMMENT 'Website user who uploaded',
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,

    INDEX idx_staff_date (staff_id, upload_date),
    INDEX idx_run (run_id),
    INDEX idx_cleanup (upload_date, is_deleted),
    INDEX idx_train (train_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks all uploaded SPM raw data files';

-- Table 2: Analysis runs
CREATE TABLE IF NOT EXISTS spm_analysis_runs (
    analysis_id INT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(50) UNIQUE NOT NULL,
    raw_file_id INT,
    staff_id VARCHAR(20),
    train_number VARCHAR(20),
    train_code INT,
    corridor_name VARCHAR(50),
    from_station VARCHAR(10),
    to_station VARCHAR(10),
    run_date DATE,
    run_time TIME,
    max_speed DECIMAL(5,2),
    avg_speed DECIMAL(5,2),
    total_distance DECIMAL(10,2),
    duration_minutes INT,
    violations_count INT DEFAULT 0,
    bft_detected BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_staff (staff_id),
    INDEX idx_date (run_date),
    INDEX idx_train (train_number),
    INDEX idx_run (run_id),
    FOREIGN KEY (raw_file_id) REFERENCES spm_raw_files(file_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='SPM analysis run results';

-- Table 3: Speed violations
CREATE TABLE IF NOT EXISTS spm_speed_violations (
    violation_id INT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(50) NOT NULL,
    location_km DECIMAL(10,3),
    station_section VARCHAR(50),
    speed_recorded DECIMAL(5,2),
    speed_limit DECIMAL(5,2),
    overspeed_amount DECIMAL(5,2),
    severity ENUM('minor', 'moderate', 'severe', 'critical'),
    violation_time TIME,

    INDEX idx_run (run_id),
    INDEX idx_severity (severity),
    FOREIGN KEY (run_id) REFERENCES spm_analysis_runs(run_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Speed limit violations detected';

-- Table 4: Brake feel tests
CREATE TABLE IF NOT EXISTS spm_brake_tests (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(50) NOT NULL,
    detected_at_km DECIMAL(10,3),
    station_name VARCHAR(50),
    test_type ENUM('brake_feel', 'emergency_brake'),
    speed_before DECIMAL(5,2),
    speed_after DECIMAL(5,2),
    duration_seconds INT,
    test_time TIME,

    INDEX idx_run (run_id),
    FOREIGN KEY (run_id) REFERENCES spm_analysis_runs(run_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Brake feel tests detected';

-- Verify tables created
SHOW TABLES LIKE 'spm_%';

-- Check structure
DESCRIBE spm_raw_files;
DESCRIBE spm_analysis_runs;
DESCRIBE spm_speed_violations;
DESCRIBE spm_brake_tests;
```

#### Step 2.3: Create MySQL User for SPM App

```sql
-- Create dedicated user (more secure than using root)
CREATE USER IF NOT EXISTS 'spm_app'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant permissions
GRANT SELECT ON bbtro.staff TO 'spm_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON bbtro.spm_raw_files TO 'spm_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON bbtro.spm_analysis_runs TO 'spm_app'@'localhost';
GRANT SELECT, INSERT, DELETE ON bbtro.spm_speed_violations TO 'spm_app'@'localhost';
GRANT SELECT, INSERT, DELETE ON bbtro.spm_brake_tests TO 'spm_app'@'localhost';

FLUSH PRIVILEGES;

-- Test connection
EXIT;

# From bash:
mysql -u spm_app -p bbtro
# Enter password: your_secure_password
# Should connect successfully
EXIT;
```

#### Step 2.4: Upload DuckDB Reference Database

**From your Mac**:

```bash
# Upload the DuckDB file we created earlier
scp "/Users/neeraja/spm analysis app/spm_reference.duckdb" \
    your_username@your_server:/var/www/spm-analysis/

# Also upload train corridor map CSV (backup)
scp "/Users/neeraja/spm analysis app/train_corridor_map.csv" \
    your_username@your_server:/var/www/spm-analysis/
```

**On server**:

```bash
cd /var/www/spm-analysis

# Verify files
ls -lh spm_reference.duckdb
ls -lh train_corridor_map.csv

# Test DuckDB
source venv/bin/activate
python3 -c "import duckdb; conn = duckdb.connect('spm_reference.duckdb', read_only=True); print('Tables:', conn.execute('SHOW TABLES').fetchall()); conn.close()"
```

#### Step 2.5: Environment Configuration

```bash
cd /var/www/spm-analysis

# Create .env file for configuration
cat > .env << 'EOF'
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=spm_app
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=bbtro

# DuckDB Configuration
DUCKDB_PATH=/var/www/spm-analysis/spm_reference.duckdb

# File Storage
UPLOAD_BASE_DIR=/var/www/spm_uploads
MAX_UPLOAD_SIZE_MB=10

# API Configuration
API_PORT=8001
API_HOST=0.0.0.0

# Cleanup Configuration
FILE_RETENTION_DAYS=180

# Environment
ENVIRONMENT=production
DEBUG=false
EOF

# Secure the .env file
chmod 600 .env
```

---

### Day 5: Testing & Verification

#### Step 3.1: Test MySQL Connection

```bash
cd /var/www/spm-analysis
source venv/bin/activate

# Create test script
cat > test_mysql.py << 'EOF'
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

# Build connection string
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@{os.getenv('MYSQL_HOST')}/{os.getenv('MYSQL_DATABASE')}"

print(f"Testing connection to: {os.getenv('MYSQL_HOST')}/{os.getenv('MYSQL_DATABASE')}")

try:
    engine = create_engine(MYSQL_URL)
    with engine.connect() as conn:
        # Test query
        result = conn.execute(text("SELECT COUNT(*) as count FROM spm_raw_files"))
        count = result.scalar()
        print(f"✓ Connected successfully!")
        print(f"✓ spm_raw_files table has {count} records")

        # Test staff table access
        result = conn.execute(text("SELECT COUNT(*) as count FROM staff"))
        count = result.scalar()
        print(f"✓ staff table has {count} records")

    print("\n✓ All database tests passed!")
except Exception as e:
    print(f"✗ Database connection failed: {e}")
EOF

python3 test_mysql.py
```

#### Step 3.2: Test DuckDB Connection

```bash
# Create test script
cat > test_duckdb.py << 'EOF'
import duckdb
from dotenv import load_dotenv
import os

load_dotenv()

DUCKDB_PATH = os.getenv('DUCKDB_PATH')

print(f"Testing DuckDB at: {DUCKDB_PATH}")

try:
    conn = duckdb.connect(DUCKDB_PATH, read_only=True)

    # List tables
    tables = conn.execute("SHOW TABLES").fetchall()
    print(f"✓ DuckDB connected successfully!")
    print(f"✓ Found {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")

    # Test train corridor map
    result = conn.execute("SELECT COUNT(*) FROM train_corridor_map").fetchone()
    print(f"✓ train_corridor_map has {result[0]} records")

    # Test sample lookup
    result = conn.execute("SELECT * FROM train_corridor_map WHERE train_number = 'K40'").fetchone()
    if result:
        print(f"✓ Sample lookup successful: K40 → {result}")

    conn.close()
    print("\n✓ All DuckDB tests passed!")
except Exception as e:
    print(f"✗ DuckDB test failed: {e}")
EOF

python3 test_duckdb.py
```

#### Step 3.3: Test File Storage

```bash
# Test upload directory permissions
sudo mkdir -p /var/www/spm_uploads
sudo chown -R $USER:www-data /var/www/spm_uploads
sudo chmod -R 755 /var/www/spm_uploads

# Test write access
touch /var/www/spm_uploads/test.txt
echo "Test content" > /var/www/spm_uploads/test.txt
cat /var/www/spm_uploads/test.txt
rm /var/www/spm_uploads/test.txt

echo "✓ File storage permissions OK"
```

---

## Week 1 Deliverables Checklist

- [ ] VPS SSH access working
- [ ] Python 3.10+ installed
- [ ] Virtual environment created
- [ ] All Python packages installed
- [ ] MySQL tables created (spm_raw_files, spm_analysis_runs, etc.)
- [ ] MySQL user 'spm_app' created with permissions
- [ ] DuckDB file uploaded and tested
- [ ] .env configuration file created
- [ ] MySQL connection test passed
- [ ] DuckDB connection test passed
- [ ] File storage directory created with permissions

**Status Check**: Run this to verify everything:

```bash
cd /var/www/spm-analysis
source venv/bin/activate

echo "=== Week 1 Verification ==="
echo "1. Python version:"
python3 --version

echo -e "\n2. Installed packages:"
pip list | grep -E "fastapi|uvicorn|sqlalchemy|duckdb|polars"

echo -e "\n3. MySQL tables:"
mysql -u spm_app -p bbtro -e "SHOW TABLES LIKE 'spm_%';"

echo -e "\n4. DuckDB file:"
ls -lh spm_reference.duckdb

echo -e "\n5. Upload directory:"
ls -ld /var/www/spm_uploads

echo -e "\n6. Run tests:"
python3 test_mysql.py
python3 test_duckdb.py
```

---

## 🎯 Week 1 Summary

By end of Week 1, you'll have:
✅ Server environment ready
✅ Database tables created
✅ Reference data loaded
✅ All connections tested
✅ Ready to build the API

---

## Next: Week 2 - FastAPI Backend Development

Week 2 will cover:
- File upload endpoint
- CSV processing logic
- Analysis engine (violations, BFT detection)
- Download endpoints
- API testing

**Ready to proceed to Week 2 after completing Week 1!**
