import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatabaseIcon, BellIcon, ShieldCheckIcon } from "lucide-react";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage system configuration and preferences (Admin only)
        </p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5" />

            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure email notifications for system events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>No-Show Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Notify when candidate doesn't attend
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Daily Summary</Label>
              <p className="text-xs text-muted-foreground">
                Send daily interview summary email
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Critical system notifications
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Database & Backup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />

            <CardTitle>Database & Backup</CardTitle>
          </div>
          <CardDescription>
            Manage SQLite database and backup settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Database Location</Label>
            <Input value="./data/roster.db" disabled />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Daily Backups</Label>
              <p className="text-xs text-muted-foreground">
                7-day rolling backup retention
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Backup Now</Button>
            <Button variant="outline">Restore from Backup</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5" />

            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Security and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>JWT Token Expiry</Label>
            <Input value="8 hours" disabled />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Re-auth on Role Change</Label>
              <p className="text-xs text-muted-foreground">
                Force users to re-authenticate after role updates
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Audit Logging</Label>
              <p className="text-xs text-muted-foreground">
                Log all system changes (required)
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
