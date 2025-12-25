import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const COLORS = {
  completed: "hsl(142, 76%, 36%)",
  in_progress: "hsl(45, 93%, 47%)",
  pending: "hsl(215, 20%, 65%)",
  blocked: "hsl(0, 84%, 60%)",
};

const DARK_COLORS = {
  completed: "hsl(142, 70%, 45%)",
  in_progress: "hsl(45, 93%, 58%)",
  pending: "hsl(215, 20%, 50%)",
  blocked: "hsl(0, 84%, 60%)",
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card/90 backdrop-blur-xl border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium capitalize">{data.name}</p>
        <p className="text-xs text-muted-foreground">{data.value} tasks</p>
      </div>
    );
  }
  return null;
};

export default function CompletionChart({ progress }) {
  const data = [
    { name: "completed", value: progress.completed_tasks },
    { name: "in_progress", value: progress.in_progress_tasks },
    { name: "pending", value: progress.pending_tasks },
    { name: "blocked", value: progress.blocked_tasks },
  ].filter(d => d.value > 0);

  const isDark = document.documentElement.classList.contains("dark");
  const colors = isDark ? DARK_COLORS : COLORS;

  if (progress.total_tasks === 0) {
    return (
      <Card className="border card-hover" data-testid="completion-chart-empty">
        <CardHeader className="border-b border-border/50 pb-4">
          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
            Distribution
          </p>
          <CardTitle>Task Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground text-center py-8">
            No tasks to display.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border card-hover" data-testid="completion-chart">
      <CardHeader className="border-b border-border/50 pb-4">
        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
          Distribution
        </p>
        <CardTitle>Task Status</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[entry.name]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: colors[item.name] }}
              />
              <span className="text-xs text-muted-foreground capitalize truncate">
                {item.name.replace("_", " ")}
              </span>
              <span className="text-xs font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
