import { motion } from "framer-motion";
import { Sun, CloudSun, Sunset, Check } from "lucide-react";
import { forwardRef } from "react";

const WINDOW_ICONS: Record<string, typeof Sun> = {
  morning: Sun,
  afternoon: CloudSun,
  evening: Sunset,
};

const WINDOW_COLORS: Record<string, string> = {
  morning: "from-amber-100 to-orange-50",
  afternoon: "from-sky-100 to-blue-50",
  evening: "from-violet-100 to-indigo-50",
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
    const gradient = WINDOW_COLORS[id] || "from-muted to-muted";

    return (
      <motion.button
        ref={ref}
        onClick={() => onClick(id)}
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full rounded-2xl p-5 flex items-center gap-4 text-left transition-all duration-300 overflow-hidden
          ${selected ? "ring-[2.5px] ring-primary" : "ring-1 ring-border"}`}
        style={{
          boxShadow: selected
            ? "0 6px 24px -4px hsl(var(--primary) / 0.2)"
            : "0 2px 8px -2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 bg-gradient-to-br ${gradient}
            ${selected ? "shadow-md" : ""}`}
        >
          <Icon size={22} className={selected ? "text-primary" : "text-muted-foreground"} />
        </div>
        <div className="flex-1">
          <span className="font-bold text-[15px] block text-foreground">{label}</span>
          <span className="text-muted-foreground text-[13px] mt-0.5 block">{time}</span>
        </div>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
            ${selected ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/20"}`}
        >
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <Check size={14} strokeWidth={3} />
            </motion.div>
          )}
        </div>
      </motion.button>
    );
  }
);

TimeWindowCard.displayName = "TimeWindowCard";
export default TimeWindowCard;
