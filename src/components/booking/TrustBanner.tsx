import { motion } from "framer-motion";
import { ShieldCheck, Bell, Users, Star, type LucideIcon } from "lucide-react";

interface TrustItem {
  icon: LucideIcon;
  text: string;
  detail?: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: Star, text: "4.9★ rated", detail: "500+ reviews" },
  { icon: ShieldCheck, text: "Fully insured", detail: "Vetted pros" },
  { icon: Bell, text: "30-min notice", detail: "Before arrival" },
  { icon: Users, text: "Local team", detail: "Trusted service" },
];

interface TrustBannerProps {
  items?: number[];
  delay?: number;
  variant?: "default" | "compact" | "pills";
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
        {displayed.map(({ icon: Icon, text }) => (
          <span
            key={text}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground bg-muted px-3.5 py-2 rounded-full"
          >
            <Icon size={13} className="text-primary" />
            {text}
          </span>
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
        className="flex flex-wrap gap-4 justify-center"
      >
        {displayed.map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
            <Icon size={14} className="text-primary" />
            {text}
          </span>
        ))}
      </motion.div>
    );
  }

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
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: delay + 0.06 * i }}
          className="rounded-2xl bg-card p-4 flex flex-col items-center text-center gap-2"
          style={{ boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)", border: "1px solid hsl(var(--border))" }}
        >
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Icon size={18} className="text-primary" />
          </div>
          <span className="text-[13px] font-bold text-foreground leading-tight">{text}</span>
          {detail && <span className="text-[11px] text-muted-foreground">{detail}</span>}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrustBanner;
