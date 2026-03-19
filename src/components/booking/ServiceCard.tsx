import { motion } from "framer-motion";
import { Check, Droplets, Sparkles, Car } from "lucide-react";

const SERVICE_ICONS: Record<string, typeof Droplets> = {
  basic: Droplets,
  valet: Sparkles,
  premium: Car,
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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full rounded-[20px] text-left transition-all duration-300 overflow-hidden
        ${selected ? "ring-2 ring-foreground" : "ring-1 ring-border"}`}
      style={{
        boxShadow: selected ? "var(--shadow-float)" : "var(--shadow-card)",
      }}
    >
      <div className="p-6">
        {tag && (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest bg-foreground text-background px-3 py-1.5 rounded-full mb-4">
            ★ {tag}
          </span>
        )}

        <div className="flex items-start gap-4">
          <motion.div
            animate={selected ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.35 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300
              ${selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
          >
            <Icon size={24} />
          </motion.div>
          <div className="flex-1 min-w-0 pt-0.5">
            <span className="font-bold text-[17px] block text-foreground leading-tight">{title}</span>
            <span className="text-muted-foreground text-[13px] mt-1.5 block leading-relaxed">{description}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-5 border-t border-border">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground block">From</span>
            <span className="text-[1.75rem] font-extrabold tabular-nums text-foreground leading-none mt-1 block">
              £{price}
            </span>
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
              ${selected ? "bg-foreground text-background" : "border-[2px] border-border"}`}
          >
            {selected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
              >
                <Check size={16} strokeWidth={3} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default ServiceCard;
