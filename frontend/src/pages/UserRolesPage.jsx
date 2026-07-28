import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Plus, Save, Trash2, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Loader } from '@/components/ui/Loader'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { extractErrorMessage } from '@/lib/axios'
import { api } from '@/services/api'

const emptyUserForm = {
  name: '',
  email: '',
  password: '',
  role_id: '',
  status: 'active',
}

export function UserRolesPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') ?? 'users'
  const isRoleForm = view === 'create-role' || view === 'edit-role'

  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userMode, setUserMode] = useState('create')
  const [editingUserId, setEditingUserId] = useState(null)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [roleName, setRoleName] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([])

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => api.listUsers() })
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: () => api.listRoles() })
  const permissionsQuery = useQuery({ queryKey: ['permissions'], queryFn: () => api.listPermissions() })

  const users = usersQuery.data ?? []
  const roles = rolesQuery.data ?? []
  const permissions = permissionsQuery.data ?? []
  const isLoading = usersQuery.isLoading || rolesQuery.isLoading || permissionsQuery.isLoading
  const fetchError = usersQuery.error || rolesQuery.error || permissionsQuery.error

  const rolePermissionQueries = useQueries({
    queries: roles.map((role) => ({
      queryKey: ['role-permissions', role.id],
      queryFn: () => api.getRolePermissions(role.id),
      enabled: view === 'roles' && roles.length > 0,
    })),
  })

  const rolePermissionsById = useMemo(() => {
    return roles.reduce((map, role, index) => {
      map[role.id] = rolePermissionQueries[index]?.data?.permissions ?? []
      return map
    }, {})
  }, [roles, rolePermissionQueries])

  const editingRolePermissionsQuery = useQuery({
    queryKey: ['role-permissions', editingRoleId],
    queryFn: () => api.getRolePermissions(editingRoleId),
    enabled: view === 'edit-role' && Boolean(editingRoleId),
  })

  const roleOptions = [
    { value: '', label: 'No role' },
    ...roles.map((role) => ({ value: role.id, label: role.role_name })),
  ]

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase()
    return users.filter((user) => {
      const roleNameForUser = roles.find((role) => role.id === user.role_id)?.role_name ?? ''
      const matchesRole = roleFilter === 'all' || String(user.role_id ?? '') === roleFilter
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        roleNameForUser.toLowerCase().includes(query)
      return matchesRole && matchesSearch
    })
  }, [roleFilter, roles, userSearch, users])

  const permissionsByModule = useMemo(() => {
    return permissions.reduce((groups, permission) => {
      const moduleName = permission.module || 'General'
      groups[moduleName] = groups[moduleName] ?? []
      groups[moduleName].push(permission)
      return groups
    }, {})
  }, [permissions])

  useEffect(() => {
    if (view === 'create-user') openCreateUser()
    if (view === 'create-role') {
      setEditingRoleId(null)
      setRoleName('')
      setSelectedPermissionIds([])
    }
  }, [view])

  useEffect(() => {
    if (view !== 'edit-role' || !editingRoleId) return
    const role = roles.find((item) => item.id === editingRoleId)
    setRoleName(role?.role_name ?? '')
  }, [editingRoleId, roles, view])

  useEffect(() => {
    if (view !== 'edit-role') return
    const assigned = editingRolePermissionsQuery.data?.permissions ?? []
    setSelectedPermissionIds(assigned.map((permission) => permission.id))
  }, [editingRolePermissionsQuery.data, view])

  const setView = (nextView) => setSearchParams({ view: nextView })

  const resetFeedback = () => {
    setMessage(null)
    setError(null)
  }

  const openCreateUser = () => {
    resetFeedback()
    setUserMode('create')
    setEditingUserId(null)
    setUserForm(emptyUserForm)
    setUserModalOpen(true)
  }

  const openEditUser = (user) => {
    resetFeedback()
    setUserMode('edit')
    setEditingUserId(user.id)
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role_id: user.role_id ?? '',
      status: user.status,
    })
    setUserModalOpen(true)
  }

  const editRole = (role) => {
    resetFeedback()
    setEditingRoleId(role.id)
    setRoleName(role.role_name)
    setSelectedPermissionIds((rolePermissionsById[role.id] ?? []).map((permission) => permission.id))
    setView('edit-role')
  }

  const togglePermission = (permissionId) => {
    setSelectedPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    )
  }

  const userMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        role_id: userForm.role_id ? Number(userForm.role_id) : null,
        status: userForm.status,
      }
      if (userForm.password.trim()) payload.password = userForm.password
      if (userMode === 'create') return api.createUser({ ...payload, password: userForm.password })
      return api.updateUser(editingUserId, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      setMessage(userMode === 'create' ? 'User created successfully' : 'User updated successfully')
      setUserModalOpen(false)
      setView('users')
      setError(null)
    },
    onError: (err) => setError(extractErrorMessage(err, 'Unable to save user')),
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id) => api.deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      setMessage('User deleted successfully')
      setError(null)
    },
    onError: (err) => setError(extractErrorMessage(err, 'Unable to delete user')),
  })

  const roleMutation = useMutation({
    mutationFn: async () => {
      if (view === 'create-role') {
        const created = await api.createRole({ role_name: roleName.trim() })
        await api.assignRolePermissions(created.id, selectedPermissionIds)
        return created
      }
      const updated = await api.updateRole(editingRoleId, { role_name: roleName.trim() })
      await api.assignRolePermissions(editingRoleId, selectedPermissionIds)
      return updated
    },
    onSuccess: (role) => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      void queryClient.invalidateQueries({ queryKey: ['role-permissions', role.id] })
      setMessage(view === 'create-role' ? 'Role created successfully' : 'Role updated successfully')
      setView('roles')
      setError(null)
    },
    onError: (err) => setError(extractErrorMessage(err, 'Unable to save role')),
  })

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => api.deleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      setMessage('Role deleted successfully')
      setError(null)
    },
    onError: (err) => setError(extractErrorMessage(err, 'Unable to delete role')),
  })

  const roleNameFor = (roleId) => roles.find((role) => role.id === roleId)?.role_name ?? '-'

  const retryAll = () => {
    void usersQuery.refetch()
    void rolesQuery.refetch()
    void permissionsQuery.refetch()
  }

  if (isLoading) return <Loader label="Loading users, roles, and permissions..." />
  if (fetchError) return <ErrorState message={fetchError.message} onRetry={retryAll} />

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>User Management</h1>
          <p>Manage user list, role list, create/edit records, and permission checkboxes.</p>
        </div>
        <div className="form-row">
          <Button variant={view === 'users' ? 'primary' : 'secondary'} onClick={() => setView('users')}>
            Users List
          </Button>
          <Button variant={view === 'roles' ? 'primary' : 'secondary'} onClick={() => setView('roles')}>
            Roles List
          </Button>
        </div>
      </section>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      {view === 'users' && (
        <section className="card management-card">
          <div className="management-head">
            <h2>Users List</h2>
            <Button icon={<Plus size={16} />} onClick={openCreateUser}>
              Add User
            </Button>
          </div>
          <div className="filter-bar">
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, email, role"
            />
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[{ value: 'all', label: 'All Roles' }, ...roles.map((role) => ({ value: String(role.id), label: role.role_name }))]}
            />
            <Button variant="secondary" onClick={() => { setUserSearch(''); setRoleFilter('all') }}>
              Reset
            </Button>
          </div>
          <div className="table-wrap">
            <table className="table management-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>{user.name}</td>
                    <td>{roleNameFor(user.role_id)}</td>
                    <td><StatusBadge status={user.status} /></td>
                    <td>{user.email}</td>
                    <td>
                      <div className="table-actions">
                        <Button size="sm" variant="secondary" icon={<Edit size={14} />} onClick={() => openEditUser(user)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<Trash2 size={14} />}
                          onClick={() => window.confirm(`Delete ${user.name}?`) && deleteUserMutation.mutate(user.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view === 'roles' && (
        <section className="card management-card">
          <div className="management-head">
            <h2>Roles List</h2>
            <Button icon={<Plus size={16} />} onClick={() => setView('create-role')}>
              Add Role
            </Button>
          </div>
          <div className="table-wrap">
            <table className="table management-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Role Name</th>
                  <th>Permissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role, index) => (
                  <tr key={role.id}>
                    <td>{index + 1}</td>
                    <td><strong>{role.role_name}</strong></td>
                    <td>
                      <div className="permission-chip-wrap">
                        {(rolePermissionsById[role.id] ?? []).slice(0, 12).map((permission) => (
                          <span key={permission.id} className="permission-chip">{permission.name || permission.code}</span>
                        ))}
                        {(rolePermissionsById[role.id] ?? []).length > 12 && (
                          <span className="permission-chip muted-chip">+{rolePermissionsById[role.id].length - 12} more</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Button size="sm" variant="secondary" icon={<Edit size={14} />} onClick={() => editRole(role)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<Trash2 size={14} />}
                          onClick={() => window.confirm(`Delete role ${role.role_name}?`) && deleteRoleMutation.mutate(role.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isRoleForm && (
        <section className="card management-card">
          <div className="management-head">
            <h2>{view === 'create-role' ? 'Create Role' : 'Edit Role'}</h2>
            <Button variant="ghost" icon={<X size={16} />} onClick={() => setView('roles')}>
              Cancel
            </Button>
          </div>
          <Input label="Role Name" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="operator" />
          <h3 className="section-label">Permissions</h3>
          {editingRolePermissionsQuery.isLoading ? (
            <Loader label="Loading role permissions..." />
          ) : (
            <div className="permission-module-grid">
              {Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => (
                <section key={moduleName} className="permission-module">
                  <header>{moduleName}</header>
                  <div>
                    {modulePermissions.map((permission) => (
                      <label key={permission.id} className="inline-check">
                        <input
                          type="checkbox"
                          checked={selectedPermissionIds.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                        />
                        <span>{permission.name || permission.code}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
          <Button
            icon={<Save size={16} />}
            loading={roleMutation.isPending}
            disabled={!roleName.trim()}
            onClick={() => roleMutation.mutate()}
          >
            {view === 'create-role' ? 'Create Role' : 'Update Role'}
          </Button>
        </section>
      )}

      <Modal
        open={userModalOpen}
        title={userMode === 'create' ? 'Create User' : 'Edit User'}
        onClose={() => { setUserModalOpen(false); if (view === 'create-user') setView('users') }}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setUserModalOpen(false); if (view === 'create-user') setView('users') }}>
              Cancel
            </Button>
            <Button loading={userMutation.isPending} disabled={!userForm.name.trim() || !userForm.email.trim() || (userMode === 'create' && !userForm.password.trim())} onClick={() => userMutation.mutate()}>
              {userMode === 'create' ? 'Create' : 'Update'}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <Input label="Name" value={userForm.name} onChange={(e) => setUserForm((form) => ({ ...form, name: e.target.value }))} />
          <Input label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm((form) => ({ ...form, email: e.target.value }))} />
          <Input
            label={userMode === 'create' ? 'Password' : 'Password'}
            type="password"
            value={userForm.password}
            hint={userMode === 'edit' ? 'Leave blank to keep old password' : undefined}
            onChange={(e) => setUserForm((form) => ({ ...form, password: e.target.value }))}
          />
          <Select label="Role" value={userForm.role_id} onChange={(e) => setUserForm((form) => ({ ...form, role_id: e.target.value }))} options={roleOptions} />
          <Select
            label="Status"
            value={userForm.status}
            onChange={(e) => setUserForm((form) => ({ ...form, status: e.target.value }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'blocked', label: 'Blocked' },
            ]}
          />
        </div>
      </Modal>
    </div>
  )
}
