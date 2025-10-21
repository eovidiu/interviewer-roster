/**
 * API-based Database Service for Interview Roster App
 *
 * Replaces localStorage implementation with backend API calls
 * Maintains the same interface as the original DatabaseService
 */

import { apiClient } from '@/lib/api-client'
import type {
  Interviewer,
  InterviewEvent,
  AuditLog,
  AuditContext,
} from './database-service'

class ApiDatabaseService {
  private defaultAuditContext: AuditContext = {
    userEmail: 'system@interviewer-roster.local',
    userName: 'System Automation',
  }

  private resolveAuditContext(context?: AuditContext): AuditContext {
    if (context?.userEmail && context?.userName) {
      return context
    }
    return this.defaultAuditContext
  }

  /**
   * Initialize (no-op for API - backend is always initialized)
   */
  async initialize(): Promise<void> {
    // Backend is always initialized
    return Promise.resolve()
  }

  // ============================================================================
  // INTERVIEWERS
  // ============================================================================

  async getInterviewers(): Promise<Interviewer[]> {
    try {
      const response = await apiClient.get<{
        data: Interviewer[]
        pagination: {
          total: number
          limit: number
          offset: number
          hasMore: boolean
        }
      }>('/interviewers')
      return response.data
    } catch (error) {
      console.error('Error fetching interviewers:', error)
      throw error
    }
  }

  async getInterviewerByEmail(email: string): Promise<Interviewer | null> {
    try {
      const response = await apiClient.get<{
        data: Interviewer[]
      }>(`/interviewers?search=${encodeURIComponent(email)}`)

      const interviewer = response.data.find((i) => i.email === email)
      return interviewer || null
    } catch (error) {
      console.error('Error fetching interviewer by email:', error)
      return null
    }
  }

  async createInterviewer(
    data: Omit<Interviewer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Interviewer> {
    try {
      const interviewer = await apiClient.post<Interviewer>(
        '/interviewers',
        data
      )
      return interviewer
    } catch (error) {
      console.error('Error creating interviewer:', error)
      throw error
    }
  }

  async updateInterviewer(
    email: string,
    data: Partial<Omit<Interviewer, 'id' | 'email' | 'created_at'>>
  ): Promise<Interviewer> {
    try {
      // First, get the interviewer to find their ID
      const existing = await this.getInterviewerByEmail(email)
      if (!existing) {
        throw new Error('Interviewer not found')
      }

      const updated = await apiClient.put<Interviewer>(
        `/interviewers/${existing.id}`,
        data
      )
      return updated
    } catch (error) {
      console.error('Error updating interviewer:', error)
      throw error
    }
  }

  async deleteInterviewer(
    email: string
  ): Promise<void> {
    try {
      // First, get the interviewer to find their ID
      const existing = await this.getInterviewerByEmail(email)
      if (!existing) {
        throw new Error('Interviewer not found')
      }

      await apiClient.delete(`/interviewers/${existing.id}`)
    } catch (error) {
      console.error('Error deleting interviewer:', error)
      throw error
    }
  }

  // ============================================================================
  // INTERVIEW EVENTS
  // ============================================================================

  async getInterviewEvents(): Promise<InterviewEvent[]> {
    try {
      const response = await apiClient.get<{
        data: InterviewEvent[]
        pagination: {
          total: number
          limit: number
          offset: number
          hasMore: boolean
        }
      }>('/events')
      return response.data
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  }

  async getInterviewEventsByInterviewer(
    email: string
  ): Promise<InterviewEvent[]> {
    try {
      const response = await apiClient.get<{
        data: InterviewEvent[]
      }>(`/events?interviewer_email=${encodeURIComponent(email)}`)
      return response.data
    } catch (error) {
      console.error('Error fetching events by interviewer:', error)
      return []
    }
  }

  async createInterviewEvent(
    data: Omit<InterviewEvent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<InterviewEvent> {
    try {
      const event = await apiClient.post<InterviewEvent>('/events', data)
      return event
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  }

  async updateInterviewEvent(
    id: string,
    data: Partial<Omit<InterviewEvent, 'id' | 'created_at'>>
  ): Promise<InterviewEvent> {
    try {
      const updated = await apiClient.put<InterviewEvent>(`/events/${id}`, data)
      return updated
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  }

  async deleteInterviewEvent(id: string): Promise<void> {
    try {
      await apiClient.delete(`/events/${id}`)
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  async createAuditLog(
    action: string,
    entityType: string,
    entityId: string,
    changes: Record<string, unknown>,
    context?: AuditContext
  ): Promise<AuditLog> {
    // Audit logs are created automatically by backend
    // This is now a no-op, but we return a mock for compatibility
    const auditContext = this.resolveAuditContext(context)
    return {
      id: `mock-${Date.now()}`,
      user_email: auditContext.userEmail,
      user_name: auditContext.userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes,
      timestamp: new Date().toISOString(),
    }
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const response = await apiClient.get<{
        data: AuditLog[]
        pagination: {
          total: number
          limit: number
          offset: number
          hasMore: boolean
        }
      }>('/audit-logs')
      return response.data
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      throw error
    }
  }

  // ============================================================================
  // DATABASE MANAGEMENT
  // ============================================================================

  async resetDatabase(): Promise<void> {
    // Not supported via API - backend handles its own database
    console.warn('resetDatabase not supported via API')
    throw new Error('Reset database is not supported via API')
  }

  async clearDatabase(): Promise<void> {
    // Not supported via API - backend handles its own database
    console.warn('clearDatabase not supported via API')
    throw new Error('Clear database is not supported via API')
  }

  async exportData(): Promise<{
    interviewers: Interviewer[]
    events: InterviewEvent[]
    auditLogs: AuditLog[]
  }> {
    const [interviewers, events, auditLogs] = await Promise.all([
      this.getInterviewers(),
      this.getInterviewEvents(),
      this.getAuditLogs(),
    ])

    return { interviewers, events, auditLogs }
  }

  async importData(data: {
    interviewers?: Interviewer[]
    events?: InterviewEvent[]
    auditLogs?: AuditLog[]
  }): Promise<void> {
    // Import via API - create each entity
    console.warn('importData via API not fully implemented yet')

    if (data.interviewers) {
      for (const interviewer of data.interviewers) {
        try {
          await this.createInterviewer(interviewer)
        } catch (error) {
          console.error('Error importing interviewer:', error)
        }
      }
    }

    if (data.events) {
      for (const event of data.events) {
        try {
          await this.createInterviewEvent(event)
        } catch (error) {
          console.error('Error importing event:', error)
        }
      }
    }
  }

  async importMockData(): Promise<void> {
    console.warn('importMockData not supported via API - backend has seed data')
    throw new Error('Import mock data is not supported via API')
  }
}

// Export singleton instance
export const apiDatabaseService = new ApiDatabaseService()
export default apiDatabaseService
