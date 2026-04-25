import { Bell, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/components/notifications-provider";
import { Link } from "@tanstack/react-router";

export function NotificationsBell() {
  const { notifications, unread, markAllRead, clear } = useNotifications();

  return (
    <DropdownMenu onOpenChange={(o) => o && markAllRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display text-sm font-semibold">Notifications</p>
          {notifications.length > 0 && (
            <button onClick={clear} className="text-xs text-muted-foreground hover:text-foreground">
              Clear
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            You're all caught up.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  to="/dashboard/tasks"
                  className="flex items-start gap-3 px-4 py-3 transition hover:bg-accent"
                >
                  <div
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      n.type === "overdue"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/20 text-warning-foreground"
                    }`}
                  >
                    {n.type === "overdue" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
