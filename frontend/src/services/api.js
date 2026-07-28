import { http } from '@/lib/axios'
import { setAccessToken } from '@/lib/auth'

export const api = {
  getHealth: () => http.get('/health').then((r) => r.data),

  login: async (email, password) => {
    const data = await http.post('/auth/login', { email, password }).then((r) => r.data)
    setAccessToken(data.access_token)
    return data
  },

  getCurrentUser: () => http.get('/auth/me').then((r) => r.data),
  getDashboardSummary: () => http.get('/dashboard/summary').then((r) => r.data),

  listRoles: () => http.get('/roles').then((r) => r.data),
  createRole: (payload) => http.post('/roles', payload).then((r) => r.data),
  updateRole: (id, payload) => http.patch(`/roles/${id}`, payload).then((r) => r.data),
  deleteRole: (id) => http.delete(`/roles/${id}`),
  getRolePermissions: (id) => http.get(`/roles/${id}/permissions`).then((r) => r.data),
  assignRolePermissions: (id, permissionIds) =>
    http.put(`/roles/${id}/permissions`, { permission_ids: permissionIds }).then((r) => r.data),
  addRolePermission: (roleId, permissionId) =>
    http.post(`/roles/${roleId}/permissions/${permissionId}`).then((r) => r.data),
  removeRolePermission: (roleId, permissionId) =>
    http.delete(`/roles/${roleId}/permissions/${permissionId}`).then((r) => r.data),

  listUsers: () => http.get('/users').then((r) => r.data),
  createUser: (payload) => http.post('/users', payload).then((r) => r.data),
  updateUser: (id, payload) => http.patch(`/users/${id}`, payload).then((r) => r.data),
  deleteUser: (id) => http.delete(`/users/${id}`),
  listPermissions: () => http.get('/permissions').then((r) => r.data),
  assignUserRole: (userId, roleId) =>
    http.post(`/users/${userId}/role`, { role_id: roleId }).then((r) => r.data),

  listDevices: () => http.get('/devices').then((r) => r.data),
  createDevice: (payload) => http.post('/devices', payload).then((r) => r.data),
  updateDevice: (id, payload) => http.patch(`/devices/${id}`, payload).then((r) => r.data),
  deleteDevice: (id) => http.delete(`/devices/${id}`),

  listAlerts: (statusFilter) =>
    http.get('/alerts', { params: statusFilter ? { status_filter: statusFilter } : undefined }).then((r) => r.data),
  acknowledgeAlert: (id) => http.post(`/alerts/${id}/acknowledge`, {}).then((r) => r.data),
  resolveAlert: (id) => http.post(`/alerts/${id}/resolve`, {}).then((r) => r.data),

  listReports: () => http.get('/reports').then((r) => r.data),
  runDiscovery: (payload) => http.post('/discovery/run', payload).then((r) => r.data),

  // Organizations
  getOrganizations: () => http.get('/organizations').then((r) => r.data),
  createOrganization: (payload) => http.post('/organizations', payload).then((r) => r.data),
  updateOrganization: (id, payload) => http.patch(`/organizations/${id}`, payload).then((r) => r.data),
  deleteOrganization: (id) => http.delete(`/organizations/${id}`),

  // Sites
  getSites: () => http.get('/sites').then((r) => r.data),
  createSite: (payload) => http.post('/sites', payload).then((r) => r.data),
  updateSite: (id, payload) => http.patch(`/sites/${id}`, payload).then((r) => r.data),
  deleteSite: (id) => http.delete(`/sites/${id}`),

  // Vendors
  getVendors: () => http.get('/vendors').then((r) => r.data),
  createVendor: (payload) => http.post('/vendors', payload).then((r) => r.data),
  updateVendor: (id, payload) => http.patch(`/vendors/${id}`, payload).then((r) => r.data),
  deleteVendor: (id) => http.delete(`/vendors/${id}`),

  // Device Types
  getDeviceTypes: () => http.get('/device-types').then((r) => r.data),
  createDeviceType: (payload) => http.post('/device-types', payload).then((r) => r.data),
  updateDeviceType: (id, payload) => http.patch(`/device-types/${id}`, payload).then((r) => r.data),
  deleteDeviceType: (id) => http.delete(`/device-types/${id}`),

  // Thresholds
  getThresholds: () => http.get('/thresholds').then((r) => r.data),
  createThreshold: (payload) => http.post('/thresholds', payload).then((r) => r.data),
  updateThreshold: (id, payload) => http.patch(`/thresholds/${id}`, payload).then((r) => r.data),
  deleteThreshold: (id) => http.delete(`/thresholds/${id}`),

  // Audit Logs
  getAuditLogs: () => http.get('/audit-logs').then((r) => r.data),
}
