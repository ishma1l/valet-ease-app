import { motion } from "framer-motion";
import { ShieldCheck, Bell, Users, type LucideIcon } from "lucide-react";

interface TrustItem {
  icon: LucideIcon;
  text: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: ShieldCheck, text: "Vetted professionals" },
  { icon: Bell, text: "30-min arrival notice" },
  { icon: Users, text: "Trusted locally" },
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
        className="flex flex-wrap gap-4 justify-center"
      >
        {displayed.map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
            <Icon size={14} className="text-success" />
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
      className="rounded-2xl bg-muted p-5 space-y-4"
    >
      {displayed.map(({ icon: Icon, text }, i) => (
        <motion.div
          key={text}
          initial={{ x: -6, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: delay + 0.08 * i, duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center shrink-0"
            style={{ boxShadow: "var(--shadow-xs)" }}
          >
            <Icon size={16} className="text-success" />
          </div>
          <span className="text-[13px] text-foreground font-medium">{text}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrustBanner;
