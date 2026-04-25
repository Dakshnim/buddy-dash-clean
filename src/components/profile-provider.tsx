import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";

type Profile = {
  id: string;
  user_id: string;
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
    const { data } = await supabase
      .from("profiles")
      .select("id,user_id,display_name,avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ProfileCtx.Provider value={{ profile, loading, refresh }}>{children}</ProfileCtx.Provider>
  );
}

export const useProfile = () => useContext(ProfileCtx);
