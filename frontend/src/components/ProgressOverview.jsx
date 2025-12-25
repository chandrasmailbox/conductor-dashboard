import { CheckCircle2, Clock, AlertCircle, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

export default function ProgressOverview({ progress }) {
  const stats = [
    {
      label: "Completed",
      value: progress.completed_tasks,
      icon: CheckCircle2,
      className: "text-emerald-500",
    },
    {
      label: "In Progress",
      value: progress.in_progress_tasks,
      icon: Clock,
      className: "text-amber-500",
    },
    {
      label: "Pending",
      value: progress.pending_tasks,
      icon: Circle,
      className: "text-slate-500",
    },
    {
      label: "Blocked",
      value: progress.blocked_tasks,
      icon: AlertCircle,
      className: "text-rose-500",
    },
  ];

  return (
    <Card className="border card-hover" data-testid="progress-overview">
      <CardHeader className="border-b border-border/50 pb-4">
        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
          Overall Progress
        </p>
        <div className="flex items-baseline gap-2">
          <CardTitle className="text-5xl font-extrabold tracking-tight">
            {progress.overall_completion}%
          </CardTitle>
          <span className="text-muted-foreground text-sm">complete</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Progress bar with segments */}
        <div className="space-y-2">
          <Progress value={progress.overall_completion} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.completed_tasks} of {progress.total_tasks} tasks</span>
            <span>{progress.phases?.length || 0} phases</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
            >
              <stat.icon className={`w-4 h-4 ${stat.className}`} strokeWidth={1.5} />
              <div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Project info */}
        {progress.product_name && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
              Project
            </p>
            <p className="font-semibold">{progress.product_name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {progress.owner}/{progress.repo_name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
