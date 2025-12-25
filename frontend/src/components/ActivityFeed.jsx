import { GitCommit, GitBranch } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";

export default function ActivityFeed({ commits }) {
  if (!commits || commits.length === 0) {
    return (
      <Card className="border card-hover" data-testid="activity-feed-empty">
        <CardHeader className="border-b border-border/50 pb-4">
          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
            Recent Activity
          </p>
          <CardTitle>Commit History</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground text-center py-8">
            No commits found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border card-hover" data-testid="activity-feed">
      <CardHeader className="border-b border-border/50 pb-4">
        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
          Recent Activity
        </p>
        <CardTitle>Commit History</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 px-0">
        <ScrollArea className="h-[400px] px-6">
          <div className="space-y-1">
            {commits.map((commit, index) => (
              <div
                key={commit.full_sha || index}
                className={cn(
                  "flex gap-3 p-3 rounded-lg activity-item",
                  commit.is_conductor && "bg-primary/5"
                )}
                data-testid={`commit-${index}`}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  commit.is_conductor 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {commit.is_conductor ? (
                    <GitBranch className="w-4 h-4" strokeWidth={1.5} />
                  ) : (
                    <GitCommit className="w-4 h-4" strokeWidth={1.5} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={cn(
                      "text-sm font-medium leading-tight",
                      commit.is_conductor && "text-primary"
                    )}>
                      {commit.message}
                    </p>
                    {commit.is_conductor && (
                      <Badge variant="outline" className="shrink-0 text-[10px] px-1.5">
                        CONDUCTOR
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <code className="mono bg-muted px-1 py-0.5 rounded">
                      {commit.sha}
                    </code>
                    <span>by {commit.author}</span>
                    <span>
                      {formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
