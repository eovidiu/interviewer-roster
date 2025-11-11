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
    skills: [] as string[],
    // Migration 003 fields
    date_in: "",
    manager: "",
    check_manager: false,
    org: "",
    profile_backend: false,
    profile_big_data: false,
    profile_frontend: false,
    profile_fullstack: false,
    profile_sre: false,
    profile_cse: false,
    profile_ml: false,
    profile_em: false,
    max_level: null as number | null,
    check_level: "",
    pause_until: "",
    is_shadowing: false,
    onboarding_completed: false,
    is_remote: false,
  });
  const [skillInput, setSkillInput] = useState("");
  const handleRoleChange = (value: string) => {
    if (value === "viewer" || value === "talent" || value === "admin") {
      setFormData({ ...formData, role: value });
    }
  };

  useEffect(() => {
    if (interviewer) {
      setFormData({
        name: interviewer.name,
        email: interviewer.email,
        role: interviewer.role,
        timezone: interviewer.timezone || "America/Los_Angeles",
        is_active: interviewer.is_active,
        skills: interviewer.skills,
        // Migration 003 fields
        date_in: interviewer.date_in || "",
        manager: interviewer.manager || "",
        check_manager: interviewer.check_manager || false,
        org: interviewer.org || "",
        profile_backend: interviewer.profile_backend || false,
        profile_big_data: interviewer.profile_big_data || false,
        profile_frontend: interviewer.profile_frontend || false,
        profile_fullstack: interviewer.profile_fullstack || false,
        profile_sre: interviewer.profile_sre || false,
        profile_cse: interviewer.profile_cse || false,
        profile_ml: interviewer.profile_ml || false,
        profile_em: interviewer.profile_em || false,
        max_level: interviewer.max_level || null,
        check_level: interviewer.check_level || "",
        pause_until: interviewer.pause_until || "",
        is_shadowing: interviewer.is_shadowing || false,
        onboarding_completed: interviewer.onboarding_completed || false,
        is_remote: interviewer.is_remote || false,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: "viewer",
        timezone: "America/Los_Angeles",
        is_active: true,
        skills: [],
        // Migration 003 fields - defaults for new interviewer
        date_in: "",
        manager: "",
        check_manager: false,
        org: "",
        profile_backend: false,
        profile_big_data: false,
        profile_frontend: false,
        profile_fullstack: false,
        profile_sre: false,
        profile_cse: false,
        profile_ml: false,
        profile_em: false,
        max_level: null,
        check_level: "",
        pause_until: "",
        is_shadowing: false,
        onboarding_completed: false,
        is_remote: false,
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
                onValueChange={handleRoleChange}
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
                      aria-label={`Remove ${skill}`}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Migration 003 Fields - Organization & Management */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium">Organization & Management</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org">Team/Organization</Label>
                <Input
                  id="org"
                  placeholder="e.g., TeamA, Engineering"
                  value={formData.org}
                  onChange={(e) =>
                    setFormData({ ...formData, org: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Input
                  id="manager"
                  placeholder="Manager name"
                  value={formData.manager}
                  onChange={(e) =>
                    setFormData({ ...formData, manager: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_in">Start Date</Label>
                <Input
                  id="date_in"
                  type="date"
                  value={formData.date_in}
                  onChange={(e) =>
                    setFormData({ ...formData, date_in: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="check_manager"
                  checked={formData.check_manager}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, check_manager: checked })
                  }
                />
                <Label htmlFor="check_manager">Requires Manager Approval</Label>
              </div>
            </div>
          </div>

          {/* Migration 003 Fields - Interview Profiles */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium">Interview Profiles</h3>
            <p className="text-xs text-muted-foreground">Select interview types this person can conduct</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="profile_backend"
                  checked={formData.profile_backend}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, profile_backend: checked })
                  }
                />
                <Label htmlFor="profile_backend">Backend</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="profile_frontend"
                  checked={formData.profile_frontend}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, profile_frontend: checked })
                  }
                />
                <Label htmlFor="profile_frontend">Frontend</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="profile_fullstack"
                  checked={formData.profile_fullstack}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, profile_fullstack: checked })
                  }
                />
                <Label htmlFor="profile_fullstack">Fullstack</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="profile_sre"
                  checked={formData.profile_sre}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, profile_sre: checked })
                  }
                />
                <Label htmlFor="profile_sre">SRE</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="profile_big_data"
                  checked={formData.profile_big_data}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, profile_big_data: checked })
                  }
                />
                <Label htmlFor="profile_big_data">Big Data</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="profile_cse"
                  checked={formData.profile_cse}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, profile_cse: checked })
                  }
                />
                <Label htmlFor="profile_cse">CSE</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="profile_ml"
                  checked={formData.profile_ml}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, profile_ml: checked })
                  }
                />
                <Label htmlFor="profile_ml">ML/AI</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="profile_em"
                  checked={formData.profile_em}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, profile_em: checked })
                  }
                />
                <Label htmlFor="profile_em">Engineering Manager</Label>
              </div>
            </div>
          </div>

          {/* Migration 003 Fields - Level & Experience */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium">Level & Experience</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_level">Maximum Interview Level</Label>
                <Input
                  id="max_level"
                  type="number"
                  placeholder="e.g., 50, 60, 70"
                  value={formData.max_level || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_level: e.target.value ? parseInt(e.target.value) : null
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_level">Check Level</Label>
                <Input
                  id="check_level"
                  placeholder="e.g., ESEP40, ESEP50"
                  value={formData.check_level}
                  onChange={(e) =>
                    setFormData({ ...formData, check_level: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Migration 003 Fields - Status & Availability */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium">Status & Availability</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pause_until">Paused Until</Label>
                <Input
                  id="pause_until"
                  type="date"
                  value={formData.pause_until}
                  onChange={(e) =>
                    setFormData({ ...formData, pause_until: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Interviewer won't be scheduled until this date
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_shadowing"
                    checked={formData.is_shadowing}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_shadowing: checked })
                    }
                  />
                  <Label htmlFor="is_shadowing">Currently Shadowing</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="onboarding_completed"
                    checked={formData.onboarding_completed}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, onboarding_completed: checked })
                    }
                  />
                  <Label htmlFor="onboarding_completed">Onboarding Complete</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_remote"
                    checked={formData.is_remote}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_remote: checked })
                    }
                  />
                  <Label htmlFor="is_remote">Remote Interviewer</Label>
                </div>
              </div>
            </div>
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
