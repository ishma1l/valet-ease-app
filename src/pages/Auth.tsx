import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User, ArrowRight, Briefcase, Wrench } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AccountType = "business" | "worker";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("business");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWorker = searchParams.get("role") === "worker";

  useEffect(() => {
    if (isWorker) setAccountType("worker");
  }, [isWorker]);

  useEffect(() => {
    const redirect = isWorker || accountType === "worker" ? "/worker" : "/dashboard";
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate(redirect);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(redirect);
    });
    return () => subscription.unsubscribe();
  }, [navigate, isWorker, accountType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your email for the reset link");
        setMode("login");
        setLoading(false);
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, account_type: accountType },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // Assign role via security definer function
        if (data.user) {
          const role = accountType === "worker" ? "worker" : "user";
          await supabase.rpc("assign_role_on_signup", {
            _user_id: data.user.id,
            _role: role,
          });
        }

        toast.success("Check your email to verify your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-background flex items-center justify-center px-5">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">GLOSS.</h1>
          {isWorker && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold tracking-wide">
              WORKER LOGIN
            </span>
          )}
          <p className="text-muted-foreground text-sm mt-1">
            {isWorker
              ? "Sign in to access your worker dashboard"
              : mode === "forgot" ? "Enter your email to reset your password"
              : mode === "login" ? "Sign in to your dashboard" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && !isWorker && (
            <div className="grid grid-cols-2 gap-2 mb-1">
              {([
                { id: "business" as AccountType, label: "Business", desc: "Manage bookings", icon: Briefcase },
                { id: "worker" as AccountType, label: "Worker", desc: "Accept jobs", icon: Wrench },
              ]).map((opt) => (
                <motion.button
                  key={opt.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAccountType(opt.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left transition-all duration-200",
                    accountType === opt.id
                      ? "border-foreground bg-foreground/5 ring-1 ring-foreground/20"
                      : "border-border bg-card hover:bg-secondary"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    accountType === opt.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                  )}>
                    <opt.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {mode === "signup" && (
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                required className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
            </div>
          )}
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              required className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
          </div>
          {mode !== "forgot" && (
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
            </div>
          )}
          {mode === "login" && (
            <div className="text-right -mt-1">
              <button type="button" onClick={() => setMode("forgot")}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors">
                Forgot password?
              </button>
            </div>
          )}
          <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
            className="w-full h-12 bg-foreground text-background rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity">
            {loading ? <Loader2 size={18} className="animate-spin" /> : (
              <>{mode === "forgot" ? "Send Reset Link" : mode === "login" ? "Sign In" : "Create Account"} <ArrowRight size={16} /></>
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          {mode === "forgot" ? (
            <button onClick={() => setMode("login")} className="font-bold text-foreground hover:underline">Back to login</button>
          ) : (
            <>
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-bold text-foreground hover:underline">
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
