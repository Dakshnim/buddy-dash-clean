import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firestore } from "@/integrations/firebase/client";

type Profile = {
  display_name: string | null;
  avatar_url: string | null;
};

type Ctx = {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const ProfileCtx = createContext<Ctx>({ profile: null, loading: true, refresh: async () => {} });

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const ref = doc(firestore, "profiles", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const next: Profile = {
          display_name: user.displayName ?? null,
          avatar_url: user.photoURL ?? null,
        };
        await setDoc(ref, next, { merge: true });
        setProfile(next);
        setLoading(false);
        return;
      }
      const data = snap.data() as Partial<Profile>;
      setProfile({
        display_name: data.display_name ?? user.displayName ?? null,
        avatar_url: data.avatar_url ?? user.photoURL ?? null,
      });
      setLoading(false);
    } catch {
      // Firestore can temporarily be offline; fall back to auth profile data.
      setProfile({
        display_name: user.displayName ?? null,
        avatar_url: user.photoURL ?? null,
      });
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <ProfileCtx.Provider value={{ profile, loading, refresh }}>{children}</ProfileCtx.Provider>
  );
}

export const useProfile = () => useContext(ProfileCtx);
