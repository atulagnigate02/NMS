export type DashboardSummary = {
  total_devices: number
  online_devices: number
  offline_devices: number
  active_alerts: number
  critical_alerts: number
  recent_events: number
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

export type RoleSummary = {
  id: number
  role_name: string
}

export type PermissionSummary = {
  id: number
  code: string
  name: string
  module: string
  action: string
  description?: string | null
}

export type UserSummary = {
  id: number
  uuid: string
  name: string
  email: string
  role_id: number | null
  status: string
  created_at: string
}

export type DeviceRecord = {
  id: number
  site_id: number | null
  hostname: string
  ip_address: string
  mac_address?: string | null
  vendor_id?: number | null
  device_type_id?: number | null
  serial_number?: string | null
  model?: string | null
  firmware_version?: string | null
  status: string
  monitoring_status: boolean
  last_seen?: string | null
  created_at: string
}

export type AlertRecord = {
  id: number
  device_id: number | null
  severity: string
  title: string
  description?: string | null
  status: string
  acknowledged_by?: number | null
  resolved_at?: string | null
  created_at: string
}

export type ReportRecord = {
  id: number
  report_name: string
  report_type: string
  generated_by?: number | null
  file_path?: string | null
  generated_at: string
}

export type EventRecord = {
  id: number
  device_id: number | null
  event_type: string
  description?: string | null
  timestamp: string
  device?: DeviceRecord | null
}

export type SiteRecord = {
  id: number
  site_name: string
  location?: string | null
  organization_id?: number | null
}

export type DiscoveryPayload = {
  network_range: string
  site_id?: number | null
  ports?: number[]
  scan_icmp?: boolean
  scan_ports?: boolean
  scan_snmp?: boolean
  snmp_community?: string
  timeout_ms?: number
  max_hosts?: number
}

export type HealthResponse = {
  status: string
  database: string
}

export type ApiError = {
  detail?: string | { msg: string }[]
  message?: string
}
