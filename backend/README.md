# NMS Backend

FastAPI backend for the Network Management System with PostgreSQL persistence.

## Setup

```powershell
py -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
py -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

Edit `.env` and set:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/nms_product
SECRET_KEY=change-this-secret-key
```

Create the PostgreSQL database:

```sql
CREATE DATABASE nms_product;
```

## Run

```powershell
py -m backend.seed
py -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger docs:

```text
http://localhost:8000/docs
```

Default seeded login:

```text
admin@gmail.com / admin123
```

## Main API Groups

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `roles`, `users`, `organizations`, `sites`
- `vendors`, `device-types`, `devices`, `device-credentials`
- `interfaces`, `monitoring-jobs`, `device-metrics`, `thresholds`
- `alerts`, `events`, `notifications`, `reports`, `audit-logs`
- `GET /api/v1/dashboard/summary`
- `POST /api/v1/discovery/run`
