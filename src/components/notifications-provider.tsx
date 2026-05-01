import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { firestore } from "@/integrations/firebase/client";

export type Notification = {
  id: string;
  taskId: string;
  title: string;
  message: string;
  type: "overdue" | "soon";
  dueDate: string;
  read: boolean;
  createdAt: number;
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
};

type Ctx = {
  notifications: Notification[];
  unread: number;
  markAllRead: () => void;
  clear: () => void;
};

const NotifCtx = createContext<Ctx>({ notifications: [], unread: 0, markAllRead: () => {}, clear: () => {} });

const STORAGE_KEY = "studyo-notified";
const SOON_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());
  const lastTasksRef = useRef<TaskRow[]>([]);

  // Load notified set from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) notifiedRef.current = new Set(JSON.parse(raw));
    } catch {}
  }, []);

  const persistNotified = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...notifiedRef.current]));
    } catch {}
  };

  const evaluate = useCallback((task: TaskRow) => {
    if (!task.due_date || task.status === "done") return;
    const due = new Date(task.due_date).getTime();
    const now = Date.now();
    const diff = due - now;

    let type: "overdue" | "soon" | null = null;
    if (diff < 0) type = "overdue";
    else if (diff <= SOON_WINDOW_MS) type = "soon";
    if (!type) return;

    const key = `${task.id}:${type}`;
    if (notifiedRef.current.has(key)) return;
    notifiedRef.current.add(key);
    persistNotified();

    const message =
      type === "overdue"
        ? `Overdue since ${new Date(task.due_date).toLocaleDateString()}`
        : `Due ${new Date(task.due_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`;

    const n: Notification = {
      id: `${key}:${now}`,
      taskId: task.id,
      title: task.title,
      message,
      type,
      dueDate: task.due_date,
      read: false,
      createdAt: now,
    };
    setNotifications((cur) => [n, ...cur].slice(0, 50));
    if (type === "overdue") toast.error(`Overdue: ${task.title}`, { description: message });
    else toast.warning(`Due soon: ${task.title}`, { description: message });
  }, []);

  // Periodic scan + realtime subscription
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const ref = collection(firestore, "users", user.uid, "tasks");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (cancelled) return;
        const rows: TaskRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const due = (data.dueDate as Timestamp | undefined)?.toDate?.() ?? null;
          return {
            id: d.id,
            title: data.title ?? "",
            status: data.status ?? "todo",
            due_date: due ? due.toISOString() : null,
          };
        });
        lastTasksRef.current = rows;
        rows.forEach(evaluate);
      },
      () => {}
    );

    const interval = setInterval(() => {
      // Re-evaluate periodically in case "soon" window is reached without changes.
      if (cancelled) return;
      lastTasksRef.current.forEach(evaluate);
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      unsub();
    };
  }, [user, evaluate]);

  const markAllRead = () => setNotifications((cur) => cur.map((n) => ({ ...n, read: true })));
  const clear = () => setNotifications([]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <NotifCtx.Provider value={{ notifications, unread, markAllRead, clear }}>
      {children}
    </NotifCtx.Provider>
  );
}

export const useNotifications = () => useContext(NotifCtx);
