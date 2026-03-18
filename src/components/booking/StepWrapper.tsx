import { motion } from "framer-motion";
import { ReactNode } from "react";

const EASING = [0.4, 0, 0.2, 1];

interface StepWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const StepWrapper = ({ children, title, subtitle }: StepWrapperProps) => (
  <motion.div
    initial={{ x: 20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -20, opacity: 0 }}
    transition={{ duration: 0.3, ease: EASING }}
    className="flex flex-col gap-6 w-full"
  >
    <header>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
    </header>
    {children}
  </motion.div>
);

export default StepWrapper;
