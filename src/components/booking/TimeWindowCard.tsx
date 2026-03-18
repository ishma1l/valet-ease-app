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
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 text-left
        ${selected
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "card-surface hover:shadow-[var(--shadow-elevated)]"}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200
          ${selected ? "bg-primary-foreground/20" : "bg-muted"}`}
      >
        <Icon size={18} className={selected ? "text-primary-foreground" : "text-muted-foreground"} />
      </div>
      <div className="flex-1">
        <span className="font-bold block">{label}</span>
        <span className={`text-sm ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{time}</span>
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0"
        >
          <Check size={14} strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
};

export default TimeWindowCard;
