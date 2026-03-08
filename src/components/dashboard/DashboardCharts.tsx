import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TasksByProject {
  name: string;
  total: number;
  done: number;
}

interface TasksByStatus {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  tasksByProject: TasksByProject[];
  tasksByStatus: TasksByStatus[];
}

export function DashboardCharts({ tasksByProject, tasksByStatus }: DashboardChartsProps) {
  const hasData = tasksByProject.length > 0 || tasksByStatus.some(s => s.value > 0);
  
  if (!hasData) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Tasks by Project */}
      {tasksByProject.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tarefas por Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tasksByProject.slice(0, 6)} margin={{ top: 5, right: 5, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11, width: 100 }} className="text-muted-foreground" angle={-35} textAnchor="end" interval={0} height={60} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.3} />
                <Bar dataKey="done" name="Concluídas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tasks by Status */}
      {tasksByStatus.some(s => s.value > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={tasksByStatus.filter(s => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tasksByStatus.filter(s => s.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5">
                {tasksByStatus.filter(s => s.value > 0).map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="font-medium ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
