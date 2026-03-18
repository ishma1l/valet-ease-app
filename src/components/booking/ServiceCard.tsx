import { motion } from "framer-motion";
import { Check, Droplets, Sparkles, Car } from "lucide-react";

const SERVICE_ICONS: Record<string, typeof Droplets> = {
  basic: Droplets,
  valet: Sparkles,
  interior: Car,
};

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  selected: boolean;
  onClick: (id: string) => void;
}

const ServiceCard = ({ id, title, description, price, selected, onClick }: ServiceCardProps) => {
  const Icon = SERVICE_ICONS[id] || Droplets;

  return (
    <motion.button
      onClick={() => onClick(id)}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`relative w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 text-left
        ${selected
          ? "bg-accent ring-2 ring-primary"
          : "card-surface hover:shadow-[var(--shadow-elevated)]"}`}
      style={selected ? { boxShadow: "var(--shadow-active)" } : undefined}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200
          ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <span className={`font-bold text-[0.95rem] block ${selected ? "text-accent-foreground" : "text-foreground"}`}>
          {title}
        </span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-extrabold tabular-nums">£{price}</span>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
          >
            <Check size={14} strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

export default ServiceCard;
