import { http, HttpResponse } from 'msw'

const API_URL = 'http://localhost:3000'

// Mock data
const mockInterviewers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Senior Engineer',
    skills: ['React', 'TypeScript', 'Node.js'],
    is_active: true,
    calendar_sync_enabled: false,
    timezone: 'America/Los_Angeles',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
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
]

const mockEvents = [
  {
    id: '1',
    interviewer_email: 'john@example.com',
    candidate_name: 'Alice Johnson',
    candidate_email: 'alice@candidate.com',
    scheduled_at: '2024-06-15T10:00:00Z',
    duration_minutes: 60,
    interview_type: 'technical',
    status: 'pending',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
]

const mockAuditLogs = [
  {
    id: '1',
    user_email: 'admin@example.com',
    user_name: 'Admin User',
    action: 'CREATE_INTERVIEWER',
    entity_type: 'interviewer',
    entity_id: '1',
    changes: { created: true },
    timestamp: '2024-01-01T00:00:00Z',
  },
]

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    picture: null,
    last_login_at: '2024-01-15T10:30:00Z',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'talent',
    picture: null,
    last_login_at: '2024-01-14T14:20:00Z',
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'viewer',
    picture: null,
    last_login_at: null,
    created_at: '2024-01-03T00:00:00Z',
  },
]

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; name?: string }

    // Simulate role assignment
    let role = 'viewer'
    if (body.email === 'admin@example.com' || body.email === 'eovidiu@gmail.com') {
      role = 'admin'
    } else if (body.email === 'talent@example.com') {
      role = 'talent'
    }

    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        email: body.email,
        name: body.name || body.email.split('@')[0],
        role,
      },
    })
  }),

  // Interviewers endpoints
  http.get(`${API_URL}/api/interviewers`, () => {
    return HttpResponse.json({
      data: mockInterviewers,
      pagination: {
        total: mockInterviewers.length,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    })
  }),

  http.post(`${API_URL}/api/interviewers`, async ({ request }) => {
    const body = await request.json()
    const newInterviewer = {
      id: String(Date.now()),
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockInterviewers.push(newInterviewer)
    return HttpResponse.json(newInterviewer, { status: 201 })
  }),

  http.put(`${API_URL}/api/interviewers/:id`, async ({ params, request }) => {
    const body = await request.json()
    const interviewer = mockInterviewers.find((i) => i.id === params.id)
    if (!interviewer) {
      return HttpResponse.json(
        { error: 'Interviewer not found' },
        { status: 404 }
      )
    }
    Object.assign(interviewer, body, { updated_at: new Date().toISOString() })
    return HttpResponse.json(interviewer)
  }),

  http.delete(`${API_URL}/api/interviewers/:id`, ({ params }) => {
    const index = mockInterviewers.findIndex((i) => i.id === params.id)
    if (index === -1) {
      return HttpResponse.json(
        { error: 'Interviewer not found' },
        { status: 404 }
      )
    }
    mockInterviewers.splice(index, 1)
    return HttpResponse.json({ success: true }, { status: 204 })
  }),

  // Events endpoints
  http.get(`${API_URL}/api/events`, () => {
    return HttpResponse.json({
      data: mockEvents,
      pagination: {
        total: mockEvents.length,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    })
  }),

  http.post(`${API_URL}/api/events`, async ({ request }) => {
    const body = await request.json()
    const newEvent = {
      id: String(Date.now()),
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockEvents.push(newEvent)
    return HttpResponse.json(newEvent, { status: 201 })
  }),

  http.put(`${API_URL}/api/events/:id`, async ({ params, request }) => {
    const body = await request.json()
    const event = mockEvents.find((e) => e.id === params.id)
    if (!event) {
      return HttpResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    Object.assign(event, body, { updated_at: new Date().toISOString() })
    return HttpResponse.json(event)
  }),

  http.delete(`${API_URL}/api/events/:id`, ({ params }) => {
    const index = mockEvents.findIndex((e) => e.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    mockEvents.splice(index, 1)
    return HttpResponse.json({ success: true }, { status: 204 })
  }),

  // Audit logs endpoints
  http.get(`${API_URL}/api/audit-logs`, () => {
    return HttpResponse.json({
      data: mockAuditLogs,
      pagination: {
        total: mockAuditLogs.length,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    })
  }),

  // Users endpoints (Issue #54)
  http.get(`${API_URL}/api/users`, () => {
    return HttpResponse.json({
      users: mockUsers,
      total: mockUsers.length,
      hasMore: false,
    })
  }),

  http.patch(`${API_URL}/api/users/:email/role`, async ({ params, request }) => {
    const { email } = params
    const body = await request.json() as { role: string }

    const user = mockUsers.find(u => u.email === email)
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update the mock user's role
    user.role = body.role as 'viewer' | 'talent' | 'admin'

    return HttpResponse.json({
      ...user,
      updated_at: new Date().toISOString(),
    })
  }),
]
