# NMS Product

Network Management System product workspace.

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker Desktop (for PostgreSQL)

## Quick Start

### 1. Start PostgreSQL

```powershell
docker compose -f docker/docker-compose.postgres.yml up -d
```

### 2. Backend

```powershell
py -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
py -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
py -m backend.seed
py -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

Health check: http://localhost:8000/api/v1/health

### 3. Frontend (new terminal)

```powershell
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

### Demo login

```text
admin@gmail.com / admin123
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Database connection failed | Run `docker compose -f docker/docker-compose.postgres.yml up -d` |
| Invalid credentials | Run `py -m backend.seed` from project root |
| Frontend network errors | Ensure backend is running on port 8000 |
| Module not found (Python) | Activate venv and reinstall requirements |





cd C:\Users\dell\Downloads\NMS-PRODUCT
.\backend\.venv\Scripts\Activate.ps1
py -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000