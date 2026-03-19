import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  MapPin, Clock, CheckCircle2, ChevronRight, ArrowLeft, Zap,
  CalendarIcon, User, Phone, MapPinned, Loader2, Sparkles,
  Navigation, Shield, Edit3,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import StepWrapper from "./StepWrapper";
import ServiceCard from "./ServiceCard";
import TimeWindowCard from "./TimeWindowCard";
import TrustBanner from "./TrustBanner";
import heroImage from "@/assets/hero-car-wash.jpg";

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
  { id: "basic", title: "Basic Wash", description: "Exterior hand wash & dry", price: 15 },
  { id: "valet", title: "Full Valet", description: "Complete interior & exterior", price: 25, tag: "Popular" },
  { id: "interior", title: "Interior Clean", description: "Deep interior detailing", price: 20 },
];

const WINDOWS = [
  { id: "morning", label: "Morning", time: "9 am – 12 pm" },
  { id: "afternoon", label: "Afternoon", time: "12 – 4 pm" },
  { id: "evening", label: "Evening", time: "4 – 7 pm" },
];

const TOTAL_STEPS = 4;

/* ─── Transition variants ─── */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0, scale: 0.98 }),
};
const springTransition = {
  x: { type: "spring" as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
  scale: { duration: 0.3 },
};

/* ═══════════════════════════════════════════ */
const BookingApp = () => {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [booking, setBooking] = useState<BookingState>({
    postcode: "", service: null, date: undefined, window: "",
    express: false, name: "", phone: "", address: "",
  });

  const go = useCallback((to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
  }, [step]);
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
    if (step === 0) return true; // hero → always
    if (step === 1) return !!booking.service;
    if (step === 2) return !!booking.date && !!booking.window;
    if (step === 3) return booking.name && booking.phone && booking.address && booking.postcode;
    if (step === 4) return true; // review
    return true;
  };

  const reset = () => {
    setDir(1); setStep(0); setConfirmed(false);
    setBooking({ postcode: "", service: null, date: undefined, window: "", express: false, name: "", phone: "", address: "" });
  };

  /* ─── Full-screen loading overlay ─── */
  if (submitting) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 rounded-full border-[3px] border-muted border-t-primary"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={24} className="text-primary" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-bold text-xl text-foreground">Confirming your booking</p>
            <p className="text-muted-foreground text-[15px] mt-2">Just a moment…</p>
          </div>
          {/* Animated dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Success screen ─── */
  if (confirmed) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-8"
        >
          <CheckCircle2 size={52} className="text-success" />
        </motion.div>

        <motion.h1
          initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[1.75rem] font-extrabold tracking-tight text-foreground mb-2 text-center"
        >
          You're all set!
        </motion.h1>
        <motion.p
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-center text-[15px] mb-10 max-w-[300px] leading-relaxed"
        >
          We'll send a text to <span className="font-semibold text-foreground">{booking.phone}</span> 30 minutes before arrival.
        </motion.p>

        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-sm bg-card rounded-3xl p-6 space-y-3"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          {[
            { l: "Service", v: svc?.title },
            { l: "Date", v: booking.date ? format(booking.date, "EEE, d MMM") : "" },
            { l: "Time", v: WINDOWS.find((w) => w.id === booking.window)?.time },
            { l: "Location", v: booking.postcode },
            ...(booking.express ? [{ l: "Express", v: "+£7" }] : []),
          ].map(({ l, v }, i) => (
            <motion.div key={l} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.45 + i * 0.05 }}
              className="flex justify-between items-center py-1.5"
            >
              <span className="text-muted-foreground text-[14px]">{l}</span>
              <span className="font-semibold text-foreground">{v}</span>
            </motion.div>
          ))}
          <div className="pt-3 mt-2 border-t border-border flex justify-between items-center">
            <span className="font-bold text-foreground">Total</span>
            <span className="text-2xl font-extrabold tabular-nums text-foreground">£{total}</span>
          </div>
        </motion.div>

        <motion.button
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
          onClick={reset}
          className="mt-8 w-full max-w-sm bg-primary text-primary-foreground font-bold text-[16px] py-[1.125rem] rounded-2xl transition-shadow hover:shadow-lg"
        >
          Book Another Wash
        </motion.button>
      </div>
    );
  }

  /* ═══════════════ MAIN FLOW ═══════════════ */
  return (
    <div className="min-h-svh bg-background text-foreground font-sans flex flex-col">

      {/* ─── Top Nav ─── */}
      <AnimatePresence>
        {step > 0 && (
          <motion.nav
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-5 py-3.5 flex items-center justify-between"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={back}
              className="w-10 h-10 rounded-full flex items-center justify-center -ml-2 hover:bg-muted transition-colors"
            >
              <ArrowLeft size={20} />
            </motion.button>

            {/* Progress bar */}
            <div className="flex-1 mx-6">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={false}
                  animate={{ width: `${(Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
            </div>

            <span className="text-[12px] font-bold text-muted-foreground tabular-nums w-10 text-right">
              {Math.min(step, TOTAL_STEPS)}/{TOTAL_STEPS}
            </span>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ─── Content ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>

          {/* ══════ STEP 0: Hero ══════ */}
          {step === 0 && (
            <motion.div
              key="hero"
              custom={dir}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={springTransition}
              className="flex flex-col flex-1"
            >
              <div className="relative h-[56vh] min-h-[340px] overflow-hidden">
                <motion.img
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  src={heroImage}
                  alt="Premium car wash at your door"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>

              <div className="relative -mt-32 z-10 px-6 flex flex-col flex-1">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <h1 className="text-[2.25rem] font-extrabold tracking-[-0.04em] leading-[1.05] text-foreground">
                    Car Wash At<br />
                    <span className="text-primary">Your Doorstep</span>
                  </h1>
                  <p className="text-muted-foreground text-[16px] mt-3 leading-relaxed max-w-[280px]">
                    Book in 60 seconds. We come to you.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-7"
                >
                  <TrustBanner variant="pills" delay={0.35} />
                </motion.div>

                <motion.div
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="mt-auto pt-8 pb-8"
                >
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={next}
                    className="w-full bg-primary text-primary-foreground font-bold text-[17px] py-[1.125rem] rounded-2xl flex items-center justify-center gap-2.5 hover:shadow-lg transition-shadow"
                  >
                    Book Now
                    <ChevronRight size={20} />
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 1: Service ══════ */}
          {step === 1 && (
            <motion.div
              key="service"
              custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={springTransition}
            >
              <StepWrapper step={1} totalSteps={TOTAL_STEPS} title="Choose your service" subtitle="Select what works best for your car.">
                <div className="space-y-4 pb-36">
                  {SERVICES.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 260, damping: 22 }}
                    >
                      <ServiceCard
                        {...s}
                        selected={booking.service === s.id}
                        onClick={(id) => setBooking({ ...booking, service: id })}
                      />
                    </motion.div>
                  ))}

                  {/* Express upsell */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.button
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setBooking({ ...booking, express: !booking.express })}
                      className={`w-full rounded-2xl p-5 flex items-center gap-4 text-left transition-all duration-300
                        ${booking.express ? "ring-[2.5px] ring-premium bg-premium-muted" : "ring-1 ring-border bg-card"}`}
                      style={{ boxShadow: booking.express ? "0 6px 24px -4px hsl(var(--premium) / 0.2)" : "0 2px 8px -2px rgba(0,0,0,0.04)" }}
                    >
                      <motion.div
                        animate={booking.express ? { rotate: [0, -12, 12, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300
                          ${booking.express ? "bg-premium text-premium-foreground shadow-md" : "bg-muted text-muted-foreground"}`}
                      >
                        <Zap size={22} fill={booking.express ? "currentColor" : "none"} />
                      </motion.div>
                      <div className="flex-1">
                        <span className="font-bold text-[15px] text-foreground block">Express — 1 hour</span>
                        <span className="text-muted-foreground text-[12px] mt-0.5 block">We arrive within the hour</span>
                      </div>
                      <span className="font-extrabold tabular-nums text-premium text-lg shrink-0">+£7</span>
                    </motion.button>
                  </motion.div>
                </div>
              </StepWrapper>
            </motion.div>
          )}

          {/* ══════ STEP 2: Date & Time ══════ */}
          {step === 2 && (
            <motion.div
              key="schedule"
              custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={springTransition}
            >
              <StepWrapper step={2} totalSteps={TOTAL_STEPS} title="Pick a date & time" subtitle="When should we come?">
                <div className="space-y-6 pb-36">
                  {/* Calendar date picker */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon size={12} />
                      Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <motion.button
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "w-full rounded-2xl p-5 text-left font-medium text-[16px] transition-all duration-200 ring-1 ring-border bg-card",
                            !booking.date && "text-muted-foreground"
                          )}
                          style={{ boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)" }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                              <CalendarIcon size={18} className="text-primary" />
                            </div>
                            <span>{booking.date ? format(booking.date, "EEEE, d MMMM yyyy") : "Choose a date"}</span>
                          </div>
                        </motion.button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                          mode="single"
                          selected={booking.date}
                          onSelect={(d) => setBooking({ ...booking, date: d })}
                          disabled={(d) => d < new Date()}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time windows */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                      <Clock size={12} />
                      Time Window
                    </label>
                    <div className="space-y-3">
                      {WINDOWS.map((w, i) => (
                        <motion.div
                          key={w.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 280, damping: 22 }}
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

          {/* ══════ STEP 3: Location & Details ══════ */}
          {step === 3 && (
            <motion.div
              key="location"
              custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={springTransition}
            >
              <StepWrapper step={3} totalSteps={TOTAL_STEPS} title="Where are you?" subtitle="Tell us where to find your car.">
                <div className="space-y-5 pb-36">

                  {/* Map-style visual */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-3xl overflow-hidden bg-accent relative h-[160px] flex items-center justify-center"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="absolute inset-0 opacity-[0.08]"
                      style={{
                        backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
                        backgroundSize: "20px 20px",
                      }}
                    />
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="flex flex-col items-center gap-2 relative z-10"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                        <Navigation size={20} />
                      </div>
                      <div className="w-3 h-3 rounded-full bg-primary/30" />
                    </motion.div>
                  </motion.div>

                  {/* Postcode */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                      <MapPin size={12} />
                      Postcode
                    </label>
                    <input
                      placeholder="e.g. SW1A 1AA"
                      className="w-full bg-card rounded-2xl py-4.5 px-5 text-[16px] font-medium placeholder:text-muted-foreground focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 ring-1 ring-border"
                      style={{ boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)", paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
                      value={booking.postcode}
                      onChange={(e) => setBooking({ ...booking, postcode: e.target.value.toUpperCase() })}
                    />
                  </motion.div>

                  {/* Address */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                      <MapPinned size={12} />
                      Address
                    </label>
                    <textarea
                      placeholder="Where should we come?"
                      rows={2}
                      className="w-full bg-card rounded-2xl py-4.5 px-5 text-[16px] font-medium placeholder:text-muted-foreground focus:outline-none resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 ring-1 ring-border"
                      style={{ boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)", paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
                      value={booking.address}
                      onChange={(e) => setBooking({ ...booking, address: e.target.value })}
                    />
                  </motion.div>

                  {/* Name & Phone — side by side for minimal feel */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                        <User size={12} />
                        Name
                      </label>
                      <input
                        placeholder="Full name"
                        className="w-full bg-card rounded-2xl py-4.5 px-4 text-[15px] font-medium placeholder:text-muted-foreground focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 ring-1 ring-border"
                        style={{ boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)", paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
                        value={booking.name}
                        onChange={(e) => setBooking({ ...booking, name: e.target.value })}
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                        <Phone size={12} />
                        Phone
                      </label>
                      <input
                        placeholder="07XXX"
                        type="tel"
                        className="w-full bg-card rounded-2xl py-4.5 px-4 text-[15px] font-medium placeholder:text-muted-foreground focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 ring-1 ring-border"
                        style={{ boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)", paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
                        value={booking.phone}
                        onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
                      />
                    </motion.div>
                  </div>
                </div>
              </StepWrapper>
            </motion.div>
          )}

          {/* ══════ STEP 4: Review & Confirm ══════ */}
          {step === 4 && (
            <motion.div
              key="review"
              custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={springTransition}
            >
              <StepWrapper step={4} totalSteps={TOTAL_STEPS} title="Review your booking" subtitle="Everything look good?">
                <div className="space-y-5 pb-36">
                  {/* Summary card */}
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.12, type: "spring", stiffness: 250, damping: 22 }}
                    className="bg-card rounded-3xl overflow-hidden"
                    style={{ boxShadow: "var(--shadow-elevated)" }}
                  >
                    {/* Service header */}
                    <div className="bg-primary/5 p-6 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                        style={{ boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)" }}
                      >
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-[17px] text-foreground">{svc?.title}</p>
                        <p className="text-muted-foreground text-[13px]">{svc?.description}</p>
                      </div>
                    </div>

                    {/* Details rows */}
                    <div className="p-6 space-y-4">
                      {[
                        { icon: CalendarIcon, label: "Date", value: booking.date ? format(booking.date, "EEE, d MMM yyyy") : "" },
                        { icon: Clock, label: "Time", value: WINDOWS.find((w) => w.id === booking.window)?.time },
                        { icon: MapPin, label: "Location", value: `${booking.address}, ${booking.postcode}` },
                        { icon: User, label: "Contact", value: `${booking.name} · ${booking.phone}` },
                      ].map(({ icon: Ic, label, value }, i) => (
                        <motion.div
                          key={label}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.25 + i * 0.06 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Ic size={16} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                            <p className="text-[14px] font-medium text-foreground truncate">{value}</p>
                          </div>
                        </motion.div>
                      ))}

                      {booking.express && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-lg bg-premium-muted flex items-center justify-center shrink-0">
                            <Zap size={16} className="text-premium" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Express</p>
                            <p className="text-[14px] font-medium text-premium">Within 1 hour (+£7)</p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="border-t border-border mx-6" />
                    <div className="p-6 flex justify-between items-center">
                      <span className="font-bold text-foreground text-[15px]">Total</span>
                      <motion.span
                        key={total}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[1.75rem] font-extrabold tabular-nums text-foreground"
                      >
                        £{total}
                      </motion.span>
                    </div>
                  </motion.div>

                  {/* Trust */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 justify-center text-[12px] text-muted-foreground"
                  >
                    <Shield size={14} className="text-success" />
                    <span>Secure booking · Fully insured · Cancel anytime</span>
                  </motion.div>

                  {/* Edit button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => go(1)}
                    className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-primary bg-accent hover:bg-accent/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 size={14} />
                    Edit booking
                  </motion.button>
                </div>
              </StepWrapper>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Sticky Bottom Bar ─── */}
      <AnimatePresence>
        {step >= 1 && step <= 4 && !confirmed && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border"
          >
            <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-4">
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground block">Total</span>
                <motion.span
                  key={total}
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="text-[1.5rem] font-extrabold tabular-nums text-foreground block leading-tight"
                >
                  £{total}
                </motion.span>
              </div>
              <motion.button
                whileHover={canContinue() ? { scale: 1.02, y: -1 } : {}}
                whileTap={canContinue() ? { scale: 0.97 } : {}}
                disabled={!canContinue() || submitting}
                onClick={step === 4 ? confirm : next}
                className="flex-[2] bg-primary text-primary-foreground font-bold text-[16px] rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 hover:shadow-lg disabled:shadow-none"
                style={{ paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
              >
                {step === 4 ? (
                  <>
                    Confirm & Pay
                    <CheckCircle2 size={18} />
                  </>
                ) : (
                  <>
                    Continue
                    <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                      <ChevronRight size={18} />
                    </motion.div>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingApp;
