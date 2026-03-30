import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isWorkerRoute = location.pathname === "/worker";

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate(isWorkerRoute ? "/auth?role=worker" : "/auth", { replace: true });
        return;
      }
      setChecking(false);
    };
    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return <>{children}</>;
};
