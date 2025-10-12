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
import {
  SettingsIcon,
  DatabaseIcon,
  BellIcon,
  ShieldCheckIcon,
  CalendarIcon,
} from "lucide-react";

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

      {/* Outlook 365 Calendar Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />

            <CardTitle>Outlook 365 Calendar Integration</CardTitle>
          </div>
          <CardDescription>
            Configure read-only access to shared Outlook calendars for automatic
            interview tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-id">Azure Application (Client) ID</Label>
            <Input id="client-id" placeholder="Enter Azure AD Application ID" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-secret">Client Secret Value</Label>
            <Input
              id="client-secret"
              type="password"
              placeholder="Enter Client Secret"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-id">Tenant ID</Label>
            <Input id="tenant-id" placeholder="Enter Azure AD Tenant ID" />
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
              📖 Read-Only Integration
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              This integration only reads from shared interviewer calendars. It
              will NOT schedule interviews or modify calendar entries.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shared-calendar-email">Shared Calendar Email</Label>
            <Input
              id="shared-calendar-email"
              type="email"
              placeholder="interviews@company.com"
            />

            <p className="text-xs text-muted-foreground">
              Email address of the shared calendar to read interview events from
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-sync Calendar Events</Label>
              <p className="text-xs text-muted-foreground">
                Automatically read events every 15 minutes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Import Availability Status</Label>
              <p className="text-xs text-muted-foreground">
                Read free/busy status from shared Outlook calendars
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Button>Save Configuration</Button>
        </CardContent>
      </Card>

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
