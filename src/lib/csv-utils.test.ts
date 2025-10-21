/**
 * CSV Utils Tests (Issue #4)
 *
 * Tests for CSV export/import functionality using TDD approach
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportInterviewersCsv,
  exportEventsCsv,
  exportAuditLogsCsv,
  parseCsvFile,
  mapCsvRowsToInterviewers,
  mapCsvRowsToEvents,
  mapCsvRowsToAuditLogs,
} from './csv-utils';
import type { Interviewer, InterviewEvent, AuditLog } from '@/polymet/data/database-service';

describe('CSV Export Functions', () => {
  // Mock DOM APIs
  let mockCreateElement: ReturnType<typeof vi.spyOn>;
  let mockAppendChild: ReturnType<typeof vi.fn>;
  let mockRemoveChild: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClick = vi.fn();
    mockAppendChild = vi.fn();
    mockRemoveChild = vi.fn();

    // Mock URL APIs globally
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue({
      click: mockClick,
      href: '',
      download: '',
    } as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
  });

  describe('exportInterviewersCsv', () => {
    it('should export interviewers to CSV file', async () => {
      const interviewers: Interviewer[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Senior Engineer',
          skills: ['React', 'TypeScript'],
          is_active: true,
          calendar_sync_enabled: false,
          timezone: 'America/Los_Angeles',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      await exportInterviewersCsv(interviewers);

      // Verify download was triggered
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should export empty array without error', async () => {
      await exportInterviewersCsv([]);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle skills array correctly', async () => {
      const interviewers: Interviewer[] = [
        {
          id: '1',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'Tech Lead',
          skills: ['Python', 'Django', 'PostgreSQL'],
          is_active: true,
          calendar_sync_enabled: true,
          timezone: 'America/New_York',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      await exportInterviewersCsv(interviewers);

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('exportEventsCsv', () => {
    it('should export events to CSV file', async () => {
      const events: InterviewEvent[] = [
        {
          id: '1',
          interviewer_email: 'john@example.com',
          candidate_name: 'Alice Johnson',
          start_time: '2024-06-15T10:00:00Z',
          end_time: '2024-06-15T11:00:00Z',
          duration_minutes: 60,
          status: 'pending',
          created_at: '2024-06-01T00:00:00Z',
        },
      ];

      await exportEventsCsv(events);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should export empty events array', async () => {
      await exportEventsCsv([]);

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('exportAuditLogsCsv', () => {
    it('should export audit logs to CSV file', async () => {
      const logs: AuditLog[] = [
        {
          id: '1',
          timestamp: '2024-01-01T00:00:00Z',
          user_name: 'Admin User',
          user_email: 'admin@example.com',
          action: 'CREATE_INTERVIEWER',
          entity_type: 'interviewer',
          entity_id: '1',
          changes: { created: true },
        },
      ];

      await exportAuditLogsCsv(logs);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle complex changes object', async () => {
      const logs: AuditLog[] = [
        {
          id: '1',
          timestamp: '2024-01-01T00:00:00Z',
          user_name: 'Admin User',
          user_email: 'admin@example.com',
          action: 'UPDATE_INTERVIEWER',
          entity_type: 'interviewer',
          entity_id: '1',
          changes: {
            name: { from: 'John', to: 'John Doe' },
            skills: { from: ['React'], to: ['React', 'TypeScript'] },
          },
        },
      ];

      await exportAuditLogsCsv(logs);

      expect(mockClick).toHaveBeenCalled();
    });
  });
});

describe('CSV Import Functions', () => {
  describe('parseCsvFile', () => {
    it('should parse interviewer CSV file', async () => {
      const csvContent = `id,name,email,role,skills,is_active,timezone,calendar_sync_enabled,created_at,updated_at
1,John Doe,john@example.com,Senior Engineer,React; TypeScript,true,America/Los_Angeles,false,2024-01-01T00:00:00Z,2024-01-01T00:00:00Z`;
      const file = {
        text: async () => csvContent,
        name: 'interviewers.csv',
        type: 'text/csv',
      } as File;

      const result = await parseCsvFile(file);

      expect(result.dataset).toBe('interviewers');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('John Doe');
      expect(result.rows[0].email).toBe('john@example.com');
    });

    it('should parse events CSV file', async () => {
      const csvContent = `id,interviewer_email,candidate_name,status,start_time,end_time,created_at
1,john@example.com,Alice Johnson,pending,2024-06-15T10:00:00Z,2024-06-15T11:00:00Z,2024-06-01T00:00:00Z`;
      const file = {
        text: async () => csvContent,
        name: 'events.csv',
        type: 'text/csv',
      } as File;

      const result = await parseCsvFile(file);

      expect(result.dataset).toBe('events');
      expect(result.rows).toHaveLength(1);
    });

    it('should parse audit logs CSV file', async () => {
      const csvContent = `id,timestamp,user_name,user_email,action,entity_type,entity_id,changes
1,2024-01-01T00:00:00Z,Admin User,admin@example.com,CREATE_INTERVIEWER,interviewer,1,"{""created"":true}"`;
      const file = {
        text: async () => csvContent,
        name: 'audit-logs.csv',
        type: 'text/csv',
      } as File;

      const result = await parseCsvFile(file);

      expect(result.dataset).toBe('auditLogs');
      expect(result.rows).toHaveLength(1);
    });

    it('should throw error for malformed CSV', async () => {
      const csvContent = `invalid,csv,without,proper,headers`;
      const file = {
        text: async () => csvContent,
        name: 'invalid.csv',
        type: 'text/csv',
      } as File;

      await expect(parseCsvFile(file)).rejects.toThrow('Unrecognized CSV format');
    });

    it('should throw error for empty CSV', async () => {
      const csvContent = ``;
      const file = {
        text: async () => csvContent,
        name: 'empty.csv',
        type: 'text/csv',
      } as File;

      await expect(parseCsvFile(file)).rejects.toThrow();
    });
  });

  describe('mapCsvRowsToInterviewers', () => {
    it('should map CSV rows to interviewer objects', () => {
      const rows = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Senior Engineer',
          skills: 'React; TypeScript',
          is_active: 'true',
          timezone: 'America/Los_Angeles',
          calendar_sync_enabled: 'false',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const interviewers = mapCsvRowsToInterviewers(rows);

      expect(interviewers).toHaveLength(1);
      expect(interviewers[0].name).toBe('John Doe');
      expect(interviewers[0].email).toBe('john@example.com');
      expect(interviewers[0].skills).toEqual(['React', 'TypeScript']);
      expect(interviewers[0].is_active).toBe(true);
    });

    it('should handle missing fields gracefully', () => {
      const rows = [
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
      ];

      const interviewers = mapCsvRowsToInterviewers(rows);

      expect(interviewers).toHaveLength(1);
      expect(interviewers[0].name).toBe('Jane Smith');
      expect(interviewers[0].role).toBe('viewer');
      expect(interviewers[0].skills).toEqual([]);
      expect(interviewers[0].is_active).toBe(false);
    });

    it('should generate ID if missing', () => {
      const rows = [{ name: 'Test User', email: 'test@example.com' }];

      const interviewers = mapCsvRowsToInterviewers(rows);

      expect(interviewers[0].id).toBeTruthy();
      expect(typeof interviewers[0].id).toBe('string');
    });
  });

  describe('mapCsvRowsToEvents', () => {
    it('should map CSV rows to event objects', () => {
      const rows = [
        {
          id: '1',
          interviewer_email: 'john@example.com',
          candidate_name: 'Alice Johnson',
          status: 'attended',
          start_time: '2024-06-15T10:00:00Z',
          end_time: '2024-06-15T11:00:00Z',
          created_at: '2024-06-01T00:00:00Z',
        },
      ];

      const events = mapCsvRowsToEvents(rows);

      expect(events).toHaveLength(1);
      expect(events[0].interviewer_email).toBe('john@example.com');
      expect(events[0].status).toBe('attended');
    });

    it('should default status to pending for invalid values', () => {
      const rows = [
        {
          interviewer_email: 'john@example.com',
          status: 'invalid-status',
        },
      ];

      const events = mapCsvRowsToEvents(rows);

      expect(events[0].status).toBe('pending');
    });
  });

  describe('mapCsvRowsToAuditLogs', () => {
    it('should map CSV rows to audit log objects', () => {
      const rows = [
        {
          id: '1',
          timestamp: '2024-01-01T00:00:00Z',
          user_name: 'Admin User',
          user_email: 'admin@example.com',
          action: 'CREATE_INTERVIEWER',
          entity_type: 'interviewer',
          entity_id: '1',
          changes: '{"created":true}',
        },
      ];

      const logs = mapCsvRowsToAuditLogs(rows);

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('CREATE_INTERVIEWER');
      expect(logs[0].changes).toEqual({ created: true });
    });

    it('should handle malformed JSON in changes', () => {
      const rows = [
        {
          user_email: 'admin@example.com',
          action: 'TEST',
          entity_type: 'test',
          entity_id: '1',
          changes: 'not-valid-json',
        },
      ];

      const logs = mapCsvRowsToAuditLogs(rows);

      expect(logs[0].changes).toEqual({ raw: 'not-valid-json' });
    });
  });
});
