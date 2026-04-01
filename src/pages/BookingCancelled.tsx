import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft } from "lucide-react";

const BookingCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
        <XCircle size={44} className="text-muted-foreground" />
      </motion.div>

      <motion.h1 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
        className="text-2xl font-extrabold tracking-tight text-foreground mb-2">
        Payment cancelled
      </motion.h1>

      <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
        className="text-muted-foreground text-sm max-w-[280px] leading-relaxed mb-8">
        No worries — your booking wasn't charged. You can try again whenever you're ready.
      </motion.p>

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/")}
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
        className="bg-foreground text-background font-bold text-[15px] h-14 px-8 rounded-2xl flex items-center gap-2">
        <ArrowLeft size={16} /> Try Again
      </motion.button>
    </div>
  );
};

export default BookingCancelled;
