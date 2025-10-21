import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { InterviewersPage } from './interviewers-page';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/polymet/data/auth-context';

// Mock CSV utils (these are still external dependencies to mock)
vi.mock('@/lib/csv-utils', () => ({
  exportInterviewersCsv: vi.fn(),
  exportEventsCsv: vi.fn(),
  exportAuditLogsCsv: vi.fn(),
}));

const renderInterviewersPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <InterviewersPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Issue #21: Browser alert() and confirm() usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage for auth
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
      JSON.stringify({
        name: 'Admin User',
        email: 'admin@example.com',
        picture: 'https://example.com/pic.jpg',
        role: 'admin',
      })
    );
  });

  it('should NOT use native confirm() for delete confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');

    renderInterviewersPage();

    // Wait for interviewers to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Try to delete an interviewer
    const actionsButton = screen.getByLabelText('Open actions menu');
    await user.click(actionsButton);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    // This test SHOULD FAIL because the code currently uses window.confirm
    expect(confirmSpy).not.toHaveBeenCalled();

    // Instead, we should see an accessible AlertDialog
    // This assertion will also fail initially
    expect(screen.queryByRole('alertdialog')).toBeInTheDocument();
  });

  it('should NOT use native alert() for error messages', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert');

    // Mock delete to fail
    const { db } = await import('@/polymet/data/database-service');
    vi.mocked(db.deleteInterviewer).mockRejectedValueOnce(new Error('Delete failed'));

    renderInterviewersPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Try to delete (will fail)
    const actionsButton = screen.getByLabelText('Open actions menu');
    await user.click(actionsButton);

    const deleteButton = screen.getByText('Delete');

    // Mock confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(deleteButton);

    await waitFor(() => {
      // This test should now pass because the code uses ErrorAlert dialog
      expect(alertSpy).not.toHaveBeenCalled();
    });

    // Instead, we should see an accessible error alert dialog
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeInTheDocument();
    });
  });

  it('should use accessible AlertDialog component instead of confirm()', async () => {
    renderInterviewersPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // This test documents the expected behavior
    // It will fail initially because AlertDialog is not implemented yet
    const actionsButton = screen.getByLabelText('Open actions menu');
    await userEvent.setup().click(actionsButton);

    const deleteButton = screen.getByText('Delete');
    await userEvent.setup().click(deleteButton);

    // Should show AlertDialog with proper ARIA attributes
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeInTheDocument();

    // Should have accessible title and description
    expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    // Should have Cancel and Confirm buttons
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});

describe('Issue #40: Success notifications after mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage for auth as admin
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
      JSON.stringify({
        name: 'Admin User',
        email: 'admin@example.com',
        picture: 'https://example.com/pic.jpg',
        role: 'admin',
      })
    );
  });

  it('should show success message after creating an interviewer', async () => {
    const user = userEvent.setup();

    renderInterviewersPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click Add Interviewer button
    const addButton = screen.getByRole('button', { name: /add interviewer/i });
    await user.click(addButton);

    // Fill in the form (assuming the dialog opens)
    // Note: This test will fail until we implement success notification
    const nameInput = await screen.findByLabelText(/name/i);
    await user.type(nameInput, 'Jane Smith');

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'jane@example.com');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save|submit/i });
    await user.click(submitButton);

    // Should show success alert
    await waitFor(() => {
      const successDialog = screen.queryByRole('alertdialog');
      expect(successDialog).toBeInTheDocument();
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByText(/interviewer.*created|added successfully/i)).toBeInTheDocument();
    });
  });

  it('should show success message after updating an interviewer', async () => {
    const user = userEvent.setup();

    renderInterviewersPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open actions menu and click Edit
    const actionsButton = screen.getByLabelText('Open actions menu');
    await user.click(actionsButton);

    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    // Modify the interviewer
    const nameInput = await screen.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'John Updated');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save|submit/i });
    await user.click(submitButton);

    // Should show success alert
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByText(/interviewer.*updated successfully/i)).toBeInTheDocument();
    });
  });

  it('should show success message after deleting an interviewer', async () => {
    const user = userEvent.setup();

    renderInterviewersPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open actions menu and click Delete
    const actionsButton = screen.getByLabelText('Open actions menu');
    await user.click(actionsButton);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = await screen.findByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    // Should show success alert
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByText(/interviewer.*deleted successfully/i)).toBeInTheDocument();
    });
  });

  it('should show success message after toggling interviewer active status', async () => {
    const user = userEvent.setup();

    renderInterviewersPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find the active toggle switch/button
    const toggleButton = screen.getByLabelText(/toggle active status/i);
    await user.click(toggleButton);

    // Should show success alert
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByText(/status.*updated successfully/i)).toBeInTheDocument();
    });
  });
});
