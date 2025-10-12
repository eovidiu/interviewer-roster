import { Badge } from "@/components/ui/badge";
import { ShieldCheckIcon, UsersIcon, EyeIcon } from "lucide-react";

interface RoleBadgeProps {
  role: "viewer" | "talent" | "admin";
  showIcon?: boolean;
}

export function RoleBadge({ role, showIcon = true }: RoleBadgeProps) {
  const roleConfig = {
    admin: {
      label: "Super Admin",
      icon: ShieldCheckIcon,
      className:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800",
    },
    talent: {
      label: "Talent Acquisition",
      icon: UsersIcon,
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    },
    viewer: {
      label: "Viewer",
      icon: EyeIcon,
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700",
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
