import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  BanIcon,
} from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "attended" | "ghosted" | "cancelled";
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: "Pending",
      icon: ClockIcon,
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
    },
    attended: {
      label: "Attended",
      icon: CheckCircle2Icon,
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    },
    ghosted: {
      label: "No Show",
      icon: XCircleIcon,
      className:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800",
    },
    cancelled: {
      label: "Cancelled",
      icon: BanIcon,
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
