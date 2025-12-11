## SPM Prototype Testing Guide

### 1. Start mock chart backend (port 8001)
```bash
uvicorn mock_chart:app --reload --port 8001
```

### 2. Serve the static UI assets (port 8000)
```bash
python3 -m http.server 8000
```

### 3. Open the new UI
Navigate to `http://127.0.0.1:8000/spm.html`.

- The page fetches chart data from the mock API (`http://127.0.0.1:8001/chart_data`).
- Click “Process Run” to trigger another fetch; the chart/table update automatically.

> Once the real FastAPI backend is ready, update `CHART_API_BASE` inside `spm.html` to the actual server URL and skip the mock server.
