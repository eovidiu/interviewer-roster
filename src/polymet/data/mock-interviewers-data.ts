export interface Interviewer {
  id: string;
  email: string;
  name: string;
  skills: string[];
  role: "viewer" | "talent" | "admin";
  is_active: boolean;
  timezone: string;
  created_at: string;
  created_by: string;
  modified_at: string;
  modified_by: string;
}

export const mockInterviewers: Interviewer[] = [
  {
    id: "int-001",
    email: "sarah.chen@company.com",
    name: "Sarah Chen",
    skills: ["React", "TypeScript", "System Design", "Frontend Architecture"],
    role: "admin",
    is_active: true,
    timezone: "America/Los_Angeles",
    created_at: "2024-01-10T09:00:00Z",
    created_by: "system@company.com",
    modified_at: "2024-03-15T11:20:00Z",
    modified_by: "sarah.chen@company.com",
  },
  {
    id: "int-002",
    email: "michael.rodriguez@company.com",
    name: "Michael Rodriguez",
    skills: ["Node.js", "Python", "Database Design", "API Development"],
    role: "talent",
    is_active: true,
    timezone: "America/New_York",
    created_at: "2024-01-18T10:30:00Z",
    created_by: "sarah.chen@company.com",
    modified_at: "2024-02-10T09:15:00Z",
    modified_by: "sarah.chen@company.com",
  },
  {
    id: "int-003",
    email: "priya.patel@company.com",
    name: "Priya Patel",
    skills: ["Java", "Spring Boot", "Microservices", "Cloud Architecture"],
    role: "talent",
    is_active: true,
    timezone: "Asia/Kolkata",
    created_at: "2024-01-25T11:00:00Z",
    created_by: "sarah.chen@company.com",
    modified_at: "2024-03-01T10:45:00Z",
    modified_by: "michael.rodriguez@company.com",
  },
  {
    id: "int-004",
    email: "james.wilson@company.com",
    name: "James Wilson",
    skills: ["DevOps", "Kubernetes", "CI/CD", "Infrastructure"],
    role: "viewer",
    is_active: true,
    timezone: "Europe/London",
    created_at: "2024-02-05T13:20:00Z",
    created_by: "sarah.chen@company.com",
    modified_at: "2024-02-05T13:20:00Z",
    modified_by: "sarah.chen@company.com",
  },
  {
    id: "int-005",
    email: "emily.zhang@company.com",
    name: "Emily Zhang",
    skills: ["Mobile Development", "React Native", "iOS", "Android"],
    role: "talent",
    is_active: true,
    timezone: "America/Los_Angeles",
    created_at: "2024-02-08T10:00:00Z",
    created_by: "sarah.chen@company.com",
    modified_at: "2024-03-10T15:30:00Z",
    modified_by: "sarah.chen@company.com",
  },
  {
    id: "int-006",
    email: "david.kim@company.com",
    name: "David Kim",
    skills: ["Machine Learning", "Python", "Data Science", "AI"],
    role: "talent",
    is_active: true,
    timezone: "America/Chicago",
    created_at: "2024-02-12T09:45:00Z",
    created_by: "sarah.chen@company.com",
    modified_at: "2024-02-20T14:15:00Z",
    modified_by: "michael.rodriguez@company.com",
  },
  {
    id: "int-007",
    email: "lisa.anderson@company.com",
    name: "Lisa Anderson",
    skills: ["Product Management", "UX Design", "User Research", "Strategy"],
    role: "viewer",
    is_active: true,
    timezone: "America/New_York",
    created_at: "2024-02-18T12:30:00Z",
    created_by: "sarah.chen@company.com",
    modified_at: "2024-02-18T12:30:00Z",
    modified_by: "sarah.chen@company.com",
  },
  {
    id: "int-008",
    email: "alex.thompson@company.com",
    name: "Alex Thompson",
    skills: [
      "Security",
      "Penetration Testing",
      "Compliance",
      "Risk Assessment",
    ],

    role: "talent",
    is_active: false,
    timezone: "America/Denver",
    created_at: "2024-01-28T11:15:00Z",
    created_by: "sarah.chen@company.com",
    modified_at: "2024-03-05T16:00:00Z",
    modified_by: "sarah.chen@company.com",
  },
];
