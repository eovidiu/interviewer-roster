import Papa from "papaparse";
import type {
  AuditLog,
  InterviewEvent,
  Interviewer,
} from "@/polymet/data/database-service";

export type CsvDataset = "interviewers" | "events" | "auditLogs";

interface CsvExportResult {
  filename: string;
  content: string;
  mimeType: string;
}

const CSV_MIME = "text/csv;charset=utf-8;";

function triggerDownload({ filename, content, mimeType }: CsvExportResult) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportInterviewersCsv(interviewers: Interviewer[]) {
  const rows = interviewers.map((interviewer) => ({
    id: interviewer.id,
    name: interviewer.name,
    email: interviewer.email,
    role: interviewer.role,
    skills: Array.isArray(interviewer.skills)
      ? interviewer.skills.join("; ")
      : "",
    is_active: interviewer.is_active ? "true" : "false",
    timezone: interviewer.timezone ?? "",
    calendar_sync_enabled: interviewer.calendar_sync_enabled ? "true" : "false",
    calendar_sync_consent_at: interviewer.calendar_sync_consent_at ?? "",
    last_synced_at: interviewer.last_synced_at ?? "",
    created_at: interviewer.created_at,
    updated_at: interviewer.updated_at,
    created_by: interviewer.created_by ?? "",
    modified_at: interviewer.modified_at ?? "",
    modified_by: interviewer.modified_by ?? "",
  }));

  const csv = Papa.unparse(rows, {
    header: true,
    quotes: true,
  });

  triggerDownload({
    filename: `interviewers-export-${Date.now()}.csv`,
    content: csv,
    mimeType: CSV_MIME,
  });
}

export function exportEventsCsv(events: InterviewEvent[]) {
  const rows = events.map((event) => ({
    id: event.id,
    interviewer_email: event.interviewer_email,
    candidate_name: event.candidate_name ?? "",
    position: event.position ?? "",
    start_time: event.start_time,
    end_time: event.end_time,
    scheduled_date: event.scheduled_date ?? "",
    duration_minutes:
      typeof event.duration_minutes === "number"
        ? String(event.duration_minutes)
        : "",
    status: event.status,
    skills_assessed: Array.isArray(event.skills_assessed)
      ? event.skills_assessed.join("; ")
      : "",
    notes: event.notes ?? "",
    marked_by: event.marked_by ?? "",
    marked_at: event.marked_at ?? "",
    created_at: event.created_at,
    updated_at: event.updated_at ?? "",
    calendar_event_id: event.calendar_event_id ?? "",
  }));

  const csv = Papa.unparse(rows, {
    header: true,
    quotes: true,
  });

  triggerDownload({
    filename: `events-export-${Date.now()}.csv`,
    content: csv,
    mimeType: CSV_MIME,
  });
}

export function exportAuditLogsCsv(logs: AuditLog[]) {
  const rows = logs.map((log) => ({
    id: log.id,
    timestamp: log.timestamp,
    user_name: log.user_name,
    user_email: log.user_email,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    changes: JSON.stringify(log.changes ?? {}),
  }));

  const csv = Papa.unparse(rows, {
    header: true,
    quotes: true,
  });

  triggerDownload({
    filename: `audit-logs-export-${Date.now()}.csv`,
    content: csv,
    mimeType: CSV_MIME,
  });
}

export async function parseCsvFile(
  file: File
): Promise<{ dataset: CsvDataset; rows: Record<string, string>[] }> {
  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0].message);
  }

  if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
    throw new Error("CSV file is missing headers");
  }

  const fields = parsed.meta.fields.map((field) => field.toLowerCase());

  if (fields.includes("entity_type") && fields.includes("entity_id")) {
    return { dataset: "auditLogs", rows: parsed.data };
  }

  if (fields.includes("interviewer_email") && fields.includes("status")) {
    return { dataset: "events", rows: parsed.data };
  }

  if (fields.includes("email") && fields.includes("role") && fields.includes("skills")) {
    return { dataset: "interviewers", rows: parsed.data };
  }

  throw new Error("Unrecognized CSV format. Please use an exported file.");
}

export function mapCsvRowsToInterviewers(
  rows: Record<string, string>[]
): Interviewer[] {
  return rows.map((row) => ({
    id: row.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: row.name ?? "",
    email: row.email ?? "",
    role: row.role ?? "viewer",
    skills: row.skills ? row.skills.split(";").map((skill) => skill.trim()).filter(Boolean) : [],
    is_active: row.is_active === "true",
    calendar_sync_enabled: row.calendar_sync_enabled === "true",
    timezone: row.timezone || undefined,
    calendar_sync_consent_at: row.calendar_sync_consent_at || null,
    last_synced_at: row.last_synced_at || null,
    created_by: row.created_by || undefined,
    modified_at: row.modified_at || undefined,
    modified_by: row.modified_by || undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  }));
}

export function mapCsvRowsToEvents(
  rows: Record<string, string>[]
): InterviewEvent[] {
  return rows.map((row) => ({
    id: row.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    interviewer_email: row.interviewer_email ?? "",
    candidate_name: row.candidate_name || undefined,
    position: row.position || undefined,
    start_time: row.start_time ?? row.scheduled_date ?? new Date().toISOString(),
    end_time: row.end_time ?? row.start_time ?? new Date().toISOString(),
    scheduled_date: row.scheduled_date || undefined,
    duration_minutes: row.duration_minutes ? Number(row.duration_minutes) : undefined,
    status:
      row.status === "attended" ||
      row.status === "ghosted" ||
      row.status === "cancelled"
        ? row.status
        : "pending",
    notes: row.notes || null,
    calendar_event_id: row.calendar_event_id || undefined,
    skills_assessed: row.skills_assessed
      ? row.skills_assessed.split(";").map((skill) => skill.trim()).filter(Boolean)
      : null,
    marked_by: row.marked_by || undefined,
    marked_at: row.marked_at || undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at || undefined,
  }));
}

export function mapCsvRowsToAuditLogs(
  rows: Record<string, string>[]
): AuditLog[] {
  return rows.map((row) => {
    let parsedChanges: Record<string, unknown> = {};
    if (row.changes) {
      try {
        parsedChanges = JSON.parse(row.changes);
      } catch {
        parsedChanges = { raw: row.changes };
      }
    }

    return {
      id: row.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: row.timestamp ?? new Date().toISOString(),
      user_name: row.user_name ?? "",
      user_email: row.user_email ?? "",
      action: row.action ?? "UNKNOWN",
      entity_type: row.entity_type ?? "",
      entity_id: row.entity_id ?? "",
      changes: parsedChanges,
    };
  });
}
