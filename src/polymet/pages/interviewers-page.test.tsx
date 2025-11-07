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

    // Try to delete an interviewer - use getAllByLabelText since there are multiple action buttons
    const actionsButtons = screen.getAllByLabelText('Open actions menu');
    await user.click(actionsButtons[0]);

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

    renderInterviewersPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Try to delete - use getAllByLabelText since there are multiple action buttons
    const actionsButtons = screen.getAllByLabelText('Open actions menu');
    await user.click(actionsButtons[0]);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    // Should show confirm dialog (not native alert)
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
    });

    // Verify native alert was NOT used
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('should use accessible AlertDialog component instead of confirm()', async () => {
    const user = userEvent.setup();
    renderInterviewersPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // This test documents the expected behavior
    // It will fail initially because AlertDialog is not implemented yet
    const actionsButtons = screen.getAllByLabelText('Open actions menu');
    await user.click(actionsButtons[0]);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

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
    const submitButton = screen.getByRole('button', { name: /add interviewer/i });
    await user.click(submitButton);

    // Wait for the form dialog to close (submission completed)
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /add new interviewer/i })).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // Wait a bit for the success alert to appear
    await waitFor(() => {
      const successMessage = screen.queryByText(/interviewer.*added successfully/i);
      expect(successMessage).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should show success message after updating an interviewer', async () => {
    const user = userEvent.setup();

    renderInterviewersPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open actions menu and click Edit - use getAllByLabelText since there are multiple action buttons
    const actionsButtons = screen.getAllByLabelText('Open actions menu');
    await user.click(actionsButtons[0]);

    const editButton = screen.getByText('Edit Details');
    await user.click(editButton);

    // Modify the interviewer
    const nameInput = await screen.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'John Updated');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    // Wait for the form dialog to close
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /edit interviewer/i })).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/interviewer.*updated successfully/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should show success message after deleting an interviewer', async () => {
    const user = userEvent.setup();

    renderInterviewersPage();

    // Wait for any interviewer to load (might be "John Doe" or "John Updated" depending on previous tests)
    await waitFor(() => {
      const interviewers = screen.getAllByLabelText('Open actions menu');
      expect(interviewers.length).toBeGreaterThan(0);
    });

    // Open actions menu for the second interviewer (to avoid conflict with update test)
    const actionsButtons = screen.getAllByLabelText('Open actions menu');
    await user.click(actionsButtons[1] || actionsButtons[0]);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = await screen.findByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    // Wait for confirm dialog to close
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog', { name: /confirm deletion/i })).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/interviewer.*deleted successfully/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should show success message after toggling interviewer active status', async () => {
    const user = userEvent.setup();

    renderInterviewersPage();

    // Wait for interviewers to load
    await waitFor(() => {
      const interviewers = screen.getAllByLabelText('Open actions menu');
      expect(interviewers.length).toBeGreaterThan(0);
    });

    // Find the toggle active button in dropdown (use last interviewer to avoid conflicts)
    const actionsButtons = screen.getAllByLabelText('Open actions menu');
    const lastButton = actionsButtons[actionsButtons.length - 1];
    await user.click(lastButton);

    const toggleButton = screen.getByText(/activate|deactivate/i);
    await user.click(toggleButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/status.*updated successfully/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
