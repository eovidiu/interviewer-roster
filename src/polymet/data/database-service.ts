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
  changes: Record<string, unknown>;
  timestamp: string;
}

interface DatabaseStorage {
  interviewers: Interviewer[];
  events: InterviewEvent[];
  auditLogs: AuditLog[];
  meta?: DatabaseMeta;
}

export interface AuditContext {
  userEmail: string;
  userName: string;
}

type DatabaseSeedState = "seeded" | "cleared" | "custom";

interface DatabaseMeta {
  seedState: DatabaseSeedState;
  lastSeededAt?: string;
  lastUpdatedAt: string;
}

class DatabaseService {
  private storageKey = "interview_roster_db";
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  private defaultAuditContext: AuditContext = {
    userEmail: "system@interviewer-roster.local",
    userName: "System Automation",
  };

  private resolveAuditContext(context?: AuditContext): AuditContext {
    if (context?.userEmail && context?.userName) {
      return context;
    }
    return this.defaultAuditContext;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    await this.initialize();
  }

  private withUpdatedMeta(
    db: DatabaseStorage,
    override?: Partial<DatabaseMeta>
  ): DatabaseStorage {
    const now = getCurrentTimestamp();

    const interviewers = Array.isArray(db.interviewers)
      ? db.interviewers
      : [];
    const events = Array.isArray(db.events) ? db.events : [];
    const auditLogs = Array.isArray(db.auditLogs) ? db.auditLogs : [];

    const hasData =
      interviewers.length > 0 || events.length > 0 || auditLogs.length > 0;

    const previous: DatabaseMeta = db.meta ?? {
      seedState: hasData ? "custom" : "cleared",
      lastUpdatedAt: now,
    };

    let seedState =
      override?.seedState ?? previous.seedState ?? (hasData ? "custom" : "cleared");

    if (seedState === "cleared" && hasData) {
      seedState = "custom";
    }

    let lastSeededAt = previous.lastSeededAt;
    if (override?.lastSeededAt) {
      lastSeededAt = override.lastSeededAt;
    } else if (seedState === "seeded" && !lastSeededAt) {
      lastSeededAt = now;
    }

    const meta: DatabaseMeta = {
      seedState,
      lastUpdatedAt: override?.lastUpdatedAt ?? now,
      ...(lastSeededAt ? { lastSeededAt } : {}),
    };

    return {
      ...db,
      interviewers,
      events,
      auditLogs,
      meta,
    };
  }

  private buildChangeSet<T extends Record<string, unknown>>(
    previous: T,
    updates: Partial<T>
  ) {
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value !== undefined &&
        (previous as Record<string, unknown>)[key] !== value
      ) {
        diff[key] = {
          from: (previous as Record<string, unknown>)[key],
          to: value,
        };
      }
    });
    return diff;
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    this.initializationPromise = (async () => {
      try {
        const existingRaw = localStorage.getItem(this.storageKey);

        if (!existingRaw) {
          await this.seedInitialData();
        } else {
          let parsed: DatabaseStorage | null = null;

          try {
            parsed = JSON.parse(existingRaw) as DatabaseStorage;
          } catch (parseError) {
            console.warn("⚠️ Invalid database payload detected, seeding fresh data.", parseError);
          }

          if (!parsed) {
            await this.seedInitialData();
          } else {
            const hasCollections =
              Array.isArray(parsed.interviewers) &&
              Array.isArray(parsed.events) &&
              Array.isArray(parsed.auditLogs);

            const hasData =
              (parsed.interviewers?.length ?? 0) > 0 ||
              (parsed.events?.length ?? 0) > 0 ||
              (parsed.auditLogs?.length ?? 0) > 0;

            const wasCleared = parsed.meta?.seedState === "cleared";

            if (!hasCollections || (!hasData && !wasCleared)) {
              await this.seedInitialData();
            } else {
              this.saveDatabase(parsed);
              console.log("✅ Database loaded from localStorage");
            }
          }
        }

        this.initialized = true;
      } catch (error) {
        console.error("❌ Database initialization failed:", error);
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();

    await this.initializationPromise;
  }

  /**
   * Get database from localStorage
   */
  private getDatabase(): DatabaseStorage {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      return this.withUpdatedMeta({
        interviewers: [],
        events: [],
        auditLogs: [],
      });
    }

    try {
      const parsed = JSON.parse(data) as DatabaseStorage;
      return this.withUpdatedMeta(parsed);
    } catch (error) {
      console.warn("⚠️ Failed to parse stored database, returning empty snapshot.", error);
      return this.withUpdatedMeta({
        interviewers: [],
        events: [],
        auditLogs: [],
      });
    }
  }

  /**
   * Save database to localStorage
   */
  private saveDatabase(
    db: DatabaseStorage,
    metaOverride?: Partial<DatabaseMeta>
  ): void {
    const normalized = this.withUpdatedMeta(db, metaOverride);
    localStorage.setItem(this.storageKey, JSON.stringify(normalized));
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

    const seededAt = getCurrentTimestamp();
    this.saveDatabase(db, {
      seedState: "seeded",
      lastSeededAt: seededAt,
      lastUpdatedAt: seededAt,
    });
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
    await this.ensureInitialized();
    const db = this.getDatabase();
    return db.interviewers.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get interviewer by email
   */
  async getInterviewerByEmail(email: string): Promise<Interviewer | null> {
    await this.ensureInitialized();
    const db = this.getDatabase();
    return db.interviewers.find((i) => i.email === email) || null;
  }

  /**
   * Create a new interviewer
   */
  async createInterviewer(
    data: Partial<Interviewer>,
    context?: AuditContext
  ): Promise<Interviewer> {
    await this.ensureInitialized();
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

    const auditUser = this.resolveAuditContext(context);
    await this.createAuditLog({
      user_email: auditUser.userEmail,
      user_name: auditUser.userName,
      action: "CREATE_INTERVIEWER",
      entity_type: "interviewer",
      entity_id: interviewer.id,
      changes: interviewer,
    });

    return interviewer;
  }

  /**
   * Update an interviewer
   */
  async updateInterviewer(
    email: string,
    data: Partial<Interviewer>,
    context?: AuditContext
  ): Promise<Interviewer> {
    await this.ensureInitialized();
    const db = this.getDatabase();
    const index = db.interviewers.findIndex((i) => i.email === email);

    if (index === -1) {
      throw new Error(`Interviewer with email ${email} not found`);
    }

    const existing = db.interviewers[index];
    const updated = {
      ...existing,
      ...data,
      email, // Ensure email doesn't change
      updated_at: getCurrentTimestamp(),
    };

    db.interviewers[index] = updated;

    this.saveDatabase(db);
    const auditUser = this.resolveAuditContext(context);
    const diff = this.buildChangeSet(existing, data);
    if (Object.keys(diff).length > 0) {
      await this.createAuditLog({
        user_email: auditUser.userEmail,
        user_name: auditUser.userName,
        action: "UPDATE_INTERVIEWER",
        entity_type: "interviewer",
        entity_id: updated.id,
        changes: diff,
      });
    }
    return updated;
  }

  /**
   * Delete an interviewer
   */
  async deleteInterviewer(email: string, context?: AuditContext): Promise<void> {
    await this.ensureInitialized();
    const db = this.getDatabase();
    const existing = db.interviewers.find((i) => i.email === email);
    db.interviewers = db.interviewers.filter((i) => i.email !== email);
    // Also delete related events
    db.events = db.events.filter((e) => e.interviewer_email !== email);
    this.saveDatabase(db);

    if (existing) {
      const auditUser = this.resolveAuditContext(context);
      await this.createAuditLog({
        user_email: auditUser.userEmail,
        user_name: auditUser.userName,
        action: "DELETE_INTERVIEWER",
        entity_type: "interviewer",
        entity_id: existing.id,
        changes: existing,
      });
    }
  }

  // ==================== INTERVIEW EVENT OPERATIONS ====================

  /**
   * Get all interview events
   */
  async getInterviewEvents(): Promise<InterviewEvent[]> {
    await this.ensureInitialized();
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
    await this.ensureInitialized();
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
    data: Partial<InterviewEvent>,
    context?: AuditContext
  ): Promise<InterviewEvent> {
    await this.ensureInitialized();
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
    const auditUser = this.resolveAuditContext(context);
    await this.createAuditLog({
      user_email: auditUser.userEmail,
      user_name: auditUser.userName,
      action: "CREATE_EVENT",
      entity_type: "interview_event",
      entity_id: event.id,
      changes: event,
    });
    return event;
  }

  /**
   * Update an interview event
  */
  async updateInterviewEvent(
    id: string,
    data: Partial<InterviewEvent>,
    context?: AuditContext
  ): Promise<InterviewEvent> {
    await this.ensureInitialized();
    const db = this.getDatabase();
    const index = db.events.findIndex((e) => e.id === id);

    if (index === -1) {
      throw new Error(`Event with id ${id} not found`);
    }

    const existing = db.events[index];
    const updated = {
      ...existing,
      ...data,
      id, // Ensure id doesn't change
      updated_at: getCurrentTimestamp(),
    };

    db.events[index] = updated;

    this.saveDatabase(db);
    const auditUser = this.resolveAuditContext(context);
    const diff = this.buildChangeSet(existing, data);
    if (Object.keys(diff).length > 0) {
      await this.createAuditLog({
        user_email: auditUser.userEmail,
        user_name: auditUser.userName,
        action: "UPDATE_EVENT",
        entity_type: "interview_event",
        entity_id: updated.id,
        changes: diff,
      });
    }
    return updated;
  }

  /**
   * Delete an interview event
  */
  async deleteInterviewEvent(id: string, context?: AuditContext): Promise<void> {
    await this.ensureInitialized();
    const db = this.getDatabase();
    const existing = db.events.find((e) => e.id === id);
    db.events = db.events.filter((e) => e.id !== id);
    this.saveDatabase(db);

    if (existing) {
      const auditUser = this.resolveAuditContext(context);
      await this.createAuditLog({
        user_email: auditUser.userEmail,
        user_name: auditUser.userName,
        action: "DELETE_EVENT",
        entity_type: "interview_event",
        entity_id: existing.id,
        changes: existing,
      });
    }
  }

  // ==================== AUDIT LOG OPERATIONS ====================

  /**
   * Create an audit log entry
   */
  async createAuditLog(
    data: Omit<AuditLog, "id" | "timestamp">
  ): Promise<void> {
    await this.ensureInitialized();
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
    await this.ensureInitialized();
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
    await this.ensureInitialized();
    // Clear the database
    localStorage.removeItem(this.storageKey);
    this.initialized = false;
    this.initializationPromise = null;

    // Reinitialize with fresh mock data
    await this.seedInitialData();
    this.initialized = true;

    console.log("✅ Database reset successfully");
  }

  /**
   * Clear database completely (empty state)
   */
  async clearDatabase(): Promise<void> {
    await this.ensureInitialized();
    // Create empty database
    const emptyDb: DatabaseStorage = {
      interviewers: [],
      events: [],
      auditLogs: [],
    };

    this.saveDatabase(emptyDb, { seedState: "cleared" });
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
    await this.ensureInitialized();
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
    await this.ensureInitialized();
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

    this.saveDatabase(db, { seedState: "custom" });
    return result;
  }

  /**
   * Import mock data from static file
   * This will clear existing data and load fresh mock data
   */
  async importMockData(): Promise<void> {
    await this.ensureInitialized();
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
      const seededAt = getCurrentTimestamp();
      this.saveDatabase(db, {
        seedState: "seeded",
        lastSeededAt: seededAt,
        lastUpdatedAt: seededAt,
      });

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
