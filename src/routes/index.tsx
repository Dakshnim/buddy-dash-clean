import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckCircle2, Sparkles, Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Studyo — Your study, beautifully organized" },
      { name: "description", content: "A modern student dashboard for tasks, courses, and deadlines." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-accent/40 blur-[120px]" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-bold">
            S
          </div>
          <span className="font-display text-xl font-bold tracking-tight">Studyo</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/login" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            Built for students who get things done
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Your study,
            <br />
            <span className="text-gradient">beautifully organized.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Manage assignments, track deadlines, and stay on top of every course
            in one calm, focused dashboard.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/login" search={{ mode: "signup" }}>
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">I have an account</Link>
            </Button>
          </div>
        </div>

        <div className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            { icon: CheckCircle2, title: "Task manager", desc: "Capture, organize and complete every assignment." },
            { icon: Calendar, title: "Deadlines", desc: "Never miss a due date with smart reminders." },
            { icon: BookOpen, title: "Per course", desc: "Group your tasks by class for crystal clarity." },
          ].map((f) => (
            <div key={f.title} className="surface-glass rounded-2xl p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
