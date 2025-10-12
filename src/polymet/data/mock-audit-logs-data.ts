export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  entity: string;
  entity_id: string;
  changes: Record<string, unknown> | null;
  timestamp: string;
  ip_address: string;
}

export const mockAuditLogs: AuditLog[] = [
  {
    id: "log-001",
    user_email: "sarah.chen@company.com",
    action: "CREATE",
    entity: "interviewer",
    entity_id: "int-002",
    changes: {
      name: "Michael Rodriguez",
      email: "michael.rodriguez@company.com",
      role: "talent",
    },
    timestamp: "2024-01-18T10:30:00Z",
    ip_address: "192.168.1.100",
  },
  {
    id: "log-002",
    user_email: "sarah.chen@company.com",
    action: "UPDATE",
    entity: "interviewer",
    entity_id: "int-002",
    changes: {
      calendar_sync_enabled: { from: false, to: true },
    },
    timestamp: "2024-02-10T09:15:00Z",
    ip_address: "192.168.1.100",
  },
  {
    id: "log-003",
    user_email: "michael.rodriguez@company.com",
    action: "UPDATE",
    entity: "interview_event",
    entity_id: "evt-001",
    changes: {
      status: { from: "pending", to: "attended" },
      notes: "Candidate showed strong React fundamentals",
    },
    timestamp: "2024-03-18T11:05:00Z",
    ip_address: "192.168.1.105",
  },
  {
    id: "log-004",
    user_email: "sarah.chen@company.com",
    action: "CREATE",
    entity: "interviewer",
    entity_id: "int-003",
    changes: {
      name: "Priya Patel",
      email: "priya.patel@company.com",
      role: "talent",
    },
    timestamp: "2024-01-25T11:00:00Z",
    ip_address: "192.168.1.100",
  },
  {
    id: "log-005",
    user_email: "sarah.chen@company.com",
    action: "UPDATE",
    entity: "interview_event",
    entity_id: "evt-003",
    changes: {
      status: { from: "pending", to: "ghosted" },
      notes: "Candidate did not show up, no communication",
    },
    timestamp: "2024-03-19T11:15:00Z",
    ip_address: "192.168.1.100",
  },
  {
    id: "log-006",
    user_email: "sarah.chen@company.com",
    action: "CREATE",
    entity: "interviewer",
    entity_id: "int-004",
    changes: {
      name: "James Wilson",
      email: "james.wilson@company.com",
      role: "viewer",
    },
    timestamp: "2024-02-05T13:20:00Z",
    ip_address: "192.168.1.100",
  },
  {
    id: "log-007",
    user_email: "michael.rodriguez@company.com",
    action: "UPDATE",
    entity: "interview_event",
    entity_id: "evt-002",
    changes: {
      status: { from: "pending", to: "attended" },
      notes: "Good understanding of REST principles",
    },
    timestamp: "2024-03-18T15:10:00Z",
    ip_address: "192.168.1.105",
  },
  {
    id: "log-008",
    user_email: "sarah.chen@company.com",
    action: "UPDATE",
    entity: "interviewer",
    entity_id: "int-008",
    changes: {
      is_active: { from: true, to: false },
    },
    timestamp: "2024-03-05T16:00:00Z",
    ip_address: "192.168.1.100",
  },
  {
    id: "log-009",
    user_email: "sarah.chen@company.com",
    action: "CREATE",
    entity: "interviewer",
    entity_id: "int-005",
    changes: {
      name: "Emily Zhang",
      email: "emily.zhang@company.com",
      role: "talent",
    },
    timestamp: "2024-02-08T10:00:00Z",
    ip_address: "192.168.1.100",
  },
  {
    id: "log-010",
    user_email: "michael.rodriguez@company.com",
    action: "UPDATE",
    entity: "interview_event",
    entity_id: "evt-006",
    changes: {
      status: { from: "pending", to: "cancelled" },
      notes: "Candidate requested reschedule due to emergency",
    },
    timestamp: "2024-03-20T10:00:00Z",
    ip_address: "192.168.1.105",
  },
  {
    id: "log-011",
    user_email: "sarah.chen@company.com",
    action: "CREATE",
    entity: "interviewer",
    entity_id: "int-006",
    changes: {
      name: "David Kim",
      email: "david.kim@company.com",
      role: "talent",
    },
    timestamp: "2024-02-12T09:45:00Z",
    ip_address: "192.168.1.100",
  },
  {
    id: "log-012",
    user_email: "michael.rodriguez@company.com",
    action: "UPDATE",
    entity: "interviewer",
    entity_id: "int-003",
    changes: {
      skills: {
        from: ["Java", "Spring Boot", "Microservices"],
        to: ["Java", "Spring Boot", "Microservices", "Cloud Architecture"],
      },
    },
    timestamp: "2024-03-01T10:45:00Z",
    ip_address: "192.168.1.105",
  },
  {
    id: "log-013",
    user_email: "sarah.chen@company.com",
    action: "UPDATE",
    entity: "interview_event",
    entity_id: "evt-005",
    changes: {
      status: { from: "pending", to: "attended" },
      notes: "Strong ML fundamentals, good problem-solving",
    },
    timestamp: "2024-03-20T11:35:00Z",
    ip_address: "192.168.1.100",
  },
  {
    id: "log-014",
    user_email: "sarah.chen@company.com",
    action: "CREATE",
    entity: "interviewer",
    entity_id: "int-007",
    changes: {
      name: "Lisa Anderson",
      email: "lisa.anderson@company.com",
      role: "viewer",
    },
    timestamp: "2024-02-18T12:30:00Z",
    ip_address: "192.168.1.100",
  },
  {
    id: "log-015",
    user_email: "sarah.chen@company.com",
    action: "EXPORT",
    entity: "interview_events",
    entity_id: "bulk",
    changes: {
      format: "CSV",
      records_count: 14,
      date_range: "2024-03-01 to 2024-03-23",
    },
    timestamp: "2024-03-20T16:00:00Z",
    ip_address: "192.168.1.100",
  },
];
