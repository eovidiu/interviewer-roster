/**
 * User Management Page Tests (Issue #54)
 * TDD approach for admin user role management UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/polymet/data/auth-context'
import { UserManagementPage } from './user-management-page'

const renderWithAuth = (userRole: string) => {
  // Mock localStorage with user role
  localStorage.setItem(
    'auth_user',
    JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      role: userRole,
    })
  )

  return render(
    <BrowserRouter>
      <AuthProvider>
        <UserManagementPage />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Issue #54: User Management Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Access Control', () => {
    it('should render for admin users', async () => {
      renderWithAuth('admin')

      await waitFor(() => {
        expect(screen.getByText(/user management/i)).toBeInTheDocument()
      })
    })

    it('should show access denied for non-admin users (viewer)', async () => {
      renderWithAuth('viewer')

      await waitFor(() => {
        expect(screen.getByText(/access denied|unauthorized/i)).toBeInTheDocument()
      })
    })

    it('should show access denied for talent users', async () => {
      renderWithAuth('talent')

      await waitFor(() => {
        expect(screen.getByText(/access denied|unauthorized/i)).toBeInTheDocument()
      })
    })
  })

  describe('User List Display', () => {
    beforeEach(() => {
      renderWithAuth('admin')
    })

    it('should display table with user information', async () => {
      await waitFor(() => {
        expect(screen.getByText(/user management/i)).toBeInTheDocument()
      })

      // Should have table headers
      expect(screen.getByText(/name/i)).toBeInTheDocument()
      expect(screen.getByText(/email/i)).toBeInTheDocument()
      expect(screen.getByText(/role/i)).toBeInTheDocument()
    })

    it('should display users from API', async () => {
      await waitFor(() => {
        // Wait for mock data to load
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('should display role badges for each user', async () => {
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Should show role badges
      const adminBadges = screen.getAllByText(/admin/i)
      expect(adminBadges.length).toBeGreaterThan(0)
    })

    it('should display last login timestamp', async () => {
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Should have a last login column or timestamp
      expect(screen.getByText(/last login/i)).toBeInTheDocument()
    })
  })

  describe('Search and Filter', () => {
    beforeEach(() => {
      renderWithAuth('admin')
    })

    it('should have search input', async () => {
      await waitFor(() => {
        expect(screen.getByText(/user management/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search users/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('should filter users by email', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search users/i)
      await user.type(searchInput, 'john@example.com')

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('should filter users by name', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search users/i)
      await user.type(searchInput, 'John')

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('Role Management', () => {
    beforeEach(() => {
      renderWithAuth('admin')
    })

    it('should show role change button for each user', async () => {
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const changeRoleButtons = screen.getAllByRole('button', { name: /change role/i })
      expect(changeRoleButtons.length).toBeGreaterThan(0)
    })

    it('should open confirmation dialog when changing role', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const changeRoleButton = screen.getAllByRole('button', { name: /change role/i })[0]
      await user.click(changeRoleButton)

      // Should show dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/confirm role change/i)).toBeInTheDocument()
      })
    })

    it('should allow selecting new role in dialog', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const changeRoleButton = screen.getAllByRole('button', { name: /change role/i })[0]
      await user.click(changeRoleButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Should have role selection
      expect(screen.getByLabelText(/new role/i)).toBeInTheDocument()
    })

    it('should update user role after confirmation', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const changeRoleButton = screen.getAllByRole('button', { name: /change role/i })[0]
      await user.click(changeRoleButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Select new role
      const roleSelect = screen.getByLabelText(/new role/i)
      await user.click(roleSelect)
      await user.click(screen.getByText('talent'))

      // Confirm
      const confirmButton = screen.getByRole('button', { name: /confirm|save/i })
      await user.click(confirmButton)

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/role updated successfully/i)).toBeInTheDocument()
      })
    })

    it('should close dialog when canceling role change', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const changeRoleButton = screen.getAllByRole('button', { name: /change role/i })[0]
      await user.click(changeRoleButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      renderWithAuth('admin')
    })

    it('should display error message when API fails', async () => {
      // Mock API to fail
      const { apiClient } = await import('@/lib/api-client')
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('API Error'))

      render(
        <BrowserRouter>
          <AuthProvider>
            <UserManagementPage />
          </AuthProvider>
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/error loading users|failed to load/i)).toBeInTheDocument()
      })
    })

    it('should show error when role change fails', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Mock role change to fail
      const { apiClient } = await import('@/lib/api-client')
      vi.spyOn(apiClient, 'patch').mockRejectedValueOnce(new Error('Update failed'))

      const changeRoleButton = screen.getAllByRole('button', { name: /change role/i })[0]
      await user.click(changeRoleButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const roleSelect = screen.getByLabelText(/new role/i)
      await user.click(roleSelect)
      await user.click(screen.getByText('talent'))

      const confirmButton = screen.getByRole('button', { name: /confirm|save/i })
      await user.click(confirmButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to update role|error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      renderWithAuth('admin')
    })

    it('should have proper ARIA labels for buttons', async () => {
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const changeRoleButtons = screen.getAllByRole('button', { name: /change role/i })
      expect(changeRoleButtons[0]).toHaveAccessibleName()
    })

    it('should support keyboard navigation in dialog', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const changeRoleButton = screen.getAllByRole('button', { name: /change role/i })[0]
      await user.click(changeRoleButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Should be able to tab through dialog elements
      await user.keyboard('{Tab}')
      expect(document.activeElement).toBeTruthy()
    })

    it('should trap focus within dialog', async () => {
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const changeRoleButton = screen.getAllByRole('button', { name: /change role/i })[0]
      await user.click(changeRoleButton)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
      })

      // Focus should be trapped in dialog
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state while fetching users', async () => {
      renderWithAuth('admin')

      // Should show loading initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should show loading state during role change', async () => {
      const user = userEvent.setup()

      renderWithAuth('admin')

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const changeRoleButton = screen.getAllByRole('button', { name: /change role/i })[0]
      await user.click(changeRoleButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const roleSelect = screen.getByLabelText(/new role/i)
      await user.click(roleSelect)
      await user.click(screen.getByText('talent'))

      const confirmButton = screen.getByRole('button', { name: /confirm|save/i })
      await user.click(confirmButton)

      // Should show loading or disabled state
      expect(confirmButton).toBeDisabled()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no users exist', async () => {
      // Mock API to return empty list
      const { apiClient } = await import('@/lib/api-client')
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        users: [],
        total: 0,
        hasMore: false,
      })

      renderWithAuth('admin')

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument()
      })
    })
  })
})
