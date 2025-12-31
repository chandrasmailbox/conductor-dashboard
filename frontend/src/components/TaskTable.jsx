import { useState, useMemo } from "react";
import { CheckCircle2, Clock, Circle, AlertCircle, Filter, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { cn } from "../lib/utils";

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    className: "status-completed",
  },
  in_progress: {
    icon: Clock,
    label: "In Progress",
    className: "status-in-progress",
  },
  pending: {
    icon: Circle,
    label: "Pending",
    className: "status-pending",
  },
  blocked: {
    icon: AlertCircle,
    label: "Blocked",
    className: "status-blocked",
  },
};

export default function TaskTable({ phases, defaultStatusFilter = [], repoUrl }) {
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [phaseFilter, setPhaseFilter] = useState([]);

  // Flatten all tasks with phase info
  const allTasks = useMemo(() => {
    const tasks = [];
    phases?.forEach((phase) => {
      phase.tasks?.forEach((task) => {
        tasks.push({
          ...task,
          phase: phase.name,
        });
      });
    });
    return tasks;
  }, [phases]);

  // Get unique phase names
  const phaseNames = useMemo(() => {
    return [...new Set(allTasks.map((t) => t.phase))];
  }, [allTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const statusMatch = statusFilter.length === 0 || statusFilter.includes(task.status);
      const phaseMatch = phaseFilter.length === 0 || phaseFilter.includes(task.phase);
      return statusMatch && phaseMatch;
    });
  }, [allTasks, statusFilter, phaseFilter]);

  const toggleStatusFilter = (status) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const togglePhaseFilter = (phase) => {
    setPhaseFilter((prev) =>
      prev.includes(phase)
        ? prev.filter((p) => p !== phase)
        : [...prev, phase]
    );
  };

  if (allTasks.length === 0) {
    return (
      <Card className="border card-hover" data-testid="task-table-empty">
        <CardHeader className="border-b border-border/50 pb-4">
          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
            Task Overview
          </p>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground text-center py-8">
            No tasks found in the Conductor plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border card-hover" data-testid="task-table">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Task Overview
            </p>
            <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
          </div>

          <div className="flex gap-2">
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="status-filter">
                  <Filter className="w-4 h-4" strokeWidth={1.5} />
                  Status
                  {statusFilter.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5">
                      {statusFilter.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={statusFilter.includes(key)}
                    onCheckedChange={() => toggleStatusFilter(key)}
                  >
                    <config.icon className={cn("w-4 h-4 mr-2", config.className.split(' ')[0])} />
                    {config.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Phase Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="phase-filter">
                  Phase
                  {phaseFilter.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5">
                      {phaseFilter.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {phaseNames.map((phase) => (
                  <DropdownMenuCheckboxItem
                    key={phase}
                    checked={phaseFilter.includes(phase)}
                    onCheckedChange={() => togglePhaseFilter(phase)}
                  >
                    {phase}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Task</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Commit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task, index) => {
              const config = statusConfig[task.status] || statusConfig.pending;
              const Icon = config.icon;
              return (
                <TableRow key={index} className="activity-item" data-testid={`table-row-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn("w-4 h-4 shrink-0", config.className.split(' ')[0])}
                        strokeWidth={1.5}
                      />
                      <span className={cn(
                        "truncate max-w-[300px]",
                        task.status === "completed" && "text-muted-foreground"
                      )}>
                        {task.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                      {task.phase}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] uppercase tracking-wide", config.className)}
                    >
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {task.commit_sha ? (
                      repoUrl ? (
                        <a
                          href={`${repoUrl}/commit/${task.commit_sha}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mono bg-muted px-1.5 py-0.5 rounded"
                        >
                          {task.commit_sha}
                        </a>
                      ) : (
                        <code className="text-xs text-muted-foreground mono bg-muted px-1.5 py-0.5 rounded">
                          {task.commit_sha}
                        </code>
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
