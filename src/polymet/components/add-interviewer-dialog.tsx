import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { XIcon } from "lucide-react";
import { Interviewer } from "@/polymet/data/mock-interviewers-data";

interface AddInterviewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewer?: Interviewer | null;
  userRole: "viewer" | "talent" | "admin";
  onSubmit: (data: Partial<Interviewer>) => void;
}

export function AddInterviewerDialog({
  open,
  onOpenChange,
  interviewer,
  userRole,
  onSubmit,
}: AddInterviewerDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "viewer" as "viewer" | "talent" | "admin",
    timezone: "America/Los_Angeles",
    is_active: true,
    calendar_sync_enabled: false,
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (interviewer) {
      setFormData({
        name: interviewer.name,
        email: interviewer.email,
        role: interviewer.role,
        timezone: interviewer.timezone,
        is_active: interviewer.is_active,
        calendar_sync_enabled: interviewer.calendar_sync_enabled,
        skills: interviewer.skills,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: "viewer",
        timezone: "America/Los_Angeles",
        is_active: true,
        calendar_sync_enabled: false,
        skills: [],
      });
    }
  }, [interviewer, open]);

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onOpenChange(false);
  };

  const canEditRole = userRole === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {interviewer ? "Edit Interviewer" : "Add New Interviewer"}
          </DialogTitle>
          <DialogDescription>
            {interviewer
              ? "Update interviewer details and permissions"
              : "Add a new interviewer to the roster"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!!interviewer}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, role: value })
                }
                disabled={!canEditRole}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="talent">Talent Acquisition</SelectItem>
                  <SelectItem value="admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {!canEditRole && (
                <p className="text-xs text-muted-foreground">
                  Only Super Admins can change roles
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone *</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData({ ...formData, timezone: value })
                }
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time
                  </SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Asia/Kolkata">India</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <div className="flex gap-2">
              <Input
                id="skills"
                placeholder="Add a skill (e.g., React, Python)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />

              <Button type="button" onClick={handleAddSkill}>
                Add
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive interviewers won't be scheduled
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="calendar_sync">Calendar Sync</Label>
                <p className="text-xs text-muted-foreground">
                  Enable Outlook 365 Calendar integration
                </p>
              </div>
              <Switch
                id="calendar_sync"
                checked={formData.calendar_sync_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, calendar_sync_enabled: checked })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name || !formData.email}
          >
            {interviewer ? "Save Changes" : "Add Interviewer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
