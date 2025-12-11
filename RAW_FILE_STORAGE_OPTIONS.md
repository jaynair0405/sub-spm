# Raw File Storage Options - SPM Analysis App

## Your Requirement

✅ Store raw CSV/Excel files for future reference
✅ Auto-delete after 6 months
✅ Get file link/reference
✅ Track storage location (MySQL preferred, else Google Sheet/Excel)

---

## Option 1: Local Filesystem + MySQL Metadata ⭐ **RECOMMENDED**

### Architecture
```
Upload Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. User uploads CSV (via web form)                         │
│    ↓                                                        │
│ 2. FastAPI receives file                                   │
│    ↓                                                        │
│ 3. Save to: /uploads/2024/12/STF1234/RUN_20241205_143022.csv│
│    ↓                                                        │
│ 4. Process CSV (analyze, detect violations)                │
│    ↓                                                        │
│ 5. Store metadata in MySQL:                                │
│    - file_path: /uploads/2024/12/STF1234/...              │
│    - file_size: 450 KB                                     │
│    - upload_date: 2024-12-05                               │
│    - run_id: RUN_20241205_143022                           │
│    ↓                                                        │
│ 6. Return success with file reference                      │
└─────────────────────────────────────────────────────────────┘

Cleanup (Background Job - runs daily):
┌─────────────────────────────────────────────────────────────┐
│ 1. Query MySQL for files older than 6 months               │
│    ↓                                                        │
│ 2. Delete physical files from /uploads/                    │
│    ↓                                                        │
│ 3. Update MySQL: mark as deleted or remove record          │
│    ↓                                                        │
│ 4. Log cleanup activity                                    │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure
```
/Users/neeraja/spm analysis app/uploads/
├── 2024/
│   ├── 12/
│   │   ├── STF1234/
│   │   │   ├── RUN_20241205_143022.csv
│   │   │   ├── RUN_20241205_150315.xlsx
│   │   │   └── RUN_20241205_163045.csv
│   │   ├── STF1956/
│   │   │   ├── RUN_20241205_091234.csv
│   │   │   └── RUN_20241205_142156.csv
│   │   └── STF2277/
│   │       └── RUN_20241205_111523.xlsx
│   └── 11/
│       └── STF1234/
│           └── ... (will be deleted after 6 months)
└── 2023/
    └── ... (to be deleted)
```

### MySQL Table Schema

```sql
CREATE TABLE spm_raw_files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(50) UNIQUE NOT NULL,
    staff_id VARCHAR(20),
    train_number VARCHAR(20),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_kb INT,
    file_type ENUM('csv', 'xlsx', 'xls'),
    upload_date DATE NOT NULL,
    upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,

    -- Easy lookup
    INDEX idx_staff_date (staff_id, upload_date),
    INDEX idx_run (run_id),
    INDEX idx_cleanup (upload_date, is_deleted),

    FOREIGN KEY (run_id) REFERENCES spm_analysis_runs(run_id),
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
);

-- Add file reference to analysis runs table
ALTER TABLE spm_analysis_runs
ADD COLUMN raw_file_id INT,
ADD FOREIGN KEY (raw_file_id) REFERENCES spm_raw_files(file_id);
```

### Implementation Code

```python
# main.py - Updated upload endpoint

import os
from pathlib import Path
from datetime import datetime
import shutil

UPLOAD_BASE_DIR = Path(__file__).parent / "uploads"
UPLOAD_BASE_DIR.mkdir(exist_ok=True)

@app.post("/upload")
async def upload_spm_file(
    file: UploadFile = File(...),
    staff_id: Optional[str] = Form(None),
    train_number: Optional[str] = Form(None),
    from_station: Optional[str] = Form(None),
    to_station: Optional[str] = Form(None),
):
    """
    Upload and analyze SPM file
    - Saves raw file to disk
    - Processes and analyzes data
    - Stores results in MySQL
    """

    # 1. Generate run ID
    run_id = f"RUN_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    # 2. Create organized folder structure: /uploads/YYYY/MM/STAFF_ID/
    now = datetime.now()
    file_dir = UPLOAD_BASE_DIR / str(now.year) / f"{now.month:02d}" / (staff_id or "UNKNOWN")
    file_dir.mkdir(parents=True, exist_ok=True)

    # 3. Save file with run_id as name
    file_ext = Path(file.filename).suffix  # .csv or .xlsx
    safe_filename = f"{run_id}{file_ext}"
    file_path = file_dir / safe_filename

    # Save uploaded file to disk
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Get file size
    file_size_kb = file_path.stat().st_size // 1024

    # 4. Process CSV (read from saved file)
    try:
        if file_ext == '.csv':
            df = pl.read_csv(file_path)
        else:
            df = pl.from_pandas(pd.read_excel(file_path))

        # Data cleaning and processing...
        df = clean_and_process(df)

        # Get corridor info from DuckDB
        corridor_info = get_corridor_info(train_number)

        # Analyze violations
        violations = detect_violations(df, corridor_info)

        # Calculate summary stats
        summary = calculate_summary(df)

    except Exception as e:
        # If processing fails, still keep the file for manual review
        logger.error(f"Processing failed for {run_id}: {e}")
        # Continue to save metadata

    # 5. Store file metadata in MySQL
    db = SessionLocal()
    try:
        # Store raw file metadata
        raw_file = SPMRawFile(
            run_id=run_id,
            staff_id=staff_id,
            train_number=train_number,
            file_name=file.filename,
            file_path=str(file_path.relative_to(UPLOAD_BASE_DIR)),  # Store relative path
            file_size_kb=file_size_kb,
            file_type=file_ext[1:],  # Remove dot
            upload_date=now.date()
        )
        db.add(raw_file)
        db.flush()  # Get raw_file.file_id

        # Store analysis results
        analysis_run = SPMAnalysisRun(
            run_id=run_id,
            raw_file_id=raw_file.file_id,  # Link to raw file
            staff_id=staff_id,
            train_number=train_number,
            from_station=from_station,
            to_station=to_station,
            run_date=now.date(),
            max_speed=summary['max_speed'],
            avg_speed=summary['avg_speed'],
            total_distance=summary['total_distance'],
            violations_count=len(violations)
        )
        db.add(analysis_run)

        # Store violations
        for v in violations:
            db.add(SPMViolation(run_id=run_id, **v))

        db.commit()

    except Exception as e:
        db.rollback()
        # Even if DB fails, file is saved locally
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

    # 6. Return response with file reference
    return {
        "success": True,
        "run_id": run_id,
        "file_saved": str(file_path.relative_to(UPLOAD_BASE_DIR)),
        "file_size_kb": file_size_kb,
        "summary": summary,
        "violations_count": len(violations)
    }
```

### Cleanup Job (Background Task)

```python
# cleanup_old_files.py

from datetime import datetime, timedelta
from pathlib import Path
import os
from sqlalchemy.orm import Session
from database import SessionLocal, SPMRawFile

UPLOAD_BASE_DIR = Path(__file__).parent / "uploads"
RETENTION_DAYS = 180  # 6 months

def cleanup_old_files():
    """
    Delete files older than 6 months
    Run this daily via cron job or scheduler
    """
    db = SessionLocal()
    cutoff_date = datetime.now().date() - timedelta(days=RETENTION_DAYS)

    try:
        # Find files older than 6 months that haven't been deleted
        old_files = db.query(SPMRawFile).filter(
            SPMRawFile.upload_date < cutoff_date,
            SPMRawFile.is_deleted == False
        ).all()

        deleted_count = 0
        total_size_freed = 0

        for file_record in old_files:
            file_path = UPLOAD_BASE_DIR / file_record.file_path

            # Delete physical file if exists
            if file_path.exists():
                file_size = file_path.stat().st_size
                file_path.unlink()  # Delete file
                total_size_freed += file_size
                deleted_count += 1

                # Update database record
                file_record.is_deleted = True
                file_record.deleted_at = datetime.now()

                print(f"✓ Deleted: {file_record.file_name} ({file_record.file_size_kb} KB)")

        db.commit()

        print(f"\n=== Cleanup Summary ===")
        print(f"Files deleted: {deleted_count}")
        print(f"Space freed: {total_size_freed / 1024 / 1024:.2f} MB")
        print(f"Cutoff date: {cutoff_date}")

    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}")
    finally:
        db.close()

# Schedule this to run daily
if __name__ == "__main__":
    cleanup_old_files()
```

### Cron Job Setup (macOS/Linux)

```bash
# Add to crontab (run daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * cd /Users/neeraja/spm\ analysis\ app && source venv/bin/activate && python cleanup_old_files.py >> logs/cleanup.log 2>&1
```

### Accessing Files from Website

```python
# API endpoint to retrieve raw file
@app.get("/files/{run_id}")
async def get_raw_file(run_id: str):
    """
    Download original raw file by run_id
    """
    db = SessionLocal()
    try:
        file_record = db.query(SPMRawFile).filter(
            SPMRawFile.run_id == run_id,
            SPMRawFile.is_deleted == False
        ).first()

        if not file_record:
            raise HTTPException(status_code=404, detail="File not found or deleted")

        file_path = UPLOAD_BASE_DIR / file_record.file_path

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File missing on disk")

        return FileResponse(
            path=file_path,
            filename=file_record.file_name,
            media_type='application/octet-stream'
        )
    finally:
        db.close()
```

### Website Query Examples

```sql
-- List recent uploads
SELECT
    r.run_id,
    r.file_name,
    r.staff_id,
    s.staff_name,
    r.train_number,
    r.upload_date,
    CONCAT(r.file_size_kb, ' KB') as file_size,
    CASE WHEN r.is_deleted THEN 'Deleted' ELSE 'Available' END as status
FROM spm_raw_files r
LEFT JOIN staff s ON r.staff_id = s.staff_id
ORDER BY r.upload_date DESC
LIMIT 50;

-- Get file for specific run
SELECT file_path, file_name
FROM spm_raw_files
WHERE run_id = 'RUN_20241205_143022';

-- Storage usage by month
SELECT
    DATE_FORMAT(upload_date, '%Y-%m') as month,
    COUNT(*) as files_count,
    SUM(file_size_kb) / 1024 as total_size_mb,
    SUM(CASE WHEN is_deleted THEN 1 ELSE 0 END) as deleted_count
FROM spm_raw_files
GROUP BY DATE_FORMAT(upload_date, '%Y-%m')
ORDER BY month DESC;
```

### Pros
✅ **Very simple** - Just filesystem operations
✅ **Fast** - Local storage, instant access
✅ **Easy MySQL tracking** - Single table
✅ **Auto cleanup** - Simple cron job
✅ **No external dependencies** - No API keys needed
✅ **Free** - No cloud storage costs

### Cons
❌ **Local only** - Not accessible remotely
❌ **Manual backup** - Need separate backup strategy
❌ **Single point of failure** - If disk fails, files lost

### Storage Calculation
```
Per file: 150-600 KB (avg 400 KB)
Daily: 50 files × 400 KB = 20 MB
Monthly: 20 MB × 30 = 600 MB
6 months: 600 MB × 6 = 3.6 GB (rolling window)
```

**Complexity**: ⭐ **Very Low** (2-3 hours implementation)

---

## Option 2: Google Drive Storage + MySQL Metadata

### Architecture
```
Upload Flow:
┌──────────────────────────────────────────────────────┐
│ 1. User uploads CSV                                  │
│    ↓                                                 │
│ 2. FastAPI processes file                           │
│    ↓                                                 │
│ 3. Upload to Google Drive (via API)                 │
│    ↓                                                 │
│ 4. Get shareable link from Google Drive             │
│    ↓                                                 │
│ 5. Store link in MySQL:                             │
│    - gdrive_file_id: 1a2b3c4d5e                     │
│    - gdrive_link: https://drive.google.com/...      │
│    - upload_date: 2024-12-05                        │
│    ↓                                                 │
│ 6. Return success with Google Drive link            │
└──────────────────────────────────────────────────────┘

Cleanup (via Google Drive API):
┌──────────────────────────────────────────────────────┐
│ 1. Query files older than 6 months from MySQL       │
│    ↓                                                 │
│ 2. Call Google Drive API to delete files            │
│    ↓                                                 │
│ 3. Update MySQL: mark as deleted                    │
└──────────────────────────────────────────────────────┘
```

### MySQL Schema

```sql
CREATE TABLE spm_raw_files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(50) UNIQUE NOT NULL,
    staff_id VARCHAR(20),
    train_number VARCHAR(20),
    file_name VARCHAR(255) NOT NULL,

    -- Google Drive fields
    gdrive_file_id VARCHAR(100),  -- Google Drive file ID
    gdrive_link VARCHAR(500),      -- Shareable link

    file_size_kb INT,
    file_type ENUM('csv', 'xlsx', 'xls'),
    upload_date DATE NOT NULL,
    upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,

    INDEX idx_staff_date (staff_id, upload_date),
    INDEX idx_run (run_id),
    INDEX idx_gdrive (gdrive_file_id)
);
```

### Implementation Code

```python
# google_drive_service.py

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import os

class GoogleDriveService:
    def __init__(self):
        # Load credentials (one-time setup required)
        creds = Credentials.from_authorized_user_file('token.json')
        self.service = build('drive', 'v3', credentials=creds)

        # Create SPM folder if doesn't exist
        self.spm_folder_id = self._get_or_create_folder('SPM_Analysis_Files')

    def _get_or_create_folder(self, folder_name):
        """Create folder in Google Drive if it doesn't exist"""
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'"
        results = self.service.files().list(q=query, fields='files(id, name)').execute()
        folders = results.get('files', [])

        if folders:
            return folders[0]['id']

        # Create folder
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = self.service.files().create(body=folder_metadata, fields='id').execute()
        return folder['id']

    def upload_file(self, file_path: str, file_name: str, staff_id: str) -> dict:
        """
        Upload file to Google Drive
        Returns: {'file_id': '...', 'link': '...'}
        """
        # Create year/month subfolder structure
        import datetime
        now = datetime.datetime.now()
        year_folder = self._get_or_create_folder(f"{now.year}")
        month_folder = self._get_or_create_folder(f"{now.year}-{now.month:02d}", parent=year_folder)
        staff_folder = self._get_or_create_folder(f"{staff_id}", parent=month_folder)

        # Upload file
        file_metadata = {
            'name': file_name,
            'parents': [staff_folder]
        }

        media = MediaFileUpload(file_path, resumable=True)
        file = self.service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()

        # Make file shareable (view-only)
        permission = {
            'type': 'anyone',
            'role': 'reader'
        }
        self.service.permissions().create(
            fileId=file['id'],
            body=permission
        ).execute()

        return {
            'file_id': file['id'],
            'link': file['webViewLink']
        }

    def delete_file(self, file_id: str):
        """Delete file from Google Drive"""
        self.service.files().delete(fileId=file_id).execute()

# Usage in main.py
@app.post("/upload")
async def upload_spm_file(...):
    # ... process file ...

    # Save temporarily
    temp_path = f"/tmp/{run_id}{file_ext}"
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Upload to Google Drive
    gdrive = GoogleDriveService()
    gdrive_info = gdrive.upload_file(temp_path, safe_filename, staff_id)

    # Remove temp file
    os.unlink(temp_path)

    # Store in MySQL
    raw_file = SPMRawFile(
        run_id=run_id,
        gdrive_file_id=gdrive_info['file_id'],
        gdrive_link=gdrive_info['link'],
        ...
    )
    db.add(raw_file)
    db.commit()

    return {
        "success": True,
        "run_id": run_id,
        "gdrive_link": gdrive_info['link']
    }
```

### Setup Steps for Google Drive API

```bash
# 1. Enable Google Drive API in Google Cloud Console
# 2. Create OAuth 2.0 credentials
# 3. Download credentials.json
# 4. Run authentication flow (one-time)

pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

python auth_google_drive.py  # Generates token.json
```

### Pros
✅ **Accessible anywhere** - Cloud storage
✅ **Automatic backup** - Google's infrastructure
✅ **Shareable links** - Easy to access from website
✅ **Organized folders** - Automatic folder structure
✅ **No local storage** - Saves disk space

### Cons
❌ **API complexity** - OAuth setup required
❌ **Quota limits** - 10,000 requests/day (plenty for 50 files/day)
❌ **Credential management** - Need to secure token.json
❌ **Network dependency** - Slower than local
❌ **Google account required** - Need Google Workspace account

**Complexity**: ⭐⭐⭐ **Medium** (8-10 hours implementation)

---

## Option 3: Hybrid - Local Storage + Google Drive Backup

### Architecture
```
Primary: Local filesystem (fast access)
Backup: Google Drive (sync nightly)
Metadata: MySQL (tracking both)
```

```python
# Best of both worlds
@app.post("/upload")
async def upload_spm_file(...):
    # 1. Save locally (primary)
    save_to_local(file_path)

    # 2. Queue for Google Drive backup (async)
    backup_queue.put({
        'file_path': file_path,
        'run_id': run_id
    })

    # 3. Store metadata
    db.add(SPMRawFile(
        file_path=local_path,
        gdrive_file_id=None,  # Will be updated by backup job
        ...
    ))

# Background job runs every night
def backup_to_gdrive():
    while True:
        item = backup_queue.get()
        gdrive_info = upload_to_gdrive(item['file_path'])
        update_mysql_with_gdrive_id(item['run_id'], gdrive_info)
```

### Pros
✅ **Fast local access** + **Cloud backup**
✅ **Best of both worlds**

### Cons
❌ **Most complex** - Two storage systems

**Complexity**: ⭐⭐⭐⭐ **High** (12-15 hours)

---

## Comparison Matrix

| Feature | Option 1 (Local) | Option 2 (GDrive) | Option 3 (Hybrid) |
|---------|------------------|-------------------|-------------------|
| **Implementation Time** | 2-3 hours | 8-10 hours | 12-15 hours |
| **Complexity** | ⭐ Very Low | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ High |
| **Storage Cost** | Free | Free | Free |
| **Access Speed** | Fast | Medium | Fast |
| **Remote Access** | ❌ No | ✅ Yes | ✅ Yes |
| **Auto Backup** | ❌ Manual | ✅ Yes | ✅ Yes |
| **MySQL Tracking** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Offline Work** | ✅ Yes | ❌ No | ✅ Yes |
| **Auto Cleanup** | ✅ Easy | ✅ Easy | ⭐⭐ Medium |

---

## My Recommendation

### Start with **Option 1 (Local + MySQL)** ⭐

**Why?**
1. **Simplest** - 2-3 hours to implement
2. **Works immediately** - No API setup
3. **Fast** - Local filesystem is fastest
4. **Easy cleanup** - Simple cron job
5. **Minimal dependencies** - Just filesystem + MySQL

**Later (if needed)**, add Google Drive backup:
- The local structure is already organized
- Easy to add background sync job
- Upgrade path to Option 3

### Implementation Plan

**Week 1** (Local Storage):
1. Create `uploads/` folder structure
2. Add `spm_raw_files` table to MySQL
3. Update FastAPI upload endpoint to save files
4. Test with sample uploads

**Week 2** (Cleanup):
1. Create `cleanup_old_files.py` script
2. Test deletion logic
3. Setup cron job for daily cleanup
4. Add logging

**Future** (Optional GDrive Backup):
1. Setup Google Drive API
2. Create nightly backup job
3. Update MySQL with GDrive links

---

## Alternative: Simple Excel/CSV Log

If you want something **even simpler** before MySQL:

```python
# log_uploads.py
import pandas as pd
from pathlib import Path

LOG_FILE = "uploads_log.xlsx"

def log_upload(run_id, staff_id, file_name, file_path, file_size_kb):
    """Append upload info to Excel log"""

    new_row = {
        'run_id': run_id,
        'staff_id': staff_id,
        'train_number': train_number,
        'file_name': file_name,
        'file_path': file_path,
        'file_size_kb': file_size_kb,
        'upload_date': datetime.now(),
        'status': 'active'
    }

    if Path(LOG_FILE).exists():
        df = pd.read_excel(LOG_FILE)
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    else:
        df = pd.DataFrame([new_row])

    df.to_excel(LOG_FILE, index=False)
```

But **MySQL is better** because:
- ✅ Queryable from website
- ✅ Joins with staff data
- ✅ Faster lookups
- ✅ No Excel file corruption issues

---

## Final Answer to Your Question

**Yes, we can definitely do this storing through the app!**

**Recommended Approach**:
1. ✅ **Store files locally** in organized folder structure
2. ✅ **Track in MySQL** (file path, size, date, staff, etc.)
3. ✅ **Auto-cleanup** via daily background job (6 months)
4. ✅ **Access via API** from website using run_id

**Implementation**: ~2-3 hours
**Storage**: ~3.6 GB (rolling 6-month window)
**Complexity**: Very Low

**File link storage**: MySQL table (easiest, already integrated)
**Alternative**: Can add Google Sheet logging if needed, but MySQL is better

**Ready to implement Option 1 (Local + MySQL)?**
