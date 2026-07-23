# NMS Product

Network Management System product workspace.

## Backend Quick Start

Start PostgreSQL:

```powershell
docker compose -f docker/docker-compose.postgres.yml up -d
```

Install and run the backend:

```powershell
py -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
py -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
py -m backend.seed
py -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open API docs:

```text
http://localhost:8000/docs
```

Seeded admin:

```text
admin@gmail.com / admin123
```
