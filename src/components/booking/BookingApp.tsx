import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin, Clock, CheckCircle2,
  ChevronRight, ArrowLeft, Zap, Calendar, User, Phone, MapPinned,
  Loader2, Sparkles,
} from "lucide-react";
import StepWrapper from "./StepWrapper";
import ServiceCard from "./ServiceCard";
import TimeWindowCard from "./TimeWindowCard";
import TrustBanner from "./TrustBanner";
import heroImage from "@/assets/hero-car-wash.jpg";

interface BookingState {
  postcode: string;
  service: string | null;
  date: string;
  window: string;
  express: boolean;
  details: { name: string; phone: string; address: string };
}

const SERVICES = [
  { id: "basic", title: "Basic Wash", description: "Exterior hand wash & dry", price: 15 },
  { id: "valet", title: "Full Valet", description: "Complete interior & exterior", price: 25, tag: "Popular" },
  { id: "interior", title: "Interior Clean", description: "Deep interior detailing", price: 20 },
];

const WINDOWS = [
  { id: "morning", label: "Morning", time: "9 am – 12 pm" },
  { id: "afternoon", label: "Afternoon", time: "12 – 4 pm" },
  { id: "evening", label: "Evening", time: "4 – 7 pm" },
];

const STEP_COUNT = 4;

// Direction-aware slide transitions
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const slideTransition = {
  x: { type: "spring" as const, stiffness: 350, damping: 32 },
  opacity: { duration: 0.25 },
};

const BookingApp = () => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [booking, setBooking] = useState<BookingState>({
    postcode: "",
    service: null,
    date: "",
    window: "",
    express: false,
    details: { name: "", phone: "", address: "" },
  });

  const next = useCallback(() => {
    setDirection(1);
    setStep((s) => s + 1);
  }, []);

  const back = useCallback(() => {
    setDirection(-1);
    setStep((s) => s - 1);
  }, []);

  const selectedService = SERVICES.find((s) => s.id === booking.service);
  const total = (selectedService?.price || 0) + (booking.express ? 7 : 0);

  const confirmBooking = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      customer_name: booking.details.name,
      phone: booking.details.phone,
      address: booking.details.address,
      postcode: booking.postcode,
      service: booking.service!,
      service_price: selectedService?.price || 0,
      time_window: booking.window,
      booking_date: booking.date,
      express: booking.express,
      total_price: total,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Booking failed. Please try again.");
      return;
    }
    setConfirmed(true);
  };

  const canContinue = () => {
    if (step === 0) return booking.postcode.length >= 3;
    if (step === 1) return !!booking.service;
    if (step === 2) return booking.date && booking.window;
    if (step === 3) return booking.details.name && booking.details.phone && booking.details.address;
    return true;
  };

  const reset = () => {
    setDirection(1);
    setStep(0);
    setConfirmed(false);
    setBooking({ postcode: "", service: null, date: "", window: "", express: false, details: { name: "", phone: "", address: "" } });
  };

  // ─── Submitting Overlay ───
  if (submitting) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-[3px] border-muted border-t-primary"
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sparkles size={20} className="text-primary" />
            </motion.div>
          </div>
          <div className="text-center">
            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="font-bold text-lg text-foreground"
            >
              Confirming your booking
            </motion.p>
            <motion.p
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-muted-foreground text-[14px] mt-1"
            >
              Just a moment…
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Confirmation Screen ───
  if (confirmed) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-8"
        >
          <CheckCircle2 size={44} className="text-success" />
        </motion.div>

        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-extrabold tracking-tight text-foreground mb-2 text-center"
        >
          You're all set!
        </motion.h1>
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-center text-[15px] mb-10 max-w-[280px]"
        >
          We'll text you at {booking.details.phone} with a 30-minute heads up.
        </motion.p>

        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-sm bg-card rounded-3xl p-6 space-y-4"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          {[
            { label: "Service", value: selectedService?.title },
            { label: "Date", value: booking.date },
            { label: "Time", value: WINDOWS.find((w) => w.id === booking.window)?.time },
            ...(booking.express ? [{ label: "Express", value: "+£7" }] : []),
            { label: "Total", value: `£${total}`, bold: true },
          ].map(({ label, value, bold }, i) => (
            <motion.div
              key={label}
              initial={{ x: -12, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.45 + i * 0.06 }}
              className="flex justify-between items-center"
            >
              <span className="text-muted-foreground text-[14px]">{label}</span>
              <span className={`${bold ? "text-xl font-extrabold" : "font-semibold"} tabular-nums text-foreground`}>
                {value}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.button
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={reset}
          className="mt-8 w-full max-w-sm bg-primary text-primary-foreground font-bold text-[16px] py-4 rounded-2xl transition-shadow hover:shadow-lg"
        >
          Book Another Wash
        </motion.button>
      </div>
    );
  }

  // ─── Main Flow ───
  return (
    <div className="min-h-svh bg-background text-foreground font-sans flex flex-col">

      {/* ─── Top Bar ─── */}
      <AnimatePresence>
        {step > 0 && (
          <motion.nav
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-5 py-3 flex items-center justify-between"
          >
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--muted))" }}
              whileTap={{ scale: 0.9 }}
              onClick={back}
              className="w-10 h-10 rounded-full flex items-center justify-center -ml-2 transition-colors"
            >
              <ArrowLeft size={20} />
            </motion.button>

            {/* Progress dots */}
            <div className="flex gap-2">
              {Array.from({ length: STEP_COUNT }).map((_, i) => (
                <motion.div
                  key={i}
                  layout
                  className="h-1.5 rounded-full bg-primary"
                  initial={false}
                  animate={{
                    width: i <= step ? 24 : 6,
                    opacity: i <= step ? 1 : 0.2,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              ))}
            </div>

            <div className="w-10" />
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ─── Content ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>

          {/* ════════ STEP 0: Hero + Postcode ════════ */}
          {step === 0 && (
            <motion.div
              key="hero"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="flex flex-col flex-1"
            >
              {/* Hero image */}
              <div className="relative h-[52vh] min-h-[320px] overflow-hidden">
                <motion.img
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  src={heroImage}
                  alt="Premium car wash at your door"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              </div>

              {/* Content overlay */}
              <div className="relative -mt-28 z-10 px-6 flex flex-col flex-1">
                <motion.h1
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-[2rem] font-extrabold tracking-[-0.04em] leading-[1.1] text-foreground"
                >
                  Car Wash At{"\n"}
                  <span className="text-primary">Your Doorstep</span>
                </motion.h1>

                <motion.p
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground text-[15px] mt-3 leading-relaxed"
                >
                  Book in 60 seconds. We come to you.
                </motion.p>

                <motion.div
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6"
                >
                  <TrustBanner variant="compact" delay={0.45} />
                </motion.div>

                {/* Postcode input */}
                <motion.div
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 relative group"
                >
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
                  <input
                    type="text"
                    placeholder="Enter your postcode"
                    className="w-full bg-card rounded-2xl py-5 pr-5 text-[16px] font-medium placeholder:text-muted-foreground focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    style={{
                      paddingLeft: "3.25rem",
                      boxShadow: "var(--shadow-card)",
                      border: "1px solid hsl(var(--border))",
                    }}
                    value={booking.postcode}
                    onChange={(e) => setBooking({ ...booking, postcode: e.target.value.toUpperCase() })}
                  />
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 pb-8"
                >
                  <motion.button
                    whileHover={canContinue() ? { scale: 1.02, y: -2 } : {}}
                    whileTap={canContinue() ? { scale: 0.97 } : {}}
                    disabled={!canContinue()}
                    onClick={next}
                    className="w-full bg-primary text-primary-foreground font-bold text-[16px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 hover:shadow-lg disabled:shadow-none"
                    style={{ paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
                  >
                    Get Started
                    <ChevronRight size={18} />
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ════════ STEP 1: Service Selection ════════ */}
          {step === 1 && (
            <motion.div
              key="service"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
              <StepWrapper title="Pick your wash" subtitle="Choose a service that fits your needs.">
                <div className="px-6 space-y-4 pb-36">
                  {SERVICES.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <ServiceCard
                        {...s}
                        selected={booking.service === s.id}
                        onClick={(id) => setBooking({ ...booking, service: id })}
                      />
                    </motion.div>
                  ))}
                </div>
              </StepWrapper>
            </motion.div>
          )}

          {/* ════════ STEP 2: Date & Time ════════ */}
          {step === 2 && (
            <motion.div
              key="schedule"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
              <StepWrapper title="When works best?" subtitle="Pick a date and time window.">
                <div className="px-6 space-y-6 pb-36">
                  <div className="space-y-3">
                    <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Calendar size={13} />
                      Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full bg-card rounded-2xl py-5 px-5 text-[16px] font-medium focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        style={{ boxShadow: "var(--shadow-card)", border: "1px solid hsl(var(--border))" }}
                        value={booking.date}
                        onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Clock size={13} />
                      Time Window
                    </label>
                    <div className="space-y-3">
                      {WINDOWS.map((w, i) => (
                        <motion.div
                          key={w.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.12 + i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
                        >
                          <TimeWindowCard
                            {...w}
                            selected={booking.window === w.id}
                            onClick={(id) => setBooking({ ...booking, window: id })}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </StepWrapper>
            </motion.div>
          )}

          {/* ════════ STEP 3: Details + Express + Confirm ════════ */}
          {step === 3 && (
            <motion.div
              key="details"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
              <StepWrapper title="Almost done" subtitle="A few details and you're booked.">
                <div className="px-6 space-y-6 pb-36">
                  {/* Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <User size={13} />
                      Name
                    </label>
                    <input
                      placeholder="Your full name"
                      className="w-full bg-card rounded-2xl py-5 px-5 text-[16px] font-medium placeholder:text-muted-foreground focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      style={{ boxShadow: "var(--shadow-card)", border: "1px solid hsl(var(--border))" }}
                      value={booking.details.name}
                      onChange={(e) => setBooking({ ...booking, details: { ...booking.details, name: e.target.value } })}
                    />
                  </motion.div>

                  {/* Phone */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="space-y-2"
                  >
                    <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Phone size={13} />
                      Phone
                    </label>
                    <input
                      placeholder="07XXX XXXXXX"
                      type="tel"
                      className="w-full bg-card rounded-2xl py-5 px-5 text-[16px] font-medium placeholder:text-muted-foreground focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      style={{ boxShadow: "var(--shadow-card)", border: "1px solid hsl(var(--border))" }}
                      value={booking.details.phone}
                      onChange={(e) => setBooking({ ...booking, details: { ...booking.details, phone: e.target.value } })}
                    />
                  </motion.div>

                  {/* Address */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26 }}
                    className="space-y-2"
                  >
                    <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <MapPinned size={13} />
                      Address
                    </label>
                    <textarea
                      placeholder="Where should we come?"
                      rows={2}
                      className="w-full bg-card rounded-2xl py-5 px-5 text-[16px] font-medium placeholder:text-muted-foreground focus:outline-none resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      style={{ boxShadow: "var(--shadow-card)", border: "1px solid hsl(var(--border))" }}
                      value={booking.details.address}
                      onChange={(e) => setBooking({ ...booking, details: { ...booking.details, address: e.target.value } })}
                    />
                  </motion.div>

                  {/* Express Upsell */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.34 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.01, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setBooking({ ...booking, express: !booking.express })}
                      className={`w-full rounded-2xl p-6 flex items-center gap-5 text-left transition-all duration-200
                        ${booking.express ? "ring-2 ring-premium bg-premium-muted" : "bg-card"}`}
                      style={{ boxShadow: booking.express ? "0 0 0 3px hsl(var(--premium) / 0.15)" : "var(--shadow-card)" }}
                    >
                      <motion.div
                        animate={booking.express ? { rotate: [0, -10, 10, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-200
                          ${booking.express ? "bg-premium text-premium-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        <Zap size={24} fill={booking.express ? "currentColor" : "none"} />
                      </motion.div>
                      <div className="flex-1">
                        <span className="font-bold text-[15px] text-foreground block">Express — 1 hour</span>
                        <span className="text-muted-foreground text-[13px] mt-0.5 block">
                          Need it fast? We'll be there within the hour.
                        </span>
                      </div>
                      <span className="font-extrabold tabular-nums text-premium text-lg shrink-0">+£7</span>
                    </motion.button>
                  </motion.div>
                </div>
              </StepWrapper>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Sticky Bottom Bar ─── */}
      <AnimatePresence>
        {step > 0 && !confirmed && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border"
          >
            <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-4">
              <div className="flex-1">
                <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground block">Total</span>
                <motion.span
                  key={total}
                  initial={{ y: -8, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="text-2xl font-extrabold tabular-nums text-foreground block"
                >
                  £{total}
                </motion.span>
              </div>
              <motion.button
                whileHover={canContinue() ? { scale: 1.02, y: -1 } : {}}
                whileTap={canContinue() ? { scale: 0.97 } : {}}
                disabled={!canContinue()}
                onClick={step === 3 ? confirmBooking : next}
                className="flex-[2] bg-primary text-primary-foreground font-bold text-[16px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 hover:shadow-lg disabled:shadow-none"
                style={{ paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
              >
                {step === 3 ? "Confirm Booking" : "Continue"}
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronRight size={18} />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingApp;
