import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  type ShapesIcon as LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiMetricCardProps {
  title: string;
  value: string | number;
  target?: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: LucideIcon;
  description?: string;
  status?: "success" | "warning" | "danger" | "neutral";
}

export function KpiMetricCard({
  title,
  value,
  target,
  trend,
  trendValue,
  icon: Icon,
  description,
  status = "neutral",
}: KpiMetricCardProps) {
  const statusColors = {
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
    neutral: "text-muted-foreground",
  };

  const trendIcons = {
    up: TrendingUpIcon,
    down: TrendingDownIcon,
    neutral: MinusIcon,
  };

  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <div className={cn("text-2xl font-bold", statusColors[status])}>
              {value}
            </div>
            {target && (
              <div className="text-sm text-muted-foreground">/ {target}</div>
            )}
          </div>

          {(trendValue || description) && (
            <div className="flex items-center gap-2 text-xs">
              {trend && TrendIcon && (
                <div
                  className={cn(
                    "flex items-center gap-1",
                    trend === "up" &&
                      status === "success" &&
                      "text-green-600 dark:text-green-400",
                    trend === "up" &&
                      status === "danger" &&
                      "text-red-600 dark:text-red-400",
                    trend === "down" &&
                      status === "success" &&
                      "text-green-600 dark:text-green-400",
                    trend === "down" &&
                      status === "danger" &&
                      "text-red-600 dark:text-red-400",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  <TrendIcon className="h-3 w-3" />

                  {trendValue && <span>{trendValue}</span>}
                </div>
              )}
              {description && (
                <span className="text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
