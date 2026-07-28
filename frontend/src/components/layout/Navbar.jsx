import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, ChevronDown, LogOut, Moon, Sun, UserCircle } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { useAppDispatch, useAppSelector } from '@/hooks/useStore'
import { api } from '@/services/api'
import { toggleTheme } from '@/store/themeSlice'

export function Navbar({ title, breadcrumbs = [], onLogout }) {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.theme.mode)
  const storedUser = useAppSelector((state) => state.auth)
  const [profileOpen, setProfileOpen] = useState(false)
  const { data: profile } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: () => api.getCurrentUser(),
  })

  const user = profile ?? storedUser
  const displayName = user?.name || user?.email || 'Admin'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const crumbs = breadcrumbs.length > 0 ? breadcrumbs : [{ label: 'Operations Console' }, { label: title }]

  return (
    <header className="topbar">
      <div>
        <Breadcrumb items={crumbs} />
        <h2 className="topbar-title">{title}</h2>
      </div>

      <div className="topbar-actions">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Toggle theme"
          onClick={() => dispatch(toggleTheme())}
          icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        />
        <Button variant="ghost" size="sm" aria-label="Notifications" icon={<Bell size={16} />} />

        <div className="profile-menu">
          <button className="profile-trigger" type="button" onClick={() => setProfileOpen((open) => !open)}>
            <span className="avatar">{initials || <UserCircle size={18} />}</span>
            <span className="profile-name">{displayName}</span>
            <ChevronDown size={16} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-card-head">
                <span className="avatar avatar-lg">{initials || 'AD'}</span>
                <div>
                  <strong>{displayName}</strong>
                  <small>{user?.email || 'admin@nms.local'}</small>
                </div>
              </div>
              <div className="profile-meta">
                <span>Role</span>
                <strong>{user?.role || (user?.role_id ? `Role #${user.role_id}` : 'Admin')}</strong>
              </div>
              <button className="profile-action" type="button" onClick={() => setProfileOpen(false)}>
                <UserCircle size={16} />
                Profile
              </button>
              <button className="profile-action danger" type="button" onClick={onLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
