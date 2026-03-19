import { motion } from "framer-motion";
import { ShieldCheck, Clock, Truck, Award, type LucideIcon } from "lucide-react";

interface TrustItem {
  icon: LucideIcon;
  text: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: ShieldCheck, text: "Fully insured" },
  { icon: Award, text: "Certified pros" },
  { icon: Truck, text: "We come to you" },
  { icon: Clock, text: "60-sec booking" },
];

interface TrustBannerProps {
  delay?: number;
  variant?: "default" | "pills";
}

const TrustBanner = ({ delay = 0, variant = "default" }: TrustBannerProps) => {
  if (variant === "pills") {
    return (
      <div className="flex flex-wrap gap-2">
        {TRUST_ITEMS.map(({ icon: Icon, text }, i) => (
          <motion.span
            key={text}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + i * 0.05 }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full"
          >
            <Icon size={12} />
            {text}
          </motion.span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {TRUST_ITEMS.map(({ icon: Icon, text }, i) => (
        <motion.span
          key={text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + i * 0.05 }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
        >
          <Icon size={13} />
          {text}
        </motion.span>
      ))}
    </div>
  );
};

export default TrustBanner;
