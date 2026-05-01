import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2, Calendar, BookOpen, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { firestore } from "@/integrations/firebase/client";

export const Route = createFileRoute("/dashboard/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Tasks — Studyo" }] }),
});

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  course: string | null;
  created_at: string;
};

function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "in_progress" | "done">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [sortBy, setSortBy] = useState<"created" | "priority" | "due">("created");

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(firestore, "users", user.uid, "tasks"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: Task[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const createdAt = (data.createdAt as Timestamp | undefined)?.toDate?.() ?? new Date(0);
          const due = (data.dueDate as Timestamp | undefined)?.toDate?.() ?? null;
          return {
            id: d.id,
            title: data.title ?? "",
            description: data.description ?? null,
            status: (data.status ?? "todo") as Task["status"],
            priority: (data.priority ?? "medium") as Task["priority"],
            course: data.course ?? null,
            due_date: due ? due.toISOString() : null,
            created_at: createdAt.toISOString(),
          };
        });
        setTasks(next);
        setLoading(false);
      },
      (err) => {
        toast.error(err.message ?? "Failed to load tasks");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCourse("");
    setDueDate("");
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const due = dueDate ? Timestamp.fromDate(new Date(dueDate + "T00:00:00")) : null;
      await addDoc(collection(firestore, "users", user.uid, "tasks"), {
        title,
        description: description || null,
        status: "todo",
        priority,
        course: course || null,
        dueDate: due,
        createdAt: serverTimestamp(),
      });
      toast.success("Task added");
      reset();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (t: Task) => {
    const next = t.status === "done" ? "todo" : "done";
    setTasks((cur) => cur.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    if (!user) return;
    try {
      await updateDoc(doc(firestore, "users", user.uid, "tasks", t.id), { status: next });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update task");
    }
  };

  const remove = async (t: Task) => {
    setTasks((cur) => cur.filter((x) => x.id !== t.id));
    if (!user) return;
    try {
      await deleteDoc(doc(firestore, "users", user.uid, "tasks", t.id));
      toast.success("Task deleted");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete task");
    }
  };

  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const visible = tasks
    .filter((t) => filter === "all" || t.status === filter)
    .filter((t) => priorityFilter === "all" || t.priority === priorityFilter)
    .slice()
    .sort((a, b) => {
      if (sortBy === "priority") return priorityRank[a.priority] - priorityRank[b.priority];
      if (sortBy === "due") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan, track, and finish your assignments.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a task</DialogTitle>
              <DialogDescription>Add an assignment, reading, or anything you need to do.</DialogDescription>
            </DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Calculus problem set 4" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Notes</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details…" rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="MATH 201" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due">Due date</Label>
                  <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="todo">To do</TabsTrigger>
            <TabsTrigger value="in_progress">In progress</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Newest first</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="due">Due date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={filter} className="mt-4">
          <div className="rounded-2xl border border-border bg-card">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : visible.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="font-display text-lg font-semibold">Nothing here yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click "New task" to add your first assignment.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {visible.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={() => toggleDone(t)} onDelete={() => remove(t)} />
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  const isDone = task.status === "done";
  const isOverdue = !isDone && task.due_date && new Date(task.due_date) < new Date();

  const priorityMap: Record<string, string> = {
    high: "bg-destructive/10 text-destructive",
    medium: "bg-warning/20 text-warning-foreground",
    low: "bg-muted text-muted-foreground",
  };

  return (
    <li className="group flex items-start gap-4 px-4 py-4 sm:px-6">
      <Checkbox checked={isDone} onCheckedChange={onToggle} className="mt-1" />
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${isDone ? "text-muted-foreground line-through" : ""}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-medium ${priorityMap[task.priority]}`}>
            {task.priority}
          </span>
          {task.course && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              <BookOpen className="h-3 w-3" /> {task.course}
            </span>
          )}
          {task.due_date && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                isOverdue ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="opacity-0 transition group-hover:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
