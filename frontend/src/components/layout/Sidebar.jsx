import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Building,
  Building2,
  ChevronDown,
  Cpu,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Menu,
  Network,
  Radar,
  Shield,
  Users,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useHealthCheck } from '@/hooks/useHealthCheck'
import { useAppSelector } from '@/hooks/useStore'
import { hasPermission } from '@/lib/permissions'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:read' },
  { to: '/monitoring', label: 'Device Monitoring', icon: Activity, permission: 'devices:read' },
  { to: '/devices', label: 'Devices', icon: Network, permission: 'devices:read' },
  { to: '/discovery', label: 'Discovery', icon: Radar, permission: 'discovery:run' },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle, permission: 'alerts:read' },
  { to: '/reports', label: 'Reports', icon: FileText, permission: 'reports:read' },
  { to: '/audit-logs', label: 'Audit Logs', icon: ListChecks, permission: 'audit_logs:read' },
]

const configItems = [
  { to: '/organizations', label: 'Organizations', icon: Building2, permission: 'organizations:read' },
  { to: '/sites', label: 'Sites', icon: MapPin, permission: 'sites:read' },
  { to: '/vendors', label: 'Vendors', icon: Building, permission: 'vendors:read' },
  { to: '/device-types', label: 'Device Types', icon: Cpu, permission: 'device_types:read' },
  { to: '/thresholds', label: 'Thresholds', icon: Gauge, permission: 'thresholds:read' },
]

const userRoleItems = [
  { to: '/users-roles?view=users', label: 'Users List', icon: Users, permission: 'users:read' },
  { to: '/users-roles?view=roles', label: 'Roles List', icon: ListChecks, permission: 'roles:read' },
]

export function Sidebar({ onLogout, isCollapsed, setIsCollapsed }) {
  const location = useLocation()
  const { data: health, isError } = useHealthCheck()
  const isHealthy = !isError && health?.status === 'ok'
  const currentPath = `${location.pathname}${location.search}`
  const [isUserRoleOpen, setIsUserRoleOpen] = useState(currentPath.startsWith('/users-roles'))
  const permissions = useAppSelector((state) => state.auth.permissions)

  console.log("Sidebar permissions:", permissions)

  const filterNavItems = (items) => {
    const filtered = items.filter(item => !item.permission || hasPermission(permissions, item.permission))
    console.log("Filtered items:", filtered)
    return filtered
  }

  const filteredNavItems = filterNavItems(navItems)
  const filteredConfigItems = filterNavItems(configItems)
  const filteredUserRoleItems = filterNavItems(userRoleItems)
  const showUserRoleSection = filteredUserRoleItems.length > 0

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        className="collapse-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Menu size={20} />
      </button>
      <div className="sidebar-header">
        <img 
          src="/agnigate_logo.png" 
          alt="Agnigate Logo" 
          className="sidebar-logo"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
        <div className="sidebar-logo-fallback">
          <div className="brand-badge">
            <Activity size={22} />
          </div>
          <div>
            <div className="brand">NMS Command</div>
            <p className="brand-subtitle">Enterprise Network Ops</p>
          </div>
        </div>
      </div>

      <nav className="nav-menu" aria-label="Main navigation">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={18} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}

        {showUserRoleSection && (
          <div className="nav-group">
            <button 
              className={`nav-link ${currentPath.startsWith('/users-roles') ? 'active' : ''}`}
              onClick={() => setIsUserRoleOpen(!isUserRoleOpen)}
              title={isCollapsed ? "Users & Roles" : ''}
            >
              <Shield size={18} />
              {!isCollapsed && <span>Users & Roles</span>}
              {!isCollapsed && <ChevronDown size={16} className={`nav-chevron ${isUserRoleOpen ? 'nav-chevron-open' : ''}`} />}
            </button>
            {isUserRoleOpen && !isCollapsed && (
              <div className="nav-submenu">
                {filteredUserRoleItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.to
                  return (
                    <NavLink key={item.to} to={item.to} className={`nav-sublink ${isActive ? 'active' : ''}`} title={item.label}>
                      <Icon size={15} />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {filteredConfigItems.length > 0 && (
          <>
            <div className="nav-divider"></div>
            {!isCollapsed && <div className="nav-section-label">Configuration</div>}

            {filteredConfigItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              )
            })}
          </>
        )}
      </nav>

    </aside>
  )
}
