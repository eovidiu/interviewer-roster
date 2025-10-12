import { useState, useEffect } from "react";
import { EditableWeeklyCalendar } from "@/polymet/components/editable-weekly-calendar";
import { db } from "@/polymet/data/database-service";
import type { Interviewer } from "@/polymet/data/mock-interviewers-data";
import type { InterviewEvent } from "@/polymet/data/mock-interview-events-data";
import { useAuth } from "@/polymet/data/auth-context";

export function MarkInterviewsPage() {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const auditContext = user
    ? { userEmail: user.email, userName: user.name }
    : undefined;

  // Load data from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [interviewersData, eventsData] = await Promise.all([
        db.getInterviewers(),
        db.getInterviewEvents(),
      ]);
      setInterviewers(interviewersData);
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Auto-save is handled by the calendar component
      console.log("Interview data saved successfully");
    } catch (error) {
      console.error("Failed to save data:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mark Interviews</h1>
          <p className="text-muted-foreground mt-2">
            Loading interview data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mark Interviews</h1>
        <p className="text-muted-foreground mt-2">
          Enter the number of interviews conducted by each interviewer for each
          day
        </p>
      </div>

      {/* Editable Calendar */}
      <EditableWeeklyCalendar
        interviewers={interviewers}
        events={events}
        onSave={handleSave}
        auditContext={auditContext}
      />
    </div>
  );
}
