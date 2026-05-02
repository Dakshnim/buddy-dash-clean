import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { ListChecks, CheckCircle2, Clock, Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firestore } from "@/integrations/firebase/client";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  course: string | null;
};

function Overview() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(firestore, "users", user.uid, "tasks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: Task[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const due = (data.dueDate as Timestamp | undefined)?.toDate?.() ?? null;
          return {
            id: d.id,
            title: data.title ?? "",
            status: data.status ?? "todo",
            priority: data.priority ?? "medium",
            due_date: due ? due.toISOString() : null,
            course: data.course ?? null,
          };
        });
        setTasks(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [user]);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const todo = tasks.filter((t) => t.status !== "done").length;
  const overdue = tasks.filter(
    (t) => t.status !== "done" && t.due_date && new Date(t.due_date) < new Date()
  ).length;

  const upcoming = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 5);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const name = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {name}.
          </h1>
        </div>
        <Button asChild>
          <Link to="/dashboard/tasks">
            Open task manager <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Total tasks" value={total} tint="primary" />
        <StatCard icon={Clock} label="In progress" value={todo} tint="warning" />
        <StatCard icon={CheckCircle2} label="Completed" value={done} tint="success" />
        <StatCard icon={Flame} label="Overdue" value={overdue} tint="destructive" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Upcoming</h2>
            <Link to="/dashboard/tasks" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {loading && <p className="py-6 text-sm text-muted-foreground">Loading…</p>}
            {!loading && upcoming.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">
                Nothing due. Add your first task to get started.
              </p>
            )}
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.course ?? "No course"}
                    {t.due_date && " · " + new Date(t.due_date).toLocaleDateString()}
                  </p>
                </div>
                <PriorityPill priority={t.priority} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/15 to-accent p-6">
          <h2 className="font-display text-lg font-semibold">Focus tip</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try the 25/5 Pomodoro method: 25 minutes of deep work, then a 5
            minute break. Rinse and repeat — your brain will thank you.
          </p>
          <Button asChild variant="secondary" className="mt-6 w-full">
            <Link to="/dashboard/tasks">Plan today</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tint: "primary" | "success" | "warning" | "destructive";
}) {
  const tintMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${tintMap[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function PriorityPill({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: "bg-destructive/10 text-destructive",
    medium: "bg-warning/20 text-warning-foreground",
    low: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[priority] ?? map.low}`}>
      {priority}
    </span>
  );
}
