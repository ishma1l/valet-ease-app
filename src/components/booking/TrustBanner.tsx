import { motion } from "framer-motion";
import { ShieldCheck, Bell, CreditCard, type LucideIcon } from "lucide-react";

interface TrustItem {
  icon: LucideIcon;
  text: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: ShieldCheck, text: "Vetted local car care professionals" },
  { icon: Bell, text: "We'll notify you 30 minutes before arrival" },
  { icon: CreditCard, text: "Pay after confirmation" },
];

interface TrustBannerProps {
  /** Show only specific indices, or all if omitted */
  items?: number[];
  delay?: number;
}

const TrustBanner = ({ items, delay = 0 }: TrustBannerProps) => {
  const displayed = items ? items.map((i) => TRUST_ITEMS[i]) : TRUST_ITEMS;

  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col gap-3 py-2"
    >
      {displayed.map(({ icon: Icon, text }, i) => (
        <motion.div
          key={text}
          initial={{ x: -6, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: delay + 0.08 * i, duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="w-7 h-7 rounded-lg bg-success-muted flex items-center justify-center shrink-0">
            <Icon size={14} className="text-success" />
          </div>
          <span className="text-[13px] text-muted-foreground leading-snug">{text}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrustBanner;
