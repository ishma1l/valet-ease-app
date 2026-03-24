import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { format, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  MapPin, Clock, CheckCircle2, ChevronRight, ArrowLeft, Zap,
  CalendarIcon, User, Phone, MapPinned, Sparkles,
  Shield, ShieldCheck, Bell, CreditCard, Star, Check,
  Droplets, Car,
} from "lucide-react";
import carIllustration from "@/assets/car-illustration.png";

/* ─── Types & Data ─── */
interface BookingState {
  postcode: string;
  service: string | null;
  date: Date | undefined;
  window: string;
  express: boolean;
  name: string;
  phone: string;
  address: string;
}

const SERVICES = [
  { id: "basic", title: "Basic Wash", description: "Exterior hand wash, rinse & dry", price: 15, duration: "30 min", icon: Droplets },
  { id: "valet", title: "Full Valet", description: "Complete interior & exterior clean", price: 25, tag: "Most Popular", duration: "60 min", icon: Sparkles },
  { id: "premium", title: "Premium Detail", description: "Deep clean, polish & wax treatment", price: 45, duration: "90 min", icon: Car },
];

const WINDOWS = [
  { id: "morning", label: "Morning", time: "9 – 12" },
  { id: "afternoon", label: "Afternoon", time: "12 – 4" },
  { id: "evening", label: "Evening", time: "4 – 7" },
];

const STEP_LABELS = ["Location", "Service", "Schedule", "Confirm"];
const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
};
const springTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

const BookingApp = () => {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [booking, setBooking] = useState<BookingState>({
    postcode: "", service: null, date: undefined, window: "",
    express: false, name: "", phone: "", address: "",
  });

  const go = useCallback((to: number) => { setDir(to > step ? 1 : -1); setStep(to); }, [step]);
  const next = useCallback(() => { setDir(1); setStep((s) => s + 1); }, []);
  const back = useCallback(() => { setDir(-1); setStep((s) => s - 1); }, []);

  const svc = SERVICES.find((s) => s.id === booking.service);
  const total = (svc?.price || 0) + (booking.express ? 7 : 0);

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      customer_name: booking.name,
      phone: booking.phone,
      address: booking.address,
      postcode: booking.postcode,
      service: booking.service!,
      service_price: svc?.price || 0,
      time_window: booking.window,
      booking_date: booking.date ? format(booking.date, "yyyy-MM-dd") : "",
      express: booking.express,
      total_price: total,
    });
    setSubmitting(false);
    if (error) { toast.error("Booking failed. Please try again."); return; }
    setConfirmed(true);
  };

  const canContinue = () => {
    if (step === 0) return booking.postcode.length >= 3;
    if (step === 1) return !!booking.service;
    if (step === 2) return !!booking.date && (!!booking.window || booking.express);
    if (step === 3) return booking.name && booking.phone && booking.address;
    return true;
  };

  const reset = () => {
    setDir(1); setStep(0); setConfirmed(false);
    setBooking({ postcode: "", service: null, date: undefined, window: "", express: false, name: "", phone: "", address: "" });
  };

  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  /* ─── Loading ─── */
  if (submitting) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 rounded-full border-[2.5px] border-muted border-t-foreground" />
          <div className="text-center">
            <p className="font-bold text-lg text-foreground">Confirming your booking</p>
            <p className="text-muted-foreground text-sm mt-1">This will only take a moment…</p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Success ─── */
  if (confirmed) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6 py-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle2 size={44} className="text-success" />
        </motion.div>
        <motion.h1 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-2xl font-extrabold tracking-tight text-foreground mb-2 text-center">
          You're all set!
        </motion.h1>
        <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-muted-foreground text-center text-sm mb-8 max-w-[280px] leading-relaxed">
          We'll text <span className="font-semibold text-foreground">{booking.phone}</span> 30 minutes before arrival.
        </motion.p>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="w-full max-w-sm rounded-2xl border border-border overflow-hidden">
          <div className="bg-foreground text-background px-5 py-4 flex items-center justify-between">
            <span className="font-bold text-sm">Booking confirmed</span>
            <span className="font-extrabold text-lg tabular-nums">£{total}</span>
          </div>
          <div className="p-5 space-y-3 bg-card">
            {[
              { l: "Service", v: svc?.title },
              { l: "Date", v: booking.date ? format(booking.date, "EEE, d MMM") : "" },
              { l: "Time", v: WINDOWS.find((w) => w.id === booking.window)?.time || "Express" },
              { l: "Location", v: booking.postcode },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{l}</span>
                <span className="font-semibold text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.button initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }} onClick={reset}
          className="mt-6 w-full max-w-sm bg-foreground text-background font-bold text-[15px] py-4 rounded-2xl">
          Book Another Wash
        </motion.button>
      </div>
    );
  }

  /* ═══════════ MAIN FLOW ═══════════ */
  return (
    <div className="min-h-svh bg-background text-foreground font-sans flex flex-col">

      {/* ─── Top Nav ─── */}
      <nav className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={back}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors -ml-1 mr-1">
                <ArrowLeft size={18} />
              </motion.button>
            )}
            <span className="text-lg font-extrabold tracking-tight">Valet Ease</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {STEP_LABELS[step]} <span className="font-semibold text-foreground">{step + 1}/{TOTAL_STEPS}</span>
          </span>
        </div>

        {/* Segmented progress bar */}
        <div className="max-w-lg mx-auto px-5 pb-0 flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="h-[3px] flex-1 rounded-full overflow-hidden bg-border">
              <motion.div
                className="h-full bg-foreground rounded-full"
                initial={false}
                animate={{ width: step > i ? "100%" : step === i ? "50%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>
      </nav>

      {/* ─── Step Content ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>

          {/* ══════ STEP 0: Location ══════ */}
          {step === 0 && (
            <motion.div key="location" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={springTransition}
              className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5">

              {/* Car illustration */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="flex justify-center py-8"
              >
                <img src={carIllustration} alt="Premium car detailing" width={320} height={204} className="object-contain" />
              </motion.div>

              {/* Headline */}
              <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <h1 className="text-[1.65rem] font-extrabold tracking-[-0.03em] leading-[1.15] text-foreground">
                  Professional detailing,<br />delivered to your driveway.
                </h1>
                <p className="text-muted-foreground text-sm mt-2.5 leading-relaxed">
                  Book a mobile car wash in under 60 seconds. We come to you.
                </p>
              </motion.div>

              {/* Postcode input */}
              <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="mt-6">
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter your postcode"
                    className="w-full bg-background rounded-xl pl-11 pr-4 py-4 text-[15px] font-medium placeholder:text-muted-foreground/50 focus:outline-none ring-1 ring-border focus:ring-2 focus:ring-foreground/20 transition-all"
                    value={booking.postcode}
                    onChange={(e) => setBooking({ ...booking, postcode: e.target.value.toUpperCase() })}
                  />
                </div>
              </motion.div>

              {/* Spacer + CTA at bottom */}
              <div className="mt-auto pt-8 pb-6">
                <motion.button
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileTap={canContinue() ? { scale: 0.97 } : {}}
                  disabled={!canContinue()}
                  onClick={next}
                  className="w-full bg-foreground text-background font-bold text-[15px] py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                >
                  Check Availability
                  <ChevronRight size={17} />
                </motion.button>

                {/* Trust items */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="mt-5 space-y-2.5">
                  {[
                    { icon: ShieldCheck, text: "Vetted local car care professionals" },
                    { icon: Bell, text: "We'll notify you 30 minutes before arrival" },
                    { icon: CreditCard, text: "Pay after confirmation" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                      <Icon size={14} className="shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 1: Service ══════ */}
          {step === 1 && (
            <motion.div key="service" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={springTransition}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">
              <header className="mb-6">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Choose a service</h1>
                <p className="text-sm text-muted-foreground mt-1">Select what your car needs</p>
              </header>

              <div className="space-y-3">
                {SERVICES.map((s, i) => {
                  const selected = booking.service === s.id;
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + i * 0.06, ...springTransition }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setBooking({ ...booking, service: s.id })}
                      className={cn(
                        "relative w-full rounded-xl text-left transition-all duration-200 overflow-hidden p-4",
                        selected ? "ring-2 ring-foreground bg-card" : "ring-1 ring-border bg-card"
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[15px] text-foreground">{s.title}</span>
                            {s.tag && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-foreground text-background px-2 py-0.5 rounded-full">
                                {s.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs mt-0.5">{s.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock size={10} /> {s.duration}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
                          <span className="text-lg font-extrabold tabular-nums text-foreground">£{s.price}</span>
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                            selected ? "bg-foreground text-background" : "border-2 border-border"
                          )}>
                            {selected && <Check size={11} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Express upsell */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-4">
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={() => setBooking({ ...booking, express: !booking.express, window: !booking.express ? "express" : "" })}
                  className={cn(
                    "w-full rounded-xl p-4 flex items-center gap-3.5 text-left transition-all duration-200",
                    booking.express ? "ring-2 ring-premium bg-premium-muted" : "ring-1 ring-border bg-card"
                  )}>
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    booking.express ? "bg-premium text-premium-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Zap size={20} fill={booking.express ? "currentColor" : "none"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm text-foreground block">Express — 1 hour</span>
                    <span className="text-muted-foreground text-xs block">Priority arrival within the hour</span>
                  </div>
                  <span className="font-extrabold tabular-nums text-premium shrink-0">+£7</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* ══════ STEP 2: Date & Time ══════ */}
          {step === 2 && (
            <motion.div key="schedule" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={springTransition}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">
              <header className="mb-6">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Pick date & time</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose when works for you</p>
              </header>

              {/* Date chips */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <CalendarIcon size={12} /> Date
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
                  {dateOptions.map((d, i) => {
                    const isSelected = booking.date && isSameDay(booking.date, d);
                    const isToday = i === 0;
                    return (
                      <motion.button
                        key={d.toISOString()}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.04 + i * 0.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setBooking({ ...booking, date: d })}
                        className={cn(
                          "flex flex-col items-center min-w-[56px] py-2.5 px-2 rounded-xl transition-all duration-200 shrink-0",
                          isSelected
                            ? "bg-foreground text-background ring-2 ring-foreground"
                            : "bg-card ring-1 ring-border hover:ring-foreground/20"
                        )}
                      >
                        <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-background/70" : "text-muted-foreground")}>
                          {isToday ? "TMR" : format(d, "EEE")}
                        </span>
                        <span className={cn("text-lg font-extrabold tabular-nums leading-tight mt-0.5", isSelected ? "text-background" : "text-foreground")}>
                          {format(d, "d")}
                        </span>
                        <span className={cn("text-[10px] font-medium", isSelected ? "text-background/70" : "text-muted-foreground")}>
                          {format(d, "MMM")}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Clock size={12} /> Time
                </p>
                <div className="space-y-2.5">
                  {WINDOWS.map((w, i) => {
                    const isSelected = booking.window === w.id;
                    return (
                      <motion.button
                        key={w.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        whileTap={booking.express ? undefined : { scale: 0.98 }}
                        disabled={booking.express}
                        onClick={() => setBooking({ ...booking, window: w.id })}
                        className={cn(
                          "w-full rounded-xl p-4 flex items-center justify-between transition-all duration-200",
                          booking.express
                            ? "bg-muted/50 ring-1 ring-border opacity-40 cursor-not-allowed"
                            : isSelected
                              ? "bg-foreground text-background ring-2 ring-foreground"
                              : "bg-card ring-1 ring-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center",
                            isSelected ? "bg-background/15" : "bg-muted"
                          )}>
                            <Clock size={15} className={isSelected ? "text-background" : "text-muted-foreground"} />
                          </div>
                          <div className="text-left">
                            <span className={cn("font-bold text-sm block", isSelected ? "text-background" : "text-foreground")}>{w.label}</span>
                            <span className={cn("text-xs", isSelected ? "text-background/70" : "text-muted-foreground")}>{w.time}</span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                {booking.express && (
                  <p className="text-xs text-premium font-medium mt-3 flex items-center gap-1.5">
                    <Zap size={12} /> Express selected — we'll arrive within 1 hour
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 3: Details & Confirm ══════ */}
          {step === 3 && (
            <motion.div key="confirm" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={springTransition}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">
              <header className="mb-6">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Your details</h1>
                <p className="text-sm text-muted-foreground mt-1">Where should we come?</p>
              </header>

              <div className="space-y-4">
                <InputField icon={MapPinned} label="Address" placeholder="House number & street" value={booking.address}
                  onChange={(v) => setBooking({ ...booking, address: v })} delay={0.08} />
                <div className="grid grid-cols-2 gap-3">
                  <InputField icon={User} label="Name" placeholder="Full name" value={booking.name}
                    onChange={(v) => setBooking({ ...booking, name: v })} delay={0.12} />
                  <InputField icon={Phone} label="Phone" placeholder="07XXX" type="tel" value={booking.phone}
                    onChange={(v) => setBooking({ ...booking, phone: v })} delay={0.15} />
                </div>
              </div>

              {/* Summary card */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="mt-6 rounded-xl border border-border overflow-hidden">
                <div className="p-4 bg-card space-y-3">
                  {[
                    { label: "Service", value: svc?.title || "—" },
                    { label: "Date", value: booking.date ? format(booking.date, "EEE, d MMM") : "—" },
                    { label: "Time", value: booking.express ? "Express (1hr)" : (WINDOWS.find((w) => w.id === booking.window)?.time || "—") },
                    { label: "Postcode", value: booking.postcode },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/50 px-4 py-3 flex justify-between items-center border-t border-border">
                  <span className="font-bold text-sm text-foreground">Total</span>
                  <span className="text-xl font-extrabold tabular-nums text-foreground">£{total}</span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="flex items-center gap-2 justify-center text-xs text-muted-foreground mt-4">
                <Shield size={13} className="text-success" />
                <span>Secure booking · Fully insured · Cancel anytime</span>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ─── Bottom Bar ─── */}
      <AnimatePresence>
        {step >= 1 && !confirmed && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border">
            <div className="max-w-lg mx-auto px-5 py-3.5 flex items-center gap-4">
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">Total</span>
                <motion.span key={total} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="text-xl font-extrabold tabular-nums text-foreground block leading-tight">
                  £{total}
                </motion.span>
              </div>
              <motion.button
                whileTap={canContinue() ? { scale: 0.97 } : {}}
                disabled={!canContinue() || submitting}
                onClick={step === 3 ? confirm : next}
                className="flex-[2] bg-foreground text-background font-bold text-[15px] py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-30"
              >
                {step === 3 ? (
                  <>Confirm Booking <CheckCircle2 size={16} /></>
                ) : (
                  <>Continue <ChevronRight size={16} /></>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Reusable Input Field ─── */
interface InputFieldProps {
  icon: typeof MapPin;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  delay?: number;
  type?: string;
}

const InputField = ({ icon: Icon, label, placeholder, value, onChange, delay = 0, type = "text" }: InputFieldProps) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
      <Icon size={11} /> {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full bg-card rounded-xl px-4 py-3.5 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 ring-1 ring-border transition-all"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </motion.div>
);

export default BookingApp;
