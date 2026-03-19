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
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      layout
      className={`relative w-full rounded-3xl p-0 text-left transition-all duration-300 overflow-hidden
        ${selected ? "ring-[2.5px] ring-primary" : "ring-1 ring-border"}`}
      style={{
        boxShadow: selected
          ? "0 8px 32px -4px hsl(var(--primary) / 0.2), 0 0 0 1px hsl(var(--primary) / 0.1)"
          : "0 2px 12px -2px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top color bar */}
      <div className={`h-1.5 w-full transition-colors duration-300 ${selected ? "bg-primary" : "bg-transparent"}`} />

      <div className="p-6 pt-5">
        {tag && (
          <motion.span
            layoutId={`tag-${id}`}
            className="inline-block text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded-full mb-4"
          >
            {tag}
          </motion.span>
        )}

        <div className="flex items-start gap-4">
          <motion.div
            animate={selected ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300
              ${selected ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground"}`}
            style={selected ? { boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)" } : {}}
          >
            <Icon size={26} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-[17px] block text-foreground leading-tight">{title}</span>
            <span className="text-muted-foreground text-[13px] mt-1.5 block leading-relaxed">{description}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground block">From</span>
            <span className="text-[1.5rem] font-extrabold tabular-nums text-foreground leading-none mt-0.5 block">
              £{price}
            </span>
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
              ${selected ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/20"}`}
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
