import { motion } from "framer-motion";
import { forwardRef, ReactNode } from "react";

interface StepWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const StepWrapper = forwardRef<HTMLDivElement, StepWrapperProps>(
  ({ children, title, subtitle }, ref) => (
    <motion.div
      ref={ref}
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col gap-8 w-full pt-2"
    >
      <header className="space-y-2">
        <motion.h1
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-foreground leading-[1.1]"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-muted-foreground text-[15px] leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}
      </header>
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
);

StepWrapper.displayName = "StepWrapper";

export default StepWrapper;
