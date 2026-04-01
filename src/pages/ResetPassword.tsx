import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automatically picks up the recovery token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via recovery link — form is ready
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Password updated successfully");
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-background flex items-center justify-center px-5">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">GLOSS.</h1>
          <p className="text-muted-foreground text-sm mt-1">Set your new password</p>
        </div>

        {success ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
            <CheckCircle size={48} className="mx-auto text-primary" />
            <p className="text-sm font-medium text-foreground">Password updated!</p>
            <p className="text-xs text-muted-foreground">Redirecting to login…</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                required minLength={6} className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
            </div>
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
              className="w-full h-12 bg-foreground text-background rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Update Password <ArrowRight size={16} /></>}
            </motion.button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-5">
          <button onClick={() => navigate("/auth")} className="font-bold text-foreground hover:underline">Back to login</button>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
