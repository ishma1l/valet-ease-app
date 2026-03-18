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
      whileTap={{ scale: 0.98 }}
      className={`relative w-full rounded-2xl p-6 text-left transition-all duration-200
        ${selected ? "ring-2 ring-primary bg-accent" : "bg-card hover:bg-muted/50"}`}
      style={{
        boxShadow: selected ? "var(--shadow-glow)" : "var(--shadow-card)",
      }}
    >
      {tag && (
        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
          {tag}
        </span>
      )}

      <div className="flex items-start gap-5">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-200
            ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <span className="font-bold text-[17px] block text-foreground">{title}</span>
          <span className="text-muted-foreground text-[13px] mt-1 block leading-relaxed">
            {description}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-5 border-t border-border">
        <span className="text-2xl font-extrabold tabular-nums text-foreground">£{price}</span>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200
            ${selected ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"}`}
        >
          {selected && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
              <Check size={15} strokeWidth={3} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default ServiceCard;
