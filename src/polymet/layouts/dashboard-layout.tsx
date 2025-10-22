import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/polymet/components/role-badge";
import { useAuth } from "@/polymet/data/auth-context";
import {
  LayoutDashboardIcon,
  UsersIcon,
  CalendarIcon,
  CalendarDaysIcon,
  CalendarCheckIcon,
  FileTextIcon,
  SettingsIcon,
  DatabaseIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCogIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: "viewer" | "talent" | "admin";
  userName?: string;
  userEmail?: string;
}

export function DashboardLayout({
  children,
  userRole,
  userName,
  userEmail,
}: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const location = useLocation();

  // Use auth context user data, fallback to props if provided
  const displayName = userName || user?.name || "Guest User";
  const displayRole = userRole || user?.role || "viewer";
  const displayPicture = user?.picture || "https://github.com/yusufhilmi.png";

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboardIcon,
      roles: ["viewer", "talent", "admin"],
    },
    {
      name: "Schedule",
      href: "/schedule",
      icon: CalendarDaysIcon,
      roles: ["talent", "admin"], // Viewer: Dashboard only
    },
    {
      name: "Mark Interviews",
      href: "/mark-interviews",
      icon: CalendarCheckIcon,
      roles: ["talent", "admin"],
    },
    {
      name: "Interviewers",
      href: "/interviewers",
      icon: UsersIcon,
      roles: ["talent", "admin"], // Viewer: Dashboard only
    },
    {
      name: "Events",
      href: "/events",
      icon: CalendarIcon,
      roles: ["talent", "admin"], // Viewer: Dashboard only
    },
    {
      name: "Database",
      href: "/database",
      icon: DatabaseIcon,
      roles: ["admin"], // TA: No access
    },
    {
      name: "Audit Logs",
      href: "/audit-logs",
      icon: FileTextIcon,
      roles: ["admin"], // TA: No access
    },
    {
      name: "User Management",
      href: "/users",
      icon: UserCogIcon,
      roles: ["admin"], // Only admins can manage users
    },
    {
      name: "Settings",
      href: "/settings",
      icon: SettingsIcon,
      roles: ["admin"], // TA: No access
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(displayRole)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* User info - moved to top */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={displayPicture}
                alt={`${displayName}'s profile picture`}
                className="w-10 h-10 rounded-full"
              />

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {displayName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {userEmail || user?.email || "guest@company.com"}
                </div>
                <div className="mt-1">
                  <RoleBadge role={displayRole} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation menu"
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          {!navCollapsed && (
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />

                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Toggle button and Sign Out */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setNavCollapsed(!navCollapsed)}
            >
              {navCollapsed ? (
                <>
                  <ChevronRightIcon className="h-4 w-4 mr-2" />
                  Show Menu
                </>
              ) : (
                <>
                  <ChevronLeftIcon className="h-4 w-4 mr-2" />
                  Hide Menu
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={signOut}
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-background border-b border-border">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-4 ml-auto">
              <div className="text-sm text-muted-foreground">
                Last synced: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 relative z-10">{children}</main>
      </div>
    </div>
  );
}
