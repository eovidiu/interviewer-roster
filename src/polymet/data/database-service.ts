/**
 * Database Service for Interview Roster App
 *
 * This service provides a clean API for database operations using localStorage
 * Simulates SQLite behavior with in-memory operations and localStorage persistence
 * For production, this can be replaced with a backend API or real SQLite
 */

import {
  generateId,
  getCurrentTimestamp,
} from "@/polymet/data/database-schema";

// Types for application use
export interface Interviewer {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  is_active: boolean;
  calendar_sync_enabled: boolean;
  timezone?: string;
  calendar_sync_consent_at?: string | null;
  last_synced_at?: string | null;
  created_by?: string;
  modified_at?: string;
  modified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewEvent {
  id: string;
  interviewer_email: string;
  calendar_event_id?: string | null;
  start_time: string;
  end_time: string;
  skills_assessed?: string[] | null;
  candidate_name?: string;
  position?: string;
  scheduled_date?: string;
  duration_minutes?: number;
  status: "pending" | "attended" | "ghosted" | "cancelled";
  notes: string | null;
  marked_by?: string | null;
  marked_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, any>;
  timestamp: string;
}

interface DatabaseStorage {
  interviewers: Interviewer[];
  events: InterviewEvent[];
  auditLogs: AuditLog[];
}

class DatabaseService {
  private storageKey = "interview_roster_db";
  private initialized = false;

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if database exists in localStorage
      const existing = localStorage.getItem(this.storageKey);

      if (!existing) {
        // Create empty database (don't auto-seed)
        // User can manually import mock data if needed
        const emptyDb: DatabaseStorage = {
          interviewers: [],
          events: [],
          auditLogs: [],
        };
        this.saveDatabase(emptyDb);
        console.log("✅ Database initialized with empty state");
      } else {
        console.log("✅ Database loaded from localStorage");
      }

      this.initialized = true;
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw error;
    }
  }

  /**
   * Get database from localStorage
   */
  private getDatabase(): DatabaseStorage {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      return { interviewers: [], events: [], auditLogs: [] };
    }
    return JSON.parse(data);
  }

  /**
   * Save database to localStorage
   */
  private saveDatabase(db: DatabaseStorage): void {
    localStorage.setItem(this.storageKey, JSON.stringify(db));
  }

  /**
   * Seed initial data (from mock data)
   */
  private async seedInitialData(): Promise<void> {
    // Import mock data
    const { mockInterviewers } = await import(
      "@/polymet/data/mock-interviewers-data"
    );
    const { mockInterviewEvents } = await import(
      "@/polymet/data/mock-interview-events-data"
    );

    const db: DatabaseStorage = {
      interviewers: mockInterviewers.map((i) => ({
        ...i,
        created_at: i.created_at || getCurrentTimestamp(),
        updated_at: i.modified_at || getCurrentTimestamp(),
      })),
      events: mockInterviewEvents.map((e) => ({
        ...e,
        created_at: e.created_at || getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      })),
      auditLogs: [],
    };

    this.saveDatabase(db);
    console.log("✅ Initial data seeded with", {
      interviewers: db.interviewers.length,
      events: db.events.length,
    });
  }

  // ==================== INTERVIEWER OPERATIONS ====================

  /**
   * Get all interviewers
   */
  async getInterviewers(): Promise<Interviewer[]> {
    const db = this.getDatabase();
    return db.interviewers.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get interviewer by email
   */
  async getInterviewerByEmail(email: string): Promise<Interviewer | null> {
    const db = this.getDatabase();
    return db.interviewers.find((i) => i.email === email) || null;
  }

  /**
   * Create a new interviewer
   */
  async createInterviewer(data: Partial<Interviewer>): Promise<Interviewer> {
    const db = this.getDatabase();
    const now = getCurrentTimestamp();

    const interviewer: Interviewer = {
      id: data.id || generateId(),
      name: data.name!,
      email: data.email!,
      role: data.role!,
      skills: data.skills || [],
      is_active: data.is_active ?? true,
      calendar_sync_enabled: data.calendar_sync_enabled ?? false,
      created_at: data.created_at || now,
      updated_at: now,
    };

    db.interviewers.push(interviewer);
    this.saveDatabase(db);
    return interviewer;
  }

  /**
   * Update an interviewer
   */
  async updateInterviewer(
    email: string,
    data: Partial<Interviewer>
  ): Promise<Interviewer> {
    const db = this.getDatabase();
    const index = db.interviewers.findIndex((i) => i.email === email);

    if (index === -1) {
      throw new Error(`Interviewer with email ${email} not found`);
    }

    db.interviewers[index] = {
      ...db.interviewers[index],
      ...data,
      email, // Ensure email doesn't change
      updated_at: getCurrentTimestamp(),
    };

    this.saveDatabase(db);
    return db.interviewers[index];
  }

  /**
   * Delete an interviewer
   */
  async deleteInterviewer(email: string): Promise<void> {
    const db = this.getDatabase();
    db.interviewers = db.interviewers.filter((i) => i.email !== email);
    // Also delete related events
    db.events = db.events.filter((e) => e.interviewer_email !== email);
    this.saveDatabase(db);
  }

  // ==================== INTERVIEW EVENT OPERATIONS ====================

  /**
   * Get all interview events
   */
  async getInterviewEvents(): Promise<InterviewEvent[]> {
    const db = this.getDatabase();
    return db.events.sort(
      (a, b) =>
        new Date(b.start_time || b.scheduled_date || 0).getTime() -
        new Date(a.start_time || a.scheduled_date || 0).getTime()
    );
  }

  /**
   * Get events by interviewer email
   */
  async getInterviewEventsByInterviewer(
    email: string
  ): Promise<InterviewEvent[]> {
    const db = this.getDatabase();
    return db.events
      .filter((e) => e.interviewer_email === email)
      .sort(
        (a, b) =>
          new Date(b.start_time || b.scheduled_date || 0).getTime() -
          new Date(a.start_time || a.scheduled_date || 0).getTime()
      );
  }

  /**
   * Create a new interview event
   */
  async createInterviewEvent(
    data: Partial<InterviewEvent>
  ): Promise<InterviewEvent> {
    const db = this.getDatabase();
    const now = getCurrentTimestamp();

    const event: InterviewEvent = {
      id: data.id || generateId(),
      interviewer_email: data.interviewer_email!,
      calendar_event_id: data.calendar_event_id || null,
      start_time: data.start_time || data.scheduled_date!,
      end_time: data.end_time || data.scheduled_date!,
      skills_assessed: data.skills_assessed || null,
      candidate_name: data.candidate_name,
      position: data.position,
      scheduled_date: data.scheduled_date,
      duration_minutes: data.duration_minutes,
      status: data.status || "pending",
      notes: data.notes || null,
      marked_by: data.marked_by || null,
      marked_at: data.marked_at || null,
      created_at: data.created_at || now,
      updated_at: now,
    };

    db.events.push(event);
    this.saveDatabase(db);
    return event;
  }

  /**
   * Update an interview event
   */
  async updateInterviewEvent(
    id: string,
    data: Partial<InterviewEvent>
  ): Promise<InterviewEvent> {
    const db = this.getDatabase();
    const index = db.events.findIndex((e) => e.id === id);

    if (index === -1) {
      throw new Error(`Event with id ${id} not found`);
    }

    db.events[index] = {
      ...db.events[index],
      ...data,
      id, // Ensure id doesn't change
      updated_at: getCurrentTimestamp(),
    };

    this.saveDatabase(db);
    return db.events[index];
  }

  /**
   * Delete an interview event
   */
  async deleteInterviewEvent(id: string): Promise<void> {
    const db = this.getDatabase();
    db.events = db.events.filter((e) => e.id !== id);
    this.saveDatabase(db);
  }

  // ==================== AUDIT LOG OPERATIONS ====================

  /**
   * Create an audit log entry
   */
  async createAuditLog(
    data: Omit<AuditLog, "id" | "timestamp">
  ): Promise<void> {
    const db = this.getDatabase();

    const log: AuditLog = {
      id: generateId(),
      ...data,
      timestamp: getCurrentTimestamp(),
    };

    db.auditLogs.push(log);
    this.saveDatabase(db);
  }

  /**
   * Get all audit logs
   */
  async getAuditLogs(): Promise<AuditLog[]> {
    const db = this.getDatabase();
    return db.auditLogs
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 100);
  }

  // ==================== UTILITY OPERATIONS ====================

  /**
   * Reset database to mock data
   */
  async resetDatabase(): Promise<void> {
    // Clear the database
    localStorage.removeItem(this.storageKey);
    this.initialized = false;

    // Reinitialize with fresh mock data
    await this.seedInitialData();
    this.initialized = true;

    console.log("✅ Database reset successfully");
  }

  /**
   * Clear database completely (empty state)
   */
  async clearDatabase(): Promise<void> {
    // Create empty database
    const emptyDb: DatabaseStorage = {
      interviewers: [],
      events: [],
      auditLogs: [],
    };

    this.saveDatabase(emptyDb);
    console.log("✅ Database cleared successfully - all data removed");
  }

  /**
   * Export database as JSON
   */
  async exportData(): Promise<{
    interviewers: Interviewer[];
    events: InterviewEvent[];
    auditLogs: AuditLog[];
  }> {
    return {
      interviewers: await this.getInterviewers(),
      events: await this.getInterviewEvents(),
      auditLogs: await this.getAuditLogs(),
    };
  }

  /**
   * Import data from JSON backup
   * This will merge with existing data (no duplicates by email/id)
   */
  async importData(data: {
    interviewers?: Interviewer[];
    events?: InterviewEvent[];
    auditLogs?: AuditLog[];
  }): Promise<{
    imported: { interviewers: number; events: number; auditLogs: number };
    skipped: { interviewers: number; events: number; auditLogs: number };
  }> {
    const db = this.getDatabase();
    const result = {
      imported: { interviewers: 0, events: 0, auditLogs: 0 },
      skipped: { interviewers: 0, events: 0, auditLogs: 0 },
    };

    // Import interviewers (skip duplicates by email)
    if (data.interviewers) {
      for (const interviewer of data.interviewers) {
        const exists = db.interviewers.find(
          (i) => i.email === interviewer.email
        );
        if (!exists) {
          db.interviewers.push({
            ...interviewer,
            updated_at: getCurrentTimestamp(),
          });
          result.imported.interviewers++;
        } else {
          result.skipped.interviewers++;
        }
      }
    }

    // Import events (skip duplicates by id)
    if (data.events) {
      for (const event of data.events) {
        const exists = db.events.find((e) => e.id === event.id);
        if (!exists) {
          db.events.push({
            ...event,
            updated_at: getCurrentTimestamp(),
          });
          result.imported.events++;
        } else {
          result.skipped.events++;
        }
      }
    }

    // Import audit logs (skip duplicates by id)
    if (data.auditLogs) {
      for (const log of data.auditLogs) {
        const exists = db.auditLogs.find((l) => l.id === log.id);
        if (!exists) {
          db.auditLogs.push(log);
          result.imported.auditLogs++;
        } else {
          result.skipped.auditLogs++;
        }
      }
    }

    this.saveDatabase(db);
    return result;
  }

  /**
   * Import mock data from static file
   * This will clear existing data and load fresh mock data
   */
  async importMockData(): Promise<void> {
    try {
      console.log("Starting mock data import...");

      // Import mock data
      const { mockInterviewers } = await import(
        "@/polymet/data/mock-interviewers-data"
      );
      const { mockInterviewEvents } = await import(
        "@/polymet/data/mock-interview-events-data"
      );

      console.log("Mock data loaded:", {
        interviewers: mockInterviewers.length,
        events: mockInterviewEvents.length,
      });

      // Create fresh database with mock data
      const db: DatabaseStorage = {
        interviewers: mockInterviewers.map((i) => ({
          ...i,
          created_at: i.created_at || getCurrentTimestamp(),
          updated_at: i.modified_at || getCurrentTimestamp(),
        })),
        events: mockInterviewEvents.map((e) => ({
          ...e,
          created_at: e.created_at || getCurrentTimestamp(),
          updated_at: getCurrentTimestamp(),
        })),
        auditLogs: [],
      };

      // Save to localStorage
      this.saveDatabase(db);

      console.log("✅ Mock data imported successfully:", {
        interviewers: db.interviewers.length,
        events: db.events.length,
      });
    } catch (error) {
      console.error("❌ Failed to import mock data:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();

// Auto-initialize on import
db.initialize().catch(console.error);
