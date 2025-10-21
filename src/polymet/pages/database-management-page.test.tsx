/**
 * Database Management Page Tests (Issue #13)
 *
 * Tests for CSV format guidance in the import flow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/polymet/data/auth-context';
import { DatabaseManagementPage } from './database-management-page';

describe('Issue #13: CSV Format Guidance in Import Flow', () => {
  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AuthProvider>{component}</AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      })
    );
  });

  it('should show Import Data button', async () => {
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });
  });

  it('should open CSV guide dialog when Import Data is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    // Dialog should open with title
    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });
  });

  it('should display CSV schema for all three datasets', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check that all three dataset guides are shown
    expect(screen.getByText('Interviewers CSV')).toBeInTheDocument();
    expect(screen.getByText('Interview Events CSV')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs CSV')).toBeInTheDocument();
  });

  it('should show required columns for interviewers', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check for required interviewer columns
    const nameElements = screen.getAllByText(/name \(required\)/);
    expect(nameElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/email \(required, must be unique\)/)).toBeInTheDocument();
  });

  it('should show required columns for events', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check for required event columns
    expect(
      screen.getByText(/interviewer_email \(required, must reference an existing interviewer\)/)
    ).toBeInTheDocument();
    expect(screen.getByText(/start_time \(required, ISO timestamp\)/)).toBeInTheDocument();
  });

  it('should show required columns for audit logs', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check for required audit log columns
    expect(screen.getByText(/timestamp \(required, ISO timestamp\)/)).toBeInTheDocument();
    expect(screen.getByText(/user_name \(required\)/)).toBeInTheDocument();
    expect(screen.getByText(/action \(required, e.g. CREATE_INTERVIEWER\)/)).toBeInTheDocument();
  });

  it('should show sample rows for each dataset', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check for "Sample row" sections
    const sampleHeaders = screen.getAllByText('Sample row');
    expect(sampleHeaders.length).toBeGreaterThanOrEqual(3);
  });

  it('should have a Select File button in the dialog', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check for Select File button
    expect(screen.getByText('Select File')).toBeInTheDocument();
  });

  it('should have a Cancel button to close the dialog', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check for Cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();

    // Click cancel and verify dialog closes
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Import CSV Guide')).not.toBeInTheDocument();
    });
  });

  it('should show description for each dataset type', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check for dataset descriptions
    expect(
      screen.getByText(/Seeds roster data including roles, skills, and availability flags/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Imports scheduled interviews, attendance status, and metadata/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Replays audit history with optional change payloads for compliance/)
    ).toBeInTheDocument();
  });

  it('should provide download sample buttons for each dataset', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check for "Download sample" links (should be 3 - one for each dataset)
    const downloadLinks = screen.getAllByText('Download sample');
    expect(downloadLinks.length).toBe(3);
  });

  it('should explain accepted values in column descriptions', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check for role values explanation
    expect(screen.getByText(/role \(viewer \| talent \| admin\)/)).toBeInTheDocument();

    // Check for status values explanation
    expect(
      screen.getByText(/status \(pending \| attended \| ghosted \| cancelled\)/)
    ).toBeInTheDocument();
  });

  it('should show tip about CSV vs JSON imports', async () => {
    const user = userEvent.setup();
    renderWithAuth(<DatabaseManagementPage />);

    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Data');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    const importButtons = screen.getAllByText('Import Data');
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Import CSV Guide')).toBeInTheDocument();
    });

    // Check for helpful tip
    expect(
      screen.getByText(/Tip: CSV imports merge by email or id/)
    ).toBeInTheDocument();
  });
});
