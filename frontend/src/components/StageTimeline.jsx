import { CheckCircle2, Clock, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    badge: "COMPLETED",
    className: "status-completed",
    lineClass: "bg-emerald-500",
  },
  in_progress: {
    icon: Clock,
    badge: "IN PROGRESS",
    className: "status-in-progress",
    lineClass: "bg-amber-500",
  },
  pending: {
    icon: Circle,
    badge: "PENDING",
    className: "status-pending",
    lineClass: "bg-slate-300 dark:bg-slate-700",
  },
};

function PhaseItem({ phase, index, isLast, repoUrl }) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[phase.status] || statusConfig.pending;
  const Icon = config.icon;
  const isActive = phase.status === "in_progress";

  const completedTasks = phase.tasks?.filter(t => t.status === "completed").length || 0;
  const totalTasks = phase.tasks?.length || 0;

  return (
    <div className="relative" data-testid={`phase-${index}`}>
      {/* Connector line */}
      {!isLast && (
        <div 
          className={cn(
            "absolute left-5 top-12 bottom-0 w-0.5",
            config.lineClass
          )}
        />
      )}

      <div
        className={cn(
          "relative flex gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200",
          "hover:bg-muted/50",
          isActive && "stage-active bg-muted/30"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status icon */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10",
          "bg-background border-2",
          phase.status === "completed" && "border-emerald-500",
          phase.status === "in_progress" && "border-amber-500",
          phase.status === "pending" && "border-slate-300 dark:border-slate-700"
        )}>
          <Icon 
            className={cn("w-5 h-5", config.className.split(' ')[0])} 
            strokeWidth={1.5} 
          />
        </div>

        {/* Phase content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{phase.name}</h3>
            <Badge 
              variant="outline" 
              className={cn("text-[10px] px-2 py-0 uppercase tracking-wide", config.className)}
            >
              {config.badge}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{completedTasks}/{totalTasks} tasks</span>
            {totalTasks > 0 && (
              <span className="flex items-center gap-1">
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {expanded ? "Hide" : "Show"} tasks
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded task list */}
      <AnimatePresence>
        {expanded && phase.tasks?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-14 mt-2 space-y-1 pb-4">
              {phase.tasks.map((task, taskIndex) => {
                const taskConfig = statusConfig[task.status] || statusConfig.pending;
                const TaskIcon = taskConfig.icon;
                return (
                  <div
                    key={taskIndex}
                    className="flex items-center gap-3 p-2 rounded text-sm"
                    data-testid={`task-${index}-${taskIndex}`}
                  >
                    <TaskIcon 
                      className={cn("w-4 h-4 shrink-0", taskConfig.className.split(' ')[0])} 
                      strokeWidth={1.5} 
                    />
                    <span className={cn(
                      "flex-1 truncate",
                      task.status === "completed" && "text-muted-foreground line-through"
                    )}>
                      {task.name}
                    </span>
                    {task.commit_sha && repoUrl && (
                      <a 
                        href={`${repoUrl}/commit/${task.commit_sha}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-primary hover:underline mono bg-muted px-1.5 py-0.5 rounded"
                      >
                        {task.commit_sha}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StageTimeline({ phases, repoUrl }) {
  if (!phases || phases.length === 0) {
    return (
      <Card className="border card-hover" data-testid="stage-timeline-empty">
        <CardHeader className="border-b border-border/50 pb-4">
          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
            Development Timeline
          </p>
          <CardTitle>No Phases Found</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground">
            No Conductor phases detected in this repository.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border card-hover" data-testid="stage-timeline">
      <CardHeader className="border-b border-border/50 pb-4">
        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
          Development Timeline
        </p>
        <CardTitle>Project Phases</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {phases.map((phase, index) => (
            <PhaseItem 
              key={index} 
              phase={phase} 
              index={index}
              isLast={index === phases.length - 1}
              repoUrl={repoUrl}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
