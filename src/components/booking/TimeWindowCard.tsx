import { motion } from "framer-motion";
import { Sun, CloudSun, Sunset, Check } from "lucide-react";

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

const TimeWindowCard = ({ id, label, time, selected, onClick }: TimeWindowCardProps) => {
  const Icon = WINDOW_ICONS[id] || Sun;

  return (
    <motion.button
      onClick={() => onClick(id)}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 text-left
        ${selected
          ? "bg-primary text-primary-foreground"
          : "bg-card hover:translate-y-[-1px]"}`}
      style={{
        border: selected ? "2px solid hsl(var(--primary))" : "1.5px solid hsl(var(--border))",
        boxShadow: selected
          ? "0 4px 20px rgba(37,99,235,0.25)"
          : "var(--shadow-card)",
      }}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200
          ${selected ? "bg-primary-foreground/20" : "bg-muted"}`}
      >
        <Icon size={18} className={selected ? "text-primary-foreground" : "text-muted-foreground"} />
      </div>
      <div className="flex-1">
        <span className="font-bold block leading-tight">{label}</span>
        <span className={`text-sm ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{time}</span>
      </div>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200
          ${selected
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "border-2 border-border"}`}
      >
        {selected && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Check size={14} strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

export default TimeWindowCard;
