import { motion } from "framer-motion";
import { Check, Droplets, Sparkles, Car, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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
  duration: string;
  rating: number;
  bookings: number;
  selected: boolean;
  onClick: (id: string) => void;
}

const ServiceCard = ({ id, title, description, price, tag, duration, rating, bookings, selected, onClick }: ServiceCardProps) => {
  const Icon = SERVICE_ICONS[id] || Droplets;

  return (
    <motion.button
      onClick={() => onClick(id)}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-full rounded-2xl text-left transition-all duration-200 overflow-hidden",
        selected ? "ring-2 ring-foreground bg-card" : "ring-1 ring-border bg-card"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3.5">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200",
            selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
          )}>
            <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] text-foreground">{title}</span>
              {tag && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-foreground text-background px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{description}</p>

            {/* Meta row - Booksy style */}
            <div className="flex items-center gap-3 mt-2.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                <Star size={10} fill="currentColor" className="text-warning" />
                {rating}
              </span>
              <span className="text-[11px] text-muted-foreground">{bookings} bookings</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock size={10} />
                {duration}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
            <span className="text-lg font-extrabold tabular-nums text-foreground leading-none">
              £{price}
            </span>
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
              selected ? "bg-foreground text-background" : "border-2 border-border"
            )}>
              {selected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                  <Check size={12} strokeWidth={3} />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default ServiceCard;
