import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useProfile } from "@/components/profile-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { firebaseAuth, firestore } from "@/integrations/firebase/client";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Studyo" }] }),
});

function ProfilePage() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.display_name ?? "");
  }, [profile]);

  const initials = (name || user?.email || "U")
    .split(/[ @]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      if (firebaseAuth?.currentUser) {
        await updateProfile(firebaseAuth.currentUser, { displayName: name.trim() || null });
      }
      await setDoc(
        doc(firestore, "profiles", user.uid),
        { display_name: name.trim() || null },
        { merge: true }
      );
      await refresh();
      toast.success("Profile saved");
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage how you appear in Studyo.</p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary font-display text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm text-muted-foreground">
            Avatar comes from your Firebase Auth profile photo URL.
          </div>
        </div>

        <form onSubmit={save} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
