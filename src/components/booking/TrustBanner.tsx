import { motion } from "framer-motion";
import { Star, ShieldCheck, Clock, Truck, type LucideIcon } from "lucide-react";

interface TrustItem {
  icon: LucideIcon;
  text: string;
  detail?: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: Star, text: "Rated 4.9", detail: "200+ reviews" },
  { icon: ShieldCheck, text: "Fully insured", detail: "Licensed pros" },
  { icon: Truck, text: "We come to you", detail: "At your door" },
  { icon: Clock, text: "60-sec booking", detail: "Fast & easy" },
];

interface TrustBannerProps {
  items?: number[];
  delay?: number;
  variant?: "default" | "compact" | "pills" | "grid";
}

const TrustBanner = ({ items, delay = 0, variant = "default" }: TrustBannerProps) => {
  const displayed = items ? items.map((i) => TRUST_ITEMS[i]) : TRUST_ITEMS;

  if (variant === "pills") {
    return (
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, duration: 0.3 }}
        className="flex flex-wrap gap-2"
      >
        {displayed.map(({ icon: Icon, text }, i) => (
          <motion.span
            key={text}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + i * 0.06 }}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground/80 bg-card/60 backdrop-blur-sm px-3.5 py-2 rounded-full border border-border/50"
          >
            <Icon size={13} className="text-foreground" />
            {text}
          </motion.span>
        ))}
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, duration: 0.3 }}
        className="flex flex-wrap gap-5 justify-center"
      >
        {displayed.map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
            <Icon size={14} className="text-foreground/60" />
            {text}
          </span>
        ))}
      </motion.div>
    );
  }

  if (variant === "grid") {
    return (
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, duration: 0.35 }}
        className="grid grid-cols-2 gap-3"
      >
        {displayed.map(({ icon: Icon, text, detail }, i) => (
          <motion.div
            key={text}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: delay + 0.06 * i }}
            className="rounded-2xl bg-card p-4 flex flex-col gap-2.5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Icon size={18} className="text-foreground" />
            </div>
            <div>
              <span className="text-[13px] font-bold text-foreground block">{text}</span>
              {detail && <span className="text-[11px] text-muted-foreground">{detail}</span>}
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.35 }}
      className="space-y-3"
    >
      {displayed.map(({ icon: Icon, text, detail }, i) => (
        <motion.div
          key={text}
          initial={{ x: -8, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: delay + 0.06 * i }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Icon size={16} className="text-foreground" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-foreground">{text}</span>
            {detail && <span className="text-[11px] text-muted-foreground ml-1.5">· {detail}</span>}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrustBanner;
