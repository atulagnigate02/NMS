# NMS Product - Complete Project Flow

## 1. Project Goal

This project is a Network Management System (NMS) product that helps you:

- discover devices on a local or enterprise network
- store device inventory in a database
- monitor device health and metrics
- create alerts and audit events
- show dashboards and reports through a frontend UI

The project is split into three main parts:

1. Frontend UI
2. Backend API service
3. Monitoring / discovery engine

## 1.1 Aasaan Flow (Simple View)

Aap is project ko is tarah samajh sakte ho:

1. Frontend se user login karta hai.
2. Frontend backend ko API request bhejta hai.
3. Backend credentials verify karta hai, device data load karta hai, aur discovery request ko process karta hai.
4. Discovery service subnet me IP / port / SNMP details check karta hai.
5. Backend in results ko `Device` aur `Event` table me save karta hai.
6. Monitoring engine background me metrics, health, alerts, aur topology ka kaam karta hai.
7. Frontend UI dashboard, devices, alerts, aur reports ko dikhata hai.

So the full lifecycle is:

`User -> Frontend -> Backend API -> Database -> Discovery/Monitoring Engine -> UI updates`

---

## 2. Tech Stack Used in This Project

### Backend stack

This repo’s backend is built with the following actual packages and versions from [backend/requirements.txt](backend/requirements.txt):

- FastAPI `0.116.1`
- Uvicorn `0.35.0`
- SQLAlchemy `2.0.41`
- psycopg `3.2.9`
- Pydantic settings `2.10.1`
- email-validator `2.2.0`
- python-jose + cryptography `3.5.0`
- passlib + bcrypt `1.7.4`
- python-multipart `0.0.20`
- cryptography `45.0.5`

### Why these packages are used

- `FastAPI` handles the API layer and route definitions.
- `Uvicorn` runs the FastAPI server.
- `SQLAlchemy` handles ORM models and database access.
- `psycopg` is the PostgreSQL driver.
- `Pydantic` and `pydantic-settings` validate request/response shapes and environment config.
- `python-jose` and `passlib` handle JWT auth and password hashing.

### Frontend stack

The frontend source exists under [frontend/src](frontend/src), but in the current repo snapshot there is no `package.json` or lockfile visible in the workspace root. So the frontend framework/package version is not verifiable from the repository state available right now.

### Discovery / monitoring internals

The discovery logic is not using a special external scanner package. It is executed with Python standard library components inside [backend/services/discovery.py](backend/services/discovery.py):

- `ipaddress` for subnet iteration
- `socket` for TCP and SNMP socket communication
- `subprocess` for ping and ARP commands
- `ThreadPoolExecutor` for concurrent host scanning

This means the discovery mechanism is mostly built-in Python networking and OS command execution rather than a heavy external dependency.

---

## 3. High-Level Architecture

### Frontend
Location: `frontend/src`

This is the web application users interact with. It contains screens and modules for:

- authentication
- dashboard
- devices
- discovery
- topology
- alerts
- reports
- settings
- users / organizations / roles

The frontend talks to the backend API through REST endpoints.

### Backend
Location: `backend/`

This is the main server layer built with FastAPI. It handles:

- authentication and JWT login
- CRUD APIs for devices, sites, users, organizations, roles, events, alerts, reports, etc.
- discovery workflow
- database models and schemas
- audit logging

### Monitoring Engine
Location: `monitoring-engine/`

This part handles device monitoring/background operations such as:

- collectors
- pollers
- event engine
- inventory
- scheduler
- topology
- protocol handlers for SNMP, REST, ICMP, NetFlow, Syslog, SSH, WMI, etc.

This engine is the operational intelligence layer behind continuous monitoring and event generation.

---

## 4. Startup Flow

### Step 1: Start PostgreSQL

Use Docker Compose:

```powershell
docker compose -f docker/docker-compose.postgres.yml up -d
```

### Step 2: Create Python environment

```powershell
py -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
py -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

### Step 3: Seed data

```powershell
py -m backend.seed
```

This seeds demo users, roles, permissions, sites, and demo devices.

### Step 4: Start FastAPI backend

```powershell
py -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: API docs

```text
http://localhost:8000/docs
```

Default login credentials:

```text
admin@gmail.com / admin123
```

---

## 5. Backend Execution Flow

### Request enters through FastAPI

The main app is built in `backend/main.py`.

It creates the FastAPI application, loads routes, and exposes APIs under:

```text
/api/v1
```

### Auth flow

A user logs in using:

- `POST /api/v1/auth/login`

After login, the token is returned and used for protected APIs.

### Database layer

The database layer is created using SQLAlchemy models and sessions in:

- `backend/database/session.py`
- `backend/models/nms.py`

The DB session is used across all CRUD and route handlers.

### Schema layer

Schemas define what the API accepts and returns.

Located in:

- `backend/schemas/nms.py`

This separates:

- request models
- response models
- validation logic

---

## 6. Device Discovery Flow

This is the most important workflow for your current issue.

### Discovery endpoint

The discovery endpoint is:

```text
POST /api/v1/discovery/run
```

### Request payload

The API expects a request body with:

- `network_range`
- `site_id` (optional)
- `ports`
- `scan_icmp`
- `scan_ports`
- `scan_snmp`
- `snmp_community`
- `timeout_ms`
- `max_hosts`

### Discovery service

The real scanning logic lives in:

- `backend/services/discovery.py`

This code performs:

1. IP network iteration
2. ICMP ping checks
3. TCP port probing
4. SNMP query checks
5. device result collection

### What the discovery service returns

It creates a `DiscoveryResult` containing:

- IP address
- alive status
- open ports
- SNMP name
- SNMP description
- MAC address
- hostname (when available)

### How the result becomes a device

The route in `backend/api/router.py` takes the `DiscoveryResult` list and:

- checks whether the IP already exists in the `devices` table
- updates existing device fields if found
- creates a new device row if not found
- saves discovery-related events

So the discovery flow is:

```
network scan -> host detection -> protocol response -> result object -> DB update/insert -> event creation
```

---

## 7. Events and Alerts Flow

### Event table

The event model in `backend/models/nms.py` stores:

- `device_id`
- `event_type`
- `description`
- `timestamp`

### Event types used here

Examples:

- `DISCOVERY_FOUND`
- `DISCOVERY_UPDATED`
- `DISCOVERY_SEEDED`

### Event API

These endpoints return the parsed event stream:

- `GET /api/v1/events`
- `GET /api/v1/events/{id}`

### Alerts flow

When a device or monitoring condition becomes abnormal, alerts are generated and linked to a device.

The alert path is:

- device metric / event trigger
- alert row creation
- notification generation
- dashboard updates

---

## 8. Device Inventory Flow

The data model for inventory is centered on the `Device` model.

A device record includes:

- `hostname`
- `ip_address`
- `mac_address`
- `site_id`
- `vendor_id`
- `device_type_id`
- `serial_number`
- `model`
- `firmware_version`
- `status`
- `monitoring_status`
- `last_seen`

This is the core identity record for all discovered or seeded devices.

---

## 9. Monitoring Engine Flow

The monitoring engine is not the UI. It is the operational engine that keeps the NMS alive.

It contains folders such as:

- `collectors/`
- `pollers/`
- `event-engine/`
- `inventory/`
- `scheduler/`
- `protocols/`
- `workers/`

This is where real network monitoring tasks happen, such as:

- polling SNMP values
- checking rest API endpoints
- collecting metrics
- processing events
- running topology discovery

---

## 10. End-to-End User Flow

A typical user flow in this project looks like this:

1. User logs in to the frontend.
2. Frontend calls backend auth APIs.
3. Backend validates credentials and returns JWT token.
4. User opens dashboard or devices page.
5. User runs discovery against a subnet.
6. Backend scans IPs using ICMP/TCP/SNMP.
7. Backend stores or updates device records.
8. Backend inserts discovery events.
9. Monitoring engine continues collecting metrics and alerts.
10. UI shows dashboard, discovered devices, events, alerts, and reports.

---

## 11. Where the current bug sits

The key discovery flow currently has two distinct layers:

1. collection layer
   - `backend/services/discovery.py`
   - this gathers IP/port/SNMP evidence

2. persistence layer
   - `backend/api/router.py`
   - this converts results into `Device` rows and `Event` rows

The current problem is usually one of these:

- the scan is collecting data, but the event API is only showing raw events
- the event response is not loading the linked `Device` relationship
- the device name is generic because DNS/SNMP/ARP enrichment is not strong enough
- broad subnet scans create many noisy host entries

---

## 12. Practical Guidance

To get better real-device discovery:

- keep the scan range small
- use correct SNMP community string
- enable only the protocol checks you need
- use MAC + hostname enrichment where possible
- prefer targeted network ranges instead of whole subnets

---

## 13. Summary

In one sentence:

The project works in a layered style:

- frontend gets the user interface and dashboard
- backend provides API + database + discovery
- monitoring-engine does long-running operational metrics and event processing

If you understand this flow, you can quickly debug any issue by checking:

- which API route was hit
- which backend service handled it
- which DB table got updated
- which event or alert was created next
