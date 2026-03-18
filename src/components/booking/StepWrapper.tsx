import { motion } from "framer-motion";
import { ReactNode } from "react";

const EASING: [number, number, number, number] = [0.4, 0, 0.2, 1];

interface StepWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const StepWrapper = ({ children, title, subtitle }: StepWrapperProps) => (
  <motion.div
    initial={{ x: 30, opacity: 0, filter: "blur(4px)" }}
    animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
    exit={{ x: -30, opacity: 0, filter: "blur(4px)" }}
    transition={{ duration: 0.35, ease: EASING }}
    className="flex flex-col gap-6 w-full"
  >
    <header>
      <motion.h1
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3, ease: EASING }}
        className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-foreground leading-tight"
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3, ease: EASING }}
          className="text-muted-foreground text-[0.9rem] mt-1.5 leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </header>
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.35, ease: EASING }}
    >
      {children}
    </motion.div>
  </motion.div>
);

export default StepWrapper;
