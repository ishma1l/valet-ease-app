import { motion } from "framer-motion";
import { Sun, CloudSun, Sunset, Check } from "lucide-react";
import { forwardRef } from "react";

const WINDOW_ICONS: Record<string, typeof Sun> = {
  morning: Sun,
  afternoon: CloudSun,
  evening: Sunset,
};

interface TimeWindowCardProps {
  id: string;
  label: string;
  time: string;
  selected: boolean;
  onClick: (id: string) => void;
}

const TimeWindowCard = forwardRef<HTMLButtonElement, TimeWindowCardProps>(
  ({ id, label, time, selected, onClick }, ref) => {
    const Icon = WINDOW_ICONS[id] || Sun;

    return (
      <motion.button
        ref={ref}
        onClick={() => onClick(id)}
        whileHover={{ scale: 1.015, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full rounded-2xl p-5 flex items-center gap-4 text-left transition-all duration-200
          ${selected ? "ring-2 ring-primary bg-accent" : "bg-card"}`}
        style={{
          boxShadow: selected ? "var(--shadow-glow)" : "var(--shadow-card)",
        }}
      >
        <motion.div
          animate={selected ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200
            ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <Icon size={20} />
        </motion.div>
        <div className="flex-1">
          <span className="font-bold text-[15px] block text-foreground">{label}</span>
          <span className="text-muted-foreground text-[13px] mt-0.5 block">{time}</span>
        </div>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200
            ${selected ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"}`}
        >
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <Check size={13} strokeWidth={3} />
            </motion.div>
          )}
        </div>
      </motion.button>
    );
  }
);

TimeWindowCard.displayName = "TimeWindowCard";

export default TimeWindowCard;
