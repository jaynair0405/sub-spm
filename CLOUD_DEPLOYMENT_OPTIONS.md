# Cloud Deployment Options - SPM Analysis App

## Executive Summary

**RECOMMENDATION**: Deploy FastAPI on your web server (cloud-based)

This solves ALL your concerns:
- ✅ Access from any computer
- ✅ Multiple users can analyze simultaneously
- ✅ Download CSV files from website
- ✅ Integrated with your Node.js site
- ✅ Centralized data storage

---

## Option A: Local Desktop App (Original Plan)

### Architecture
```
┌─────────────────────────────────────┐
│ Your Mac (Office PC #1)            │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ FastAPI (localhost:8001)    │   │
│ │ - Analyzes CSV files        │   │
│ │ - Connects to MySQL         │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Local Files                 │   │
│ │ /uploads/2024/12/...       │   │
│ │ - 3.6 GB storage            │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ DuckDB (spm_reference.db)   │   │
│ │ - Corridor data (50 MB)     │   │
│ └─────────────────────────────┘   │
└─────────────────┬───────────────────┘
                  │
                  ↓ Internet
┌─────────────────────────────────────┐
│ MySQL Server (bbtro)                │
│ - Analysis results                  │
│ - Staff data                        │
└─────────────────────────────────────┘
```

### Pros
✅ Simple setup on your Mac
✅ No server configuration needed
✅ Works offline
✅ Fast (everything local)

### Cons
❌ **Single user only** - Only PC #1 can analyze
❌ **No remote access** - Can't access from Office PC #2
❌ **Files trapped** - Website can't download CSV files
❌ **Manual updates** - Need to update each PC separately
❌ **No collaboration** - Can't share analysis in real-time

### Use Case
- Solo analyst
- One dedicated analysis workstation
- No need for remote access

**Complexity**: ⭐ Low (what we've been building)

---

## Option B: Cloud-Based (FastAPI on Web Server) ⭐ RECOMMENDED

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│ Your Web Server (Same server as Node.js website)           │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Node.js Website (Port 80/443)                       │   │
│ │ - Main website UI                                   │   │
│ │ - Staff management                                  │   │
│ │ - Dashboard & reports                               │   │
│ └─────────────────┬───────────────────────────────────┘   │
│                   │ Calls                                  │
│                   ↓                                        │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ FastAPI Backend (Port 8001)                         │   │
│ │ - /upload endpoint (receives CSV)                   │   │
│ │ - /download/{run_id} (download original CSV)        │   │
│ │ - /analyze (run analysis)                           │   │
│ │ - Uses DuckDB for corridor lookups                  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Server Storage (/var/www/spm_uploads/)             │   │
│ │ - Raw CSV files (3.6 GB rolling)                    │   │
│ │ - Auto-cleanup after 6 months                       │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ DuckDB (spm_reference.duckdb - 50 MB)              │   │
│ │ - Corridor data                                     │   │
│ │ - Train codes                                       │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ MySQL (localhost or remote)                         │   │
│ │ - Database: bbtro                                   │   │
│ │ - Staff data                                        │   │
│ │ - Analysis results                                  │   │
│ │ - File metadata                                     │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ Internet
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Office PC #1  │   │ Office PC #2  │   │ Home Laptop   │
│ (Any browser) │   │ (Any browser) │   │ (Any browser) │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Workflow (Cloud-Based)

```
1. Staff opens: https://yourwebsite.com/spm-analysis
   ↓
2. Upload CSV through web form
   ↓
3. FastAPI on server:
   - Saves CSV to /var/www/spm_uploads/
   - Analyzes using DuckDB (local to server)
   - Stores results in MySQL
   ↓
4. Results displayed immediately on website
   ↓
5. Staff can:
   - View analysis report
   - Download original CSV
   - See violations
   - Generate PDF report
```

### Pros
✅ **Multi-user** - Entire office can use it
✅ **Remote access** - Work from home
✅ **Centralized** - One place for all data
✅ **Integrated** - Part of your website
✅ **Downloadable files** - Click to download CSV
✅ **Real-time collaboration** - Share analysis instantly
✅ **Auto-backup** - Server backups cover everything
✅ **Professional** - Cloud-based SaaS feel

### Cons
❌ Requires server configuration (Python, FastAPI)
❌ Need server resources (CPU for analysis)
❌ Internet required (can't work offline)

### Requirements

**Server Specs:**
- Python 3.10+ support
- 2 GB RAM minimum (4 GB recommended)
- 10 GB disk space (for 6-month rolling data)
- SSH access for deployment

**Software:**
- Node.js (already running)
- Python 3.10+
- pip (Python package manager)
- MySQL (already have)

### Complexity: ⭐⭐⭐ Medium

**Setup Time**: 1-2 days (one-time)
**Maintenance**: Low (auto-deploy updates)

---

## Deployment Options (for Option B)

### Deployment A: Manual Deployment

```bash
# 1. SSH to your server
ssh user@yourserver.com

# 2. Install Python (if not already)
sudo apt install python3.10 python3-pip

# 3. Create directory
mkdir /var/www/spm-analysis
cd /var/www/spm-analysis

# 4. Upload files (from your Mac)
scp -r /Users/neeraja/spm\ analysis\ app/* user@yourserver:/var/www/spm-analysis/

# 5. Setup virtual environment on server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6. Run FastAPI with systemd (auto-restart)
sudo nano /etc/systemd/system/spm-api.service
```

**systemd service file:**
```ini
[Unit]
Description=SPM Analysis FastAPI
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/spm-analysis
Environment="PATH=/var/www/spm-analysis/venv/bin"
ExecStart=/var/www/spm-analysis/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001

[Install]
WantedBy=multi-user.target
```

```bash
# 7. Start service
sudo systemctl start spm-api
sudo systemctl enable spm-api  # Auto-start on boot

# 8. Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/yourwebsite.com
```

**Nginx config:**
```nginx
# Add to existing website config
location /api/spm/ {
    proxy_pass http://localhost:8001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

```bash
# 9. Reload Nginx
sudo systemctl reload nginx
```

### Deployment B: Docker (Easier)

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  spm-api:
    build: .
    ports:
      - "8001:8001"
    volumes:
      - ./uploads:/app/uploads
      - ./spm_reference.duckdb:/app/spm_reference.duckdb
    environment:
      - MYSQL_HOST=localhost
      - MYSQL_USER=your_user
      - MYSQL_PASSWORD=your_password
      - MYSQL_DB=bbtro
    restart: always
```

```bash
# Deploy with one command
docker-compose up -d
```

---

## Integration with Your Node.js Website

### Frontend Integration (spm.html → Your Website)

**Option 1: Embed in existing page**
```html
<!-- In your Node.js website template -->
<div id="spm-analysis-section">
    <!-- Embed spm.html content here -->
</div>

<script>
// Change API endpoint from localhost to your domain
const API_BASE = "https://yourwebsite.com/api/spm";

async function uploadFile() {
    const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData
    });
}
</script>
```

**Option 2: Separate route**
```javascript
// In your Node.js app (Express example)
app.get('/spm-analysis', (req, res) => {
    res.render('spm-analysis', {
        user: req.session.user,  // Pass logged-in user
        apiUrl: process.env.SPM_API_URL
    });
});
```

### Backend Integration (Node.js ↔ FastAPI)

```javascript
// Node.js backend can call FastAPI
const axios = require('axios');

app.post('/analyze-spm', async (req, res) => {
    try {
        // Call FastAPI from Node.js
        const result = await axios.post('http://localhost:8001/upload', {
            file: req.file,
            staff_id: req.body.staff_id
        });

        res.json(result.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

## Data Storage Comparison

### Reference Data (Corridors, Train Codes)

| Option | Storage | Performance | Complexity |
|--------|---------|-------------|------------|
| **DuckDB on Server** | 50 MB file | ⭐⭐⭐ Fast | ⭐ Low |
| **MySQL Tables** | ~10 MB | ⭐⭐ Medium | ⭐⭐ Medium |
| **JSON Files** | ~5 MB | ⭐ Slow | ⭐ Low |

**Recommended**: DuckDB on server (upload once, fast queries)

### Raw CSV Files

| Option | Access | Multi-User | Complexity |
|--------|--------|------------|------------|
| **Server Storage** | ✅ Anywhere | ✅ Yes | ⭐⭐ Medium |
| **Local Storage** | ❌ One PC | ❌ No | ⭐ Low |
| **Google Drive** | ✅ Anywhere | ✅ Yes | ⭐⭐⭐ High |
| **S3/Cloud** | ✅ Anywhere | ✅ Yes | ⭐⭐⭐⭐ High |

**Recommended**: Server storage (simple, sufficient)

---

## Cost Comparison

### Option A: Local Desktop
- **Development**: 20 hours (as planned)
- **Server Cost**: $0/month (no server changes)
- **Storage**: Uses your Mac's disk (free)
- **Users**: 1

### Option B: Cloud Deployment
- **Development**: 30-40 hours (one-time setup)
- **Server Cost**: $0/month (uses existing server)
- **Storage**: ~4 GB on your server (negligible)
- **Users**: Unlimited

**Cost Difference**: ~20 hours extra development (one-time)
**Benefit**: Unlimited users, remote access, professional deployment

---

## Migration Path (If You Choose Cloud)

### Phase 1: Build Locally (2 weeks)
- ✅ Build FastAPI app on your Mac
- ✅ Test with sample data
- ✅ Create DuckDB reference database
- ✅ Verify analysis logic

### Phase 2: Deploy to Server (2-3 days)
- Upload code to server
- Configure environment
- Setup systemd/Docker
- Test from browser

### Phase 3: Integrate with Website (3-5 days)
- Add SPM section to website
- Integrate authentication (use existing user system)
- Add dashboard/reports
- Staff can start using

**Total**: ~3-4 weeks for complete cloud deployment

---

## Questions to Answer

Before deciding, tell me:

### 1. **Server Access**
- What hosting provider? (AWS, DigitalOcean, shared hosting, etc.)
- Do you have SSH access?
- Can you install Python packages?
- Current server OS? (Ubuntu, CentOS, etc.)

### 2. **Current Website**
- Node.js version?
- Using Express/other framework?
- Already have user authentication?
- Can you add new routes?

### 3. **Use Case**
- How many people will analyze SPM data?
- Need to access from multiple computers?
- Need to work from home?
- Need to share analysis reports?

### 4. **Priority**
- **Speed to market** → Option A (local, simpler, 2-3 weeks)
- **Professional solution** → Option B (cloud, better, 3-4 weeks)

---

## My Recommendation

### If 1-2 users, one office PC:
→ **Option A (Local Desktop)** - Simpler, faster to build

### If 3+ users OR need remote access:
→ **Option B (Cloud Deployment)** - Better long-term

### If unsure:
→ **Start with Option A, migrate to B later**
- Build locally first (what we've been doing)
- Test and validate
- Deploy to server once proven
- Hybrid approach: less risk

---

## Next Steps

**Tell me:**
1. How many people will use this app?
2. Do they need to access from different computers?
3. Do you have Python support on your web server?
4. What's your priority: speed or features?

Then I'll guide you on the best path forward!
