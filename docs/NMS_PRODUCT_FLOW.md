# Network Management System (NMS) Product Flow Document

## 1. Product Overview

The Network Management System (NMS) is a centralized platform for monitoring, discovering, managing, and troubleshooting network infrastructure across enterprise environments. It supports routers, switches, firewalls, access points, servers, UPS systems, storage devices, CCTV devices, and IoT devices.

### Core Objectives
- Real-time monitoring
- Automated device discovery
- Fault and event management
- Alert and notification management
- Performance monitoring
- Network topology visualization
- User
- Report gene and role managementration
- Audit logging and compliance tracking

---

## 2. High-Level Product Flow

```text
User Login
    |
    V
Dashboard Access
    |
    V
Add Network
    |
    V
Device Discovery Engine
    |
    V
Detect Supported Devices
    |
    V
Save Device Information
    |
    V
Monitoring Engine
    |
    V
-------------------------------------------
|                  |                    |
SNMP Polling      ICMP Ping          API Polling
|                  |                    |
-------------------------------------------
    |
    V
Collect Metrics
    |
    V
Data Processing
    |
    V
Threshold Validation
    |
    V
Alert Engine
    |
    V
Notification Services
    |
    V
Email / SMS / WhatsApp / Dashboard
    |
    V
Historical Data Storage
    |
    V
Analytics Engine
    |
    V
Reports
    |
    V
Users
```

---

## 3. Product Modules

### 3.1 Authentication Module

Features:
- Login
- Logout
- JWT authentication
- Multi-user support
- Role-based access control (RBAC)
- Session management

### 3.2 Device Discovery Module

Flow:

```text
Network Scan
    |
    V
IP Detection
    |
    V
Device Detection
    |
    V
Vendor Identification
    |
    V
Protocol Identification
    |
    V
Credential Validation
    |
    V
Device Registration
```

Supported protocols:
- SNMP
- ICMP
- SSH
- API
- Telnet (optional)
- NetFlow
- Syslog

### 3.3 Device Management Module

Stores the following information:
- Hostname
- IP address
- MAC address
- Device type
- Vendor
- Location
- Model number
- Firmware version
- Status
- Protocol
- Credentials

Actions:
- Add device
- Edit device
- Delete device
- Enable monitoring
- Disable monitoring

### 3.4 Monitoring Engine

#### Availability Monitoring

```text
Ping Status
    |
    V
UP / DOWN
```

#### Performance Monitoring
- CPU usage
- Memory usage
- Disk usage
- Temperature
- Voltage
- Fan status

#### Network Monitoring
- Bandwidth usage
- Packet loss
- Latency
- Throughput
- Jitter
- Errors

#### Interface Monitoring
- Port status
- Port speed
- Traffic
- Errors
- Interface utilization

### 3.5 Event Management Module

Generated events may include:
- Device Down
- Device Up
- High CPU
- High Memory
- High Temperature
- Packet Loss
- Authentication Failure
- Interface Down

Each event stores:
- Timestamp
- Severity
- Source
- Description
- Status
- Acknowledgement

### 3.6 Alert Management Module

Severity levels:
- Critical
- High
- Medium
- Low
- Info

Workflow:

```text
Threshold Crossed
    |
    V
Generate Alert
    |
    V
Send Notification
    |
    V
Store Alert
    |
    V
User Acknowledges
    |
    V
Resolve Alert
```

### 3.7 Notification Module

Supported channels:
- Email
- SMS
- WhatsApp
- Telegram
- WebSocket notification
- Mobile push notification

### 3.8 Dashboard Module

Dashboard components:
- Total devices
- Online devices
- Offline devices
- Alerts
- CPU usage
- Bandwidth usage
- Network health
- Recent events
- Topology view

### 3.9 Historical Monitoring Module

Stores:
- CPU
- Memory
- Bandwidth
- Temperature
- Traffic
- Latency
- Packet loss

Supports:
- Hourly data
- Daily data
- Weekly data
- Monthly reports

### 3.10 Report Module

Reports include:
- Availability report
- Bandwidth report
- Alert report
- Downtime report
- Health report
- Inventory report

---

## 4. Product Workflow

### Step 1
Admin login

### Step 2
Create organization

### Step 3
Create site

### Step 4
Add network range

Example:
- 192.168.1.1/24

### Step 5
Run discovery

### Step 6
Identify devices

### Step 7
Configure credentials

### Step 8
Start monitoring

### Step 9
Store metrics

### Step 10
Generate alerts

### Step 11
Notify users

### Step 12
Generate reports

---

## 5. Database Design

PostgreSQL is recommended as the primary relational database, with TimescaleDB or InfluxDB recommended for time-series metrics storage.

### 5.1 Main Tables

- users
- roles
- organizations
- sites
- devices
- device_credentials
- device_types
- vendors
- interfaces
- device_metrics
- alerts
- events
- notifications
- monitoring_jobs
- reports
- thresholds
- audit_logs

### 5.2 Schema Summary

#### Users
- id
- uuid
- name
- email
- password
- role_id
- status
- created_at

#### Roles
- id
- role_name

Examples:
- Super Admin
- Admin
- Operator
- Viewer

#### Organizations
- id
- name
- description
- created_at

#### Sites
- id
- organization_id
- name
- city
- state
- latitude
- longitude

#### Vendors
- id
- vendor_name

Examples:
- Cisco
- Fortinet
- Juniper
- HP
- Dell
- Mikrotik
- Sophos
- Palo Alto

#### Device Types
- id
- name

Examples:
- Router
- Switch
- Firewall
- Server
- UPS
- Storage
- Access Point

#### Devices
- id
- site_id
- hostname
- ip_address
- mac_address
- vendor_id
- device_type_id
- serial_number
- model
- firmware_version
- status
- monitoring_status
- last_seen
- created_at

#### Device Credentials
- id
- device_id
- snmp_version
- community_string
- username
- password
- ssh_port
- api_token

> Passwords and credentials must be encrypted before storage.

#### Interfaces
- id
- device_id
- interface_name
- status
- speed
- traffic_in
- traffic_out
- packet_errors
- last_updated

#### Monitoring Jobs
- id
- device_id
- monitor_type
- interval
- status

Examples:
- Ping
- SNMP Polling
- API Polling
- SSH Monitoring

#### Device Metrics
For time-series data:
- id
- device_id
- cpu_usage
- memory_usage
- disk_usage
- temperature
- latency
- packet_loss
- bandwidth_usage
- created_at

Recommended storage:
- TimescaleDB
- InfluxDB

#### Thresholds
- id
- device_type_id
- metric_name
- warning_value
- critical_value

Example:
- CPU > 80% warning
- CPU > 90% critical

#### Alerts
- id
- device_id
- severity
- title
- description
- status
- acknowledged_by
- resolved_at
- created_at

#### Events
- id
- device_id
- event_type
- description
- timestamp

Examples:
- DEVICE_DOWN
- CPU_HIGH
- LINK_DOWN
- AUTH_FAILURE
- MEMORY_HIGH

#### Notifications
- id
- alert_id
- channel
- sent_to
- status
- sent_at

#### Reports
- id
- report_name
- report_type
- generated_by
- file_path
- generated_at

#### Audit Logs
- id
- user_id
- action
- resource_name
- timestamp

Examples:
- Login
- Add Device
- Delete Device
- Resolve Alert
- Change Threshold

---

## 6. Relationship Diagram

```text
Organizations
    |
    V
Sites
    |
    V
Devices
    |
    V
--------------------------------------
|       |         |        |        |
Interfaces  Metrics Alerts Events Credentials
    |
    V
Notifications

Users
    |
    V
Roles

Devices
    |
    V
Thresholds
    |
    V
Monitoring Jobs
```

---

## 7. Recommended Architecture

| Component | Technology |
| --- | --- |
| Frontend | React |
| Backend API | FastAPI |
| Monitoring Service | Python |
| Database | PostgreSQL |
| Time Series DB | TimescaleDB |
| Message Queue | Redis |
| Notification Service | Celery |
| Real-Time Updates | WebSockets |
| Containerization | Docker |
| Reverse Proxy | Nginx |
| Deployment | Ubuntu Server |
| Logging | ELK Stack |
| Metrics Visualization | Grafana |

### Suggested Microservices

```text
Authentication Service
    |
    V
Device Discovery Service
    |
    V
Monitoring Service
    |
    V
Alert Service
    |
    V
Notification Service
    |
    V
Reporting Service
    |
    V
Dashboard Service
    |
    V
Topology Service
```

This architecture is designed to scale horizontally across thousands of devices while keeping monitoring, alerting, and reporting services loosely coupled.
