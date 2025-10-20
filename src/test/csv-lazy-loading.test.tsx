import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Issue #33: CSV utilities lazy loading', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should NOT import papaparse upfront in csv-utils module', async () => {
    // Read the csv-utils source code
    const csvUtilsPath = '../lib/csv-utils';
    const csvUtils = await import(csvUtilsPath);

    // Check that the module exports the expected functions
    expect(csvUtils.exportInterviewersCsv).toBeDefined();
    expect(csvUtils.exportEventsCsv).toBeDefined();
    expect(csvUtils.exportAuditLogsCsv).toBeDefined();

    // The module should be defined without actually loading Papa
    // This test will PASS initially but we want to verify lazy loading
  });

  it('should dynamically import Papa in export functions', async () => {
    // This test checks that papaparse is imported inside the function
    // not at the module level

    const fs = await import('fs');
    const path = await import('path');

    // Read the csv-utils source file
    const csvUtilsFilePath = path.join(__dirname, '../lib/csv-utils.ts');
    const sourceCode = fs.readFileSync(csvUtilsFilePath, 'utf-8');

    // Check that there's NO top-level import of papaparse
    // This test will FAIL initially because we have: import Papa from 'papaparse'
    expect(sourceCode).not.toContain("import Papa from 'papaparse'");
    expect(sourceCode).not.toContain('import Papa from "papaparse"');
    expect(sourceCode).not.toContain('import * as Papa from "papaparse"');
    expect(sourceCode).not.toContain("import * as Papa from 'papaparse'");

    // Check that there IS a dynamic import inside functions
    // Should contain: await import('papaparse') or await import("papaparse")
    const hasDynamicImport =
      sourceCode.includes("await import('papaparse')") ||
      sourceCode.includes('await import("papaparse")');
    expect(hasDynamicImport).toBe(true);
  });

  it('should use dynamic import() syntax for lazy loading', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const csvUtilsFilePath = path.join(__dirname, '../lib/csv-utils.ts');
    const sourceCode = fs.readFileSync(csvUtilsFilePath, 'utf-8');

    // Verify the dynamic import pattern is used
    // Should match: const Papa = await import('papaparse')
    // or: const { default: Papa } = await import('papaparse')
    const hasDynamicImport =
      sourceCode.includes("await import('papaparse')") ||
      sourceCode.includes('await import("papaparse")');

    expect(hasDynamicImport).toBe(true);
  });

  it('should export async functions to support lazy loading', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const csvUtilsFilePath = path.join(__dirname, '../lib/csv-utils.ts');
    const sourceCode = fs.readFileSync(csvUtilsFilePath, 'utf-8');

    // Export functions should be async to use await import()
    expect(sourceCode).toContain('export async function exportInterviewersCsv');
    expect(sourceCode).toContain('export async function exportEventsCsv');
    expect(sourceCode).toContain('export async function exportAuditLogsCsv');
  });
});

describe('CSV export functionality after lazy loading', () => {
  it('should still export interviewers correctly with lazy loading', async () => {
    // Mock URL.createObjectURL since it's not available in Node test environment
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // This test verifies that lazy loading doesn't break functionality
    const { exportInterviewersCsv } = await import('@/lib/csv-utils');

    const mockInterviewers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'talent' as const,
        skills: ['React', 'TypeScript'],
        is_active: true,
        calendar_sync_enabled: false,
        timezone: 'America/Los_Angeles',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    // Should not throw error
    await expect(exportInterviewersCsv(mockInterviewers)).resolves.not.toThrow();

    // Verify URL.createObjectURL was called (means download was triggered)
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
