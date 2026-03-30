import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWorker = searchParams.get("role") === "worker";

  useEffect(() => {
    const redirect = isWorker ? "/worker" : "/dashboard";
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate(redirect);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(redirect);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
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
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login" ? "Sign in to your business dashboard" : "Create your business account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={6} className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
            className="w-full h-12 bg-foreground text-background rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity">
            {loading ? <Loader2 size={18} className="animate-spin" /> : (
              <>{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight size={16} /></>
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-bold text-foreground hover:underline">
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
