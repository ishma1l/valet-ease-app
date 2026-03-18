import { motion } from "framer-motion";
import { ShieldCheck, Bell, Users, type LucideIcon } from "lucide-react";

interface TrustItem {
  icon: LucideIcon;
  text: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: ShieldCheck, text: "Vetted local professionals" },
  { icon: Bell, text: "30-minute arrival notice" },
  { icon: Users, text: "Trusted by local customers" },
];

interface TrustBannerProps {
  items?: number[];
  delay?: number;
  variant?: "default" | "compact";
}

const TrustBanner = ({ items, delay = 0, variant = "default" }: TrustBannerProps) => {
  const displayed = items ? items.map((i) => TRUST_ITEMS[i]) : TRUST_ITEMS;

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, duration: 0.3 }}
        className="flex flex-wrap gap-3 justify-center"
      >
        {displayed.map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            <Icon size={13} className="text-success" />
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
      transition={{ delay, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: "linear-gradient(135deg, hsl(var(--success-muted)), hsl(var(--accent)))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {displayed.map(({ icon: Icon, text }, i) => (
        <motion.div
          key={text}
          initial={{ x: -6, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: delay + 0.08 * i, duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-card flex items-center justify-center shrink-0"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <Icon size={15} className="text-success" />
          </div>
          <span className="text-[13px] text-foreground font-medium leading-snug">{text}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrustBanner;
