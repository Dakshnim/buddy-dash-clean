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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-gray-400">{greeting},</p>
          <h1 className="text-4xl font-bold text-cyan-400">{name} 👋</h1>
        </div>
        <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-black">
          <Link to="/dashboard/tasks">
            Open Tasks <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard icon={ListChecks} label="Total" value={total} />
        <StatCard icon={Clock} label="In Progress" value={todo} />
        <StatCard icon={CheckCircle2} label="Done" value={done} />
        <StatCard icon={Flame} label="Overdue" value={overdue} />
      </div>

      {/* Main */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        
        {/* Upcoming */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Tasks</h2>

          {loading && <p className="text-gray-400">Loading...</p>}

          {!loading && upcoming.length === 0 && (
            <p className="text-gray-400">No upcoming tasks</p>
          )}

          {upcoming.map((t) => (
            <div key={t.id} className="flex justify-between items-center py-3 border-b border-white/10">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-gray-400">
                  {t.course ?? "No course"}
                  {t.due_date && " • " + new Date(t.due_date).toLocaleDateString()}
                </p>
              </div>
              <PriorityPill priority={t.priority} />
            </div>
          ))}
        </div>

        {/* Side Card */}
        <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Focus Tip</h2>
          <p className="text-gray-300 text-sm mt-2">
            Use 25 min focus + 5 min break (Pomodoro technique).
          </p>
          <Button asChild className="mt-4 w-full bg-white text-black">
            <Link to="/dashboard/tasks">Start Planning</Link>
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 hover:scale-105 transition">
      <Icon className="h-6 w-6 text-cyan-400" />
      <p className="text-gray-400 mt-2">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function PriorityPill({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: "bg-red-500/20 text-red-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-gray-500/20 text-gray-300",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[priority] ?? map.low}`}>
      {priority}
    </span>
  );
}