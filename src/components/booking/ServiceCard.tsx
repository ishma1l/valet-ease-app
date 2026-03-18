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
  tag?: string;
  selected: boolean;
  onClick: (id: string) => void;
}

const ServiceCard = ({ id, title, description, price, tag, selected, onClick }: ServiceCardProps) => {
  const Icon = SERVICE_ICONS[id] || Droplets;

  return (
    <motion.button
      onClick={() => onClick(id)}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`relative w-full p-5 rounded-2xl flex items-center gap-4 transition-all duration-250 text-left overflow-hidden
        ${selected
          ? "bg-card"
          : "bg-card hover:translate-y-[-2px]"}`}
      style={{
        border: selected ? "2px solid hsl(var(--primary))" : "1.5px solid hsl(var(--border))",
        boxShadow: selected ? "var(--shadow-glow)" : "var(--shadow-card)",
      }}
    >
      {/* Popular tag */}
      {tag && (
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
          {tag}
        </span>
      )}
      
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200
          ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <span className={`font-bold text-base block leading-tight ${selected ? "text-foreground" : "text-foreground"}`}>
          {title}
        </span>
        <span className="text-[13px] text-muted-foreground mt-0.5 block">{description}</span>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-right">
          <span className="text-xl font-extrabold tabular-nums block leading-none">£{price}</span>
        </div>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200
            ${selected
              ? "bg-primary text-primary-foreground scale-100"
              : "border-2 border-border scale-100"}`}
        >
          {selected && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Check size={14} strokeWidth={3} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default ServiceCard;
