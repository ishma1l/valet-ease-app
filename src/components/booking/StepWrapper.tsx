import { motion } from "framer-motion";
import { forwardRef, ReactNode } from "react";

interface StepWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
}

const StepWrapper = forwardRef<HTMLDivElement, StepWrapperProps>(
  ({ children, title, subtitle, step, totalSteps }, ref) => (
    <motion.div
      ref={ref}
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col w-full pt-8 px-6"
    >
      {step !== undefined && totalSteps !== undefined && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2"
        >
          Step {step} of {totalSteps}
        </motion.p>
      )}
      <header className="mb-8">
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-foreground leading-[1.1]"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.14, duration: 0.3 }}
            className="text-muted-foreground text-[15px] mt-2.5 leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}
      </header>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        {children}
      </motion.div>
    </motion.div>
  )
);

StepWrapper.displayName = "StepWrapper";
export default StepWrapper;
