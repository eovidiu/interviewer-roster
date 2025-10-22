/**
 * User Management Page (Issue #54)
 * Admin-only page for managing user roles
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/polymet/data/auth-context'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon, CheckCircleIcon, UsersIcon } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'viewer' | 'talent' | 'admin'
  picture?: string | null
  last_login_at?: string | null
  created_at: string
}

interface UsersResponse {
  users: User[]
  total: number
  hasMore: boolean
}

export function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<'viewer' | 'talent' | 'admin'>('viewer')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<UsersResponse>('/users')
      setUsers(response.users)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Error loading users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setIsDialogOpen(true)
    setUpdateError(null)
    setSuccessMessage(null)
  }

  const handleConfirmRoleChange = async () => {
    if (!selectedUser) return

    try {
      setUpdating(true)
      setUpdateError(null)

      await apiClient.patch(`/users/${selectedUser.email}/role`, {
        role: newRole,
      })

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.email === selectedUser.email ? { ...u, role: newRole } : u
        )
      )

      setSuccessMessage(`Role updated successfully for ${selectedUser.name}`)
      setIsDialogOpen(false)
      setSelectedUser(null)
    } catch (err) {
      console.error('Error updating role:', err)
      setUpdateError('Failed to update role. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelRoleChange = () => {
    setIsDialogOpen(false)
    setSelectedUser(null)
    setUpdateError(null)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'talent':
        return 'default'
      case 'viewer':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const formatLastLogin = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. Admin access is required.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <UsersIcon className="h-8 w-8" />
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-4" variant="default">
          <CheckCircleIcon className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="mb-4" variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users by name or email..."
          className="w-full px-4 py-2 border rounded-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search users"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No users found matching your search.' : 'No users found.'}
          </p>
        </div>
      )}

      {/* Users Table */}
      {!loading && filteredUsers.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Last Login</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatLastLogin(user.last_login_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRoleChange(user)}
                      aria-label={`Change role for ${user.name}`}
                    >
                      Change Role
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Change Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>

          {updateError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{updateError}</AlertDescription>
            </Alert>
          )}

          <div className="py-4">
            <Label htmlFor="new-role">New Role</Label>
            <Select
              value={newRole}
              onValueChange={(value) => setNewRole(value as 'viewer' | 'talent' | 'admin')}
            >
              <SelectTrigger id="new-role" aria-label="New role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="talent">Talent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelRoleChange}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRoleChange}
              disabled={updating || newRole === selectedUser?.role}
            >
              {updating ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
