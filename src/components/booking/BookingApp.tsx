import { useState, useCallback, useRef, useEffect } from "react";
import BeforeAfterComparison from "@/components/photos/BeforeAfterComparison";
import { NotificationBell, NotificationToast } from "@/components/notifications/NotificationCenter";
import { pushNotification } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { format, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  MapPin, Clock, CheckCircle2, ChevronRight, ArrowLeft,
  CalendarIcon, User, Phone, Sparkles, Package, Repeat, Crown, Zap, TrendingDown,
  Shield, ShieldCheck, Check, Plus,
  Droplets, Car, LocateFixed, Navigation,
  Wind, Paintbrush, SprayCan, Armchair, Home,
  Sun, CloudSun, Sunset, AlertCircle,
} from "lucide-react";
import carIllustration from "@/assets/car-illustration.png";
import carSmall from "@/assets/car-small.png";
import carSedan from "@/assets/car-sedan.png";
import carSuv from "@/assets/car-suv.png";
import carVan from "@/assets/car-van.png";

/* ─── Default business slug (Valet Ease main) ─── */
const DEFAULT_BUSINESS_SLUG = "valet-ease";

/* ─── Types ─── */
type PlanType = "once" | "weekly" | "monthly";

interface BookingState {
  service: string | null;
  carType: string | null;
  addons: string[];
  plan: PlanType;
  date: Date | undefined;
  window: string;
  name: string;
  phone: string;
  address: string;
  postcode: string;
}

/* ─── Plan Data ─── */
const PLANS: { id: PlanType; label: string; desc: string; discount: number; icon: typeof Repeat; tag?: string; perks: string[]; yearlyDesc?: string }[] = [
  { id: "once", label: "One-time", desc: "Single booking", discount: 0, icon: Zap, perks: ["Pay as you go", "No commitment"] },
  { id: "weekly", label: "Weekly", desc: "Every week", discount: 20, icon: Repeat, tag: "Best value", perks: ["20% off every wash", "Priority scheduling", "Free add-on each month", "Cancel anytime"], yearlyDesc: "Save up to £780/year" },
  { id: "monthly", label: "Monthly", desc: "Once a month", discount: 10, icon: Crown, tag: "Popular", perks: ["10% off every wash", "Flexible rescheduling", "Cancel anytime"], yearlyDesc: "Save up to £54/year" },
];

/* ─── Data ─── */
const SERVICES = [
  { id: "basic", title: "Basic Wash", desc: "Exterior hand wash, rinse & dry", price: 15, duration: "30 min", icon: Droplets, color: "bg-sky-50 text-sky-600", includes: ["Exterior wash", "Rinse & dry", "Window clean"] },
  { id: "valet", title: "Full Valet", desc: "Complete interior & exterior", price: 25, duration: "60 min", icon: Sparkles, tag: "Popular", color: "bg-amber-50 text-amber-600", includes: ["Everything in Basic", "Interior vacuum", "Dashboard wipe", "Air freshener"] },
  { id: "premium", title: "Premium Detail", desc: "Deep clean, polish & wax", price: 45, duration: "90 min", icon: Car, color: "bg-violet-50 text-violet-600", includes: ["Everything in Full Valet", "Clay bar treatment", "Hand polish", "Wax protection"] },
];

const CAR_TYPES = [
  { id: "small", label: "Small", example: "Corsa, Polo, Yaris", img: carSmall, multiplier: 1 },
  { id: "sedan", label: "Sedan", example: "Golf, Focus, A3", img: carSedan, multiplier: 1, tag: "Most Popular" },
  { id: "suv", label: "SUV", example: "X5, Q7, Range Rover", img: carSuv, multiplier: 1.3 },
  { id: "van", label: "Van", example: "Transit, Sprinter", img: carVan, multiplier: 1.5 },
];

const ADDONS = [
  { id: "airfresh", title: "Air Freshener", desc: "Long-lasting premium scent", price: 3, icon: Wind },
  { id: "tyre", title: "Tyre Shine", desc: "Glossy wheel finish", price: 5, icon: SprayCan },
  { id: "leather", title: "Leather Care", desc: "Condition & protect seats", price: 8, icon: Armchair },
  { id: "clay", title: "Clay Bar", desc: "Remove surface contaminants", price: 12, icon: Paintbrush },
];

const WINDOWS = [
  { id: "morning", label: "Morning", time: "9 – 12", icon: Sun, slots: 2, color: "bg-amber-50 text-amber-500" },
  { id: "afternoon", label: "Afternoon", time: "12 – 4", icon: CloudSun, slots: 4, tag: "Next available", color: "bg-sky-50 text-sky-500" },
  { id: "evening", label: "Evening", time: "4 – 7", icon: Sunset, slots: 1, color: "bg-violet-50 text-violet-500" },
];

// Merged service+addons into step 0, removed separate extras step
const STEP_LABELS = ["Package", "Vehicle", "Date", "Time", "Location", "Review"];
const TOTAL_STEPS = STEP_LABELS.length;

/* ─── Animation ─── */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};
const spring = { type: "spring" as const, stiffness: 350, damping: 32, mass: 0.7 };

/* ═══════════════════════════════════════════════ */
const BookingApp = () => {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);
  const [booking, setBooking] = useState<BookingState>({
    service: null, carType: null, addons: [], plan: "weekly" as PlanType, date: undefined,
    window: "", name: "", phone: "", address: "", postcode: "",
  });
  const [defaultBusinessId, setDefaultBusinessId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    supabase.from("businesses").select("id").eq("slug", DEFAULT_BUSINESS_SLUG).maybeSingle()
      .then(({ data }) => { if (data) setDefaultBusinessId(data.id); });
  }, []);

  const goTo = useCallback((to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const next = useCallback(() => {
    clearTimeout(autoAdvanceTimer.current);
    setDir(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const back = useCallback(() => {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Auto-advance helper for single-choice steps
  const selectAndAdvance = useCallback((updater: (b: BookingState) => BookingState) => {
    setBooking(updater);
    clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => next(), 400);
  }, [next]);

  const svc = SERVICES.find((s) => s.id === booking.service);
  const carType = CAR_TYPES.find((c) => c.id === booking.carType);
  const activePlan = PLANS.find((p) => p.id === booking.plan) || PLANS[0];
  const multiplier = carType?.multiplier || 1;
  const baseServicePrice = Math.round((svc?.price || 0) * multiplier);
  const baseAddonsTotal = ADDONS.filter((a) => booking.addons.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const discountPct = activePlan.discount;
  const baseTotal = baseServicePrice + baseAddonsTotal;
  const discountAmount = Math.round(baseTotal * discountPct / 100);
  const servicePrice = baseServicePrice; // for DB
  const addonsTotal = baseAddonsTotal;
  const total = baseTotal - discountAmount;

  const toggleAddon = (id: string) => {
    setBooking((b) => ({
      ...b,
      addons: b.addons.includes(id) ? b.addons.filter((a) => a !== id) : [...b.addons, id],
    }));
  };

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      customer_name: booking.name,
      phone: booking.phone,
      address: booking.address,
      postcode: booking.postcode,
      service: booking.service!,
      service_price: servicePrice,
      time_window: booking.window,
      booking_date: booking.date ? format(booking.date, "yyyy-MM-dd") : "",
      express: false,
      total_price: total,
      business_id: defaultBusinessId,
    });
    setSubmitting(false);
    if (error) { toast.error("Booking failed. Please try again."); return; }
    pushNotification({
      title: "Booking confirmed!",
      body: `Your ${svc?.title} is booked for ${booking.date ? format(booking.date, "EEE, d MMM") : ""}. We'll find a cleaner shortly.`,
      icon: "confirmed",
    });
    setConfirmed(true);
  };

  const canContinue = () => {
    if (step === 0) return !!booking.service;
    if (step === 1) return !!booking.carType;
    if (step === 2) return !!booking.date;
    if (step === 3) return !!booking.window;
    if (step === 4) return !!(booking.name && booking.phone && booking.address && booking.postcode);
    if (step === 5) return true;
    return true;
  };

  const reset = () => {
    setDir(1); setStep(0); setConfirmed(false);
    setBooking({ service: null, carType: null, addons: [], plan: "weekly", date: undefined, window: "", name: "", phone: "", address: "", postcode: "" });
  };

  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  /* ─── Loading ─── */
  if (submitting) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-[3px] border-muted border-t-foreground" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={20} className="text-foreground" />
            </div>
          </div>
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
    const selectedAddons = ADDONS.filter((a) => booking.addons.includes(a.id));
    return (
      <div className="min-h-svh bg-background flex flex-col px-5 py-8 pb-safe max-w-lg mx-auto">
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-1 w-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-100 mb-8 origin-left" />

        <div className="flex flex-col items-center text-center mb-6">
          <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
            <CheckCircle2 size={44} className="text-emerald-500" />
          </motion.div>
          <motion.h1 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-2xl font-extrabold tracking-tight text-foreground">
            Your wash is booked!
          </motion.h1>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm mt-1.5 max-w-[280px] leading-relaxed">
            We'll text <span className="font-semibold text-foreground">{booking.phone}</span> 30 minutes before arrival.
          </motion.p>
        </div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
          className="flex items-center gap-2.5 bg-violet-50 rounded-2xl px-4 py-3.5 mb-5 mx-auto">
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-xs font-semibold text-foreground">Cleaner will be assigned shortly</span>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border overflow-hidden">
          <div className="bg-foreground text-background px-5 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-background/60 block">Booking total</span>
              <span className="text-2xl font-extrabold tabular-nums">£{total}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-background/15 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="p-4 flex items-center gap-3.5 bg-card border-b border-border">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", svc?.color)}>
              {svc && <svc.icon size={22} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{svc?.title}</p>
              <p className="text-xs text-muted-foreground">{carType?.label} vehicle · {svc?.duration}</p>
            </div>
            <span className="font-extrabold tabular-nums text-foreground">£{servicePrice}</span>
          </div>

          <div className="p-4 space-y-3 bg-card">
            {[
              { icon: CalendarIcon, label: "Date", value: booking.date ? format(booking.date, "EEEE, d MMMM yyyy") : "" },
              { icon: Clock, label: "Time", value: WINDOWS.find((w) => w.id === booking.window)?.time },
              { icon: MapPin, label: "Location", value: `${booking.address}, ${booking.postcode}` },
              { icon: User, label: "Contact", value: `${booking.name} · ${booking.phone}` },
            ].map(({ icon: Ic, label, value }, i) => (
              <motion.div key={label} initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Ic size={15} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{value}</p>
                </div>
              </motion.div>
            ))}

            {selectedAddons.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                className="pt-3 mt-1 border-t border-border space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add-ons</p>
                {selectedAddons.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><a.icon size={12} /> {a.title}</span>
                    <span className="font-semibold text-foreground tabular-nums">+£{a.price}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex items-center gap-2 justify-center text-xs text-muted-foreground mt-4">
          <Shield size={13} className="text-emerald-500" />
          <span>Fully insured · Free cancellation · Secure booking</span>
        </motion.div>

        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.85 }}
          className="mt-6">
          <motion.button whileTap={{ scale: 0.97 }} onClick={reset}
            className="w-full bg-foreground text-background font-bold text-[15px] h-14 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform">
            Book Another Wash <ChevronRight size={16} />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ═══════════ MAIN ═══════════ */
  const selectedAddons = ADDONS.filter((a) => booking.addons.includes(a.id));
  const packageItemCount = (booking.service ? 1 : 0) + selectedAddons.length;

  return (
    <div className="min-h-svh bg-background text-foreground font-sans flex flex-col">

      {/* ─── Top Nav ─── */}
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border pt-safe">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <motion.button whileTap={{ scale: 0.85 }} onClick={back}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted active:bg-muted transition-colors -ml-1 mr-1">
                <ArrowLeft size={20} />
              </motion.button>
            ) : null}
            <span className="text-lg font-extrabold tracking-tight">Valet Ease</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <span className="text-xs text-muted-foreground font-medium tabular-nums">
              {step + 1} of {TOTAL_STEPS}
            </span>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-5 pb-0.5 flex gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="h-[3px] flex-1 rounded-full overflow-hidden bg-border">
              <motion.div className="h-full bg-foreground rounded-full" initial={false}
                animate={{ width: step > i ? "100%" : step === i ? "40%" : "0%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
            </div>
          ))}
        </div>
      </nav>

      {/* ─── Content ─── */}
      <div ref={scrollRef} className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scroll-smooth">
        <AnimatePresence mode="wait" custom={dir}>

          {/* ══════ STEP 0: Package Builder ══════ */}
          {step === 0 && (
            <motion.div key="s0" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={spring}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-5 pb-32">

              <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
                className="flex justify-center mb-1">
                <img src={carIllustration} alt="Premium car detailing" width={200} height={128} className="object-contain" />
              </motion.div>

              <StepHeader title="Build your package" sub="Choose a plan, then pick your wash" />

              {/* ── Subscription Toggle ── */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="mt-5 mb-2">
                <div className="flex p-1 bg-muted rounded-2xl gap-1">
                  <button onClick={() => setBooking((b) => ({ ...b, plan: "once" }))}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                      booking.plan === "once" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    )}>
                    One-time
                  </button>
                  <button onClick={() => setBooking((b) => ({ ...b, plan: booking.plan === "once" ? "weekly" : b.plan }))}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5",
                      booking.plan !== "once"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-muted-foreground"
                    )}>
                    <Repeat size={13} />
                    Subscribe
                    <span className={cn(
                      "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ml-0.5",
                      booking.plan !== "once" ? "bg-white/20 text-white" : "bg-emerald-500 text-white"
                    )}>Save 20%</span>
                  </button>
                </div>
              </motion.div>

              {/* ── Subscription Hero Banner ── */}
              <AnimatePresence>
                {booking.plan !== "once" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 mb-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <TrendingDown size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-sm">{activePlan.yearlyDesc || `Save ${activePlan.discount}%`}</p>
                          <p className="text-[11px] text-white/80">Cancel anytime · No lock-in · Priority scheduling</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Base packages ── */}
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <Package size={11} /> Choose your wash
              </motion.p>

              <div className="space-y-2.5">
                {SERVICES.map((s, i) => {
                  const selected = booking.service === s.id;
                  const Icon = s.icon;
                  return (
                    <motion.button key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.05, ...spring }} whileTap={{ scale: 0.97 }}
                      onClick={() => setBooking((b) => ({ ...b, service: s.id }))}
                      className={cn(
                        "w-full rounded-2xl text-left transition-all duration-200 active:scale-[0.97] overflow-hidden",
                        selected ? "ring-2 ring-foreground bg-card shadow-[var(--shadow-glow)]" : "ring-1 ring-border bg-card"
                      )}>
                      <div className="p-4 flex items-center gap-3.5">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", s.color)}>
                          <Icon size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[15px] text-foreground">{s.title}</span>
                            {s.tag && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-foreground text-background px-2 py-0.5 rounded-full">{s.tag}</span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs mt-0.5">{s.desc}</p>
                        </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {booking.plan !== "once" ? (
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground line-through tabular-nums">£{s.price}</span>
                              <span className="text-lg font-extrabold tabular-nums text-emerald-600 ml-1">£{Math.round(s.price * (1 - activePlan.discount / 100))}</span>
                            </div>
                          ) : (
                            <span className="text-lg font-extrabold tabular-nums text-foreground">£{s.price}</span>
                          )}
                          <RadioDot selected={selected} />
                        </div>
                      </div>

                      {/* Expanded includes + upsell */}
                      <AnimatePresence>
                        {selected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden">
                            <div className="px-4 pb-4 pt-1 border-t border-border/50">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Clock size={10} className="text-muted-foreground" />
                                <span className="text-[11px] text-muted-foreground font-medium">{s.duration}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {s.includes.map((item) => (
                                  <span key={item} className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-1 rounded-lg flex items-center gap-1">
                                    <Check size={9} strokeWidth={3} className="text-emerald-500" /> {item}
                                  </span>
                                ))}
                              </div>
                              {/* Subscription upsell when on one-time */}
                              {booking.plan === "once" && (
                                <div className="mt-2.5 px-3 py-2 bg-emerald-50 rounded-xl flex items-center gap-2">
                                  <Repeat size={12} className="text-emerald-600 shrink-0" />
                                  <span className="text-[11px] text-emerald-700 font-semibold">
                                    Subscribe & save £{Math.round(s.price * 0.2)}/wash — £{Math.round(s.price * 0.2 * 52)}/year
                                  </span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {/* ── Subscription Frequency (only when subscribed) ── */}
              <AnimatePresence>
                {booking.service && booking.plan !== "once" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden mt-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Repeat size={11} /> Frequency
                      </p>
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingDown size={9} /> Save {discountPct}%
                      </motion.span>
                    </div>

                    <div className="flex gap-2">
                      {PLANS.filter(p => p.id !== "once").map((p, i) => {
                        const isSelected = booking.plan === p.id;
                        const PIcon = p.icon;
                        const perWashPrice = svc ? Math.round(svc.price * (1 - p.discount / 100)) : 0;
                        return (
                          <motion.button key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 + i * 0.04, ...spring }} whileTap={{ scale: 0.95 }}
                            onClick={() => setBooking((b) => ({ ...b, plan: p.id }))}
                            className={cn(
                              "flex-1 rounded-2xl p-4 text-center transition-all duration-200 relative active:scale-[0.95]",
                              isSelected
                                ? p.id === "weekly"
                                  ? "ring-2 ring-emerald-500 bg-emerald-50 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
                                  : "ring-2 ring-foreground bg-card shadow-[var(--shadow-glow)]"
                                : "ring-1 ring-border bg-card"
                            )}>
                            {p.tag && (
                              <span className={cn(
                                "absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap",
                                p.id === "weekly" ? "bg-emerald-500 text-white" : "bg-foreground text-background"
                              )}>{p.tag}</span>
                            )}
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-colors",
                              isSelected
                                ? p.id === "weekly" ? "bg-emerald-500 text-white" : "bg-foreground text-background"
                                : "bg-muted text-muted-foreground"
                            )}>
                              <PIcon size={18} />
                            </div>
                            <span className={cn(
                              "font-bold text-sm block",
                              isSelected && p.id === "weekly" ? "text-emerald-700" : "text-foreground"
                            )}>{p.label}</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">{p.desc}</span>
                            {svc && (
                              <div className="mt-2">
                                <span className="text-[10px] text-muted-foreground line-through tabular-nums">£{svc.price}</span>
                                <span className={cn(
                                  "text-lg font-extrabold tabular-nums ml-1",
                                  isSelected && p.id === "weekly" ? "text-emerald-600" : "text-foreground"
                                )}>£{perWashPrice}</span>
                                <span className="text-[9px] text-muted-foreground">/wash</span>
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Plan perks */}
                    <AnimatePresence mode="wait">
                      <motion.div key={booking.plan} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }} className="mt-3 flex flex-wrap gap-1.5">
                        {activePlan.perks.map((perk) => (
                          <span key={perk} className={cn(
                            "text-[10px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1",
                            booking.plan === "weekly" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                          )}>
                            <Check size={9} strokeWidth={3} className={booking.plan === "weekly" ? "text-emerald-500" : "text-muted-foreground"} /> {perk}
                          </span>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: booking.service ? 1 : 0.4 }}
                transition={{ delay: 0.3 }}
                className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Plus size={11} /> Boost your package
                  </p>
                  {selectedAddons.length > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="text-[10px] font-bold bg-foreground text-background px-2 py-0.5 rounded-full tabular-nums">
                      +£{addonsTotal}
                    </motion.span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {ADDONS.map((a, i) => {
                    const selected = booking.addons.includes(a.id);
                    const Icon = a.icon;
                    return (
                      <motion.button key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.32 + i * 0.04, ...spring }} whileTap={{ scale: 0.95 }}
                        disabled={!booking.service}
                        onClick={() => toggleAddon(a.id)}
                        className={cn(
                          "rounded-2xl p-3.5 text-left transition-all duration-200 relative active:scale-[0.95] disabled:opacity-40",
                          selected ? "ring-2 ring-foreground bg-card shadow-[var(--shadow-glow)]" : "ring-1 ring-border bg-card"
                        )}>
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                          )}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-sm text-foreground block leading-tight">{a.title}</span>
                            <span className="text-[11px] text-muted-foreground leading-tight">{a.desc}</span>
                            {booking.plan === "weekly" && i === 0 && (
                              <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">FREE with your plan</span>
                            )}
                            {booking.plan !== "once" && booking.plan !== "weekly" && (
                              <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">Would be free on Weekly plan</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
                          {booking.plan === "weekly" && i === 0 ? (
                            <span className="font-extrabold text-sm tabular-nums text-emerald-600 flex items-center gap-1">
                              <span className="line-through text-muted-foreground">£{a.price}</span> FREE
                            </span>
                          ) : (
                            <span className={cn(
                              "font-extrabold text-sm tabular-nums transition-colors",
                              selected ? "text-foreground" : "text-muted-foreground"
                            )}>+£{a.price}</span>
                          )}
                          <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center transition-all",
                            selected ? "bg-foreground text-background" : "border-2 border-border"
                          )}>
                            {selected && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                                <Check size={11} strokeWidth={3} />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── Live package summary ── */}
              <AnimatePresence>
                {booking.service && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 20 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden">
                    <div className="rounded-2xl bg-muted/60 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Package size={14} className="text-foreground" />
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Your package</span>
                        <span className="text-[10px] font-semibold text-muted-foreground ml-auto">{packageItemCount} item{packageItemCount !== 1 ? "s" : ""}</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground font-medium flex items-center gap-2">
                            {svc && <svc.icon size={13} className="text-muted-foreground" />}
                            {svc?.title}
                          </span>
                          <span className="font-semibold text-foreground tabular-nums">£{svc?.price}</span>
                        </div>

                        <AnimatePresence>
                          {selectedAddons.map((a) => (
                            <motion.div
                              key={a.id}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden">
                              <div className="flex items-center justify-between text-sm py-0.5">
                                <span className="text-muted-foreground flex items-center gap-2">
                                  <a.icon size={13} /> {a.title}
                                </span>
                                <span className="font-medium text-foreground tabular-nums">+£{a.price}</span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {discountPct > 0 && (
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingDown size={10} className="text-emerald-500" /> {activePlan.label} ({discountPct}% off)
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 tabular-nums">−£{discountAmount}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                        <div>
                          <span className="font-bold text-sm text-foreground block">Package total</span>
                          {discountPct > 0 && (
                            <span className="text-[10px] text-muted-foreground">{activePlan.label} plan · per wash</span>
                          )}
                        </div>
                        <div className="text-right">
                          {discountPct > 0 && (
                            <span className="text-xs text-muted-foreground line-through tabular-nums block">£{baseTotal}</span>
                          )}
                          <motion.span key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                            className={cn("font-extrabold text-xl tabular-nums", discountPct > 0 ? "text-emerald-600" : "text-foreground")}>
                            £{total}
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ══════ STEP 1: Car Type ══════ */}
          {step === 1 && (
            <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={spring}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">
              <StepHeader title="What's your vehicle?" sub="Tap your car size" />

              <div className="grid grid-cols-2 gap-3 mt-5">
                {CAR_TYPES.map((c, i) => {
                  const selected = booking.carType === c.id;
                  const svcPrice = svc?.price || 0;
                  const adjustedPrice = Math.round(svcPrice * c.multiplier);
                  return (
                    <motion.button key={c.id} initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.06 + i * 0.06, ...spring }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => selectAndAdvance((b) => ({ ...b, carType: c.id }))}
                      className={cn(
                        "relative rounded-2xl text-center transition-all duration-200 overflow-hidden flex flex-col active:scale-[0.94]",
                        selected
                          ? "ring-2 ring-foreground bg-card shadow-[var(--shadow-glow)]"
                          : "ring-1 ring-border bg-card"
                      )}>

                      {c.tag && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-foreground text-background px-2 py-0.5 rounded-full">
                            {c.tag}
                          </span>
                        </div>
                      )}

                      <div className={cn(
                        "relative h-24 flex items-end justify-center pt-3 px-2 transition-colors duration-200",
                        selected ? "bg-muted/80" : "bg-muted/40"
                      )}>
                        <motion.img
                          src={c.img} alt={c.label} loading="lazy" width={140} height={90}
                          className="object-contain max-h-[80px] relative z-10"
                          animate={selected ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                      </div>

                      <div className="p-3 flex flex-col items-center gap-0.5">
                        <span className="font-bold text-sm text-foreground">{c.label}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{c.example}</span>
                        <span className="text-base font-extrabold tabular-nums text-foreground mt-1.5">£{adjustedPrice}</span>
                        {c.multiplier > 1 && (
                          <span className="text-[9px] font-semibold text-violet-500">+{Math.round((c.multiplier - 1) * 100)}% surcharge</span>
                        )}
                      </div>

                      <motion.div
                        className="absolute bottom-2 right-2"
                        animate={selected ? { scale: 1 } : { scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}>
                        <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 2: Date ══════ */}
          {step === 2 && (
            <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={spring}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32"
              onAnimationComplete={() => {
                if (!booking.date) {
                  setBooking((b) => ({ ...b, date: dateOptions[0] }));
                }
              }}>

              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="flex items-center gap-2 bg-amber-50 rounded-2xl px-4 py-3 mb-5">
                <AlertCircle size={14} className="text-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-foreground">Limited slots — book now to secure your spot</span>
              </motion.div>

              <StepHeader title="Pick a date" sub="Tomorrow is pre-selected for you" />

              <div className="mt-5">
                <div className="grid grid-cols-4 gap-2.5">
                  {(showAllDates ? dateOptions : dateOptions.slice(0, 8)).map((d, i) => {
                    const isSelected = booking.date && isSameDay(booking.date, d);
                    return (
                      <motion.button key={d.toISOString()} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.03 + i * 0.03 }} whileTap={{ scale: 0.92 }}
                        onClick={() => setBooking({ ...booking, date: d })}
                        className={cn(
                          "flex flex-col items-center py-4 px-2 rounded-2xl transition-all relative active:scale-[0.92]",
                          isSelected ? "bg-foreground text-background ring-2 ring-foreground shadow-[var(--shadow-glow)]" : "bg-card ring-1 ring-border"
                        )}>
                        {i === 0 && (
                          <span className={cn(
                            "absolute -top-1.5 left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-full whitespace-nowrap",
                            isSelected ? "bg-background text-foreground" : "bg-emerald-500 text-white"
                          )}>Best</span>
                        )}
                        <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-background/70" : "text-muted-foreground")}>
                          {i === 0 ? "TMR" : format(d, "EEE")}
                        </span>
                        <span className={cn("text-xl font-extrabold tabular-nums leading-tight mt-1", isSelected ? "text-background" : "text-foreground")}>
                          {format(d, "d")}
                        </span>
                        <span className={cn("text-[10px] font-medium mt-0.5", isSelected ? "text-background/70" : "text-muted-foreground")}>
                          {format(d, "MMM")}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {!showAllDates && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    onClick={() => setShowAllDates(true)}
                    className="w-full mt-3 text-center text-xs text-muted-foreground font-medium py-2 hover:text-foreground active:text-foreground transition-colors">
                    Show more dates →
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 3: Time ══════ */}
          {step === 3 && (
            <motion.div key="s3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={spring}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32"
              onAnimationComplete={() => {
                if (!booking.window) {
                  const nextSlot = WINDOWS.find((w) => w.tag) || WINDOWS[0];
                  setBooking((b) => ({ ...b, window: nextSlot.id }));
                }
              }}>

              <StepHeader title="Pick a time" sub={booking.date ? format(booking.date, "EEEE, d MMMM") : "Select your preferred window"} />

              <div className="space-y-3 mt-5">
                {WINDOWS.map((w, i) => {
                  const isSelected = booking.window === w.id;
                  const WIcon = w.icon;
                  const isLow = w.slots <= 2;
                  return (
                    <motion.button key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.06 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setBooking({ ...booking, window: w.id })}
                      className={cn(
                        "w-full rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 relative overflow-hidden active:scale-[0.97]",
                        isSelected
                          ? "bg-foreground text-background ring-2 ring-foreground shadow-[var(--shadow-glow)]"
                          : "bg-card ring-1 ring-border"
                      )}>
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "bg-background/15" : w.color
                      )}>
                        <WIcon size={24} className={isSelected ? "text-background" : ""} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold text-base", isSelected ? "text-background" : "text-foreground")}>{w.label}</span>
                          {w.tag && (
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                              isSelected ? "bg-background/20 text-background" : "bg-foreground text-background"
                            )}>{w.tag}</span>
                          )}
                        </div>
                        <span className={cn("text-sm mt-0.5 block", isSelected ? "text-background/70" : "text-muted-foreground")}>{w.time}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                          isSelected
                            ? "bg-background/15 text-background"
                            : isLow
                              ? "bg-red-50 text-red-500"
                              : "bg-emerald-50 text-emerald-500"
                        )}>
                          {w.slots} left
                        </span>
                        <RadioDot selected={isSelected} inverted={isSelected} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 4: Location & Contact ══════ */}
          {step === 4 && (
            <motion.div key="s4" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={spring}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">

              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl overflow-hidden bg-muted relative h-[120px] flex items-center justify-center mb-5">
                <div className="absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
                <motion.div
                  animate={{ scale: [1, 1.8, 1], opacity: [0.15, 0, 0.15] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-16 h-16 rounded-full bg-foreground/10" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex flex-col items-center gap-1 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg">
                    <Navigation size={18} />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-foreground/30" />
                </motion.div>
              </motion.div>

              <StepHeader title="Where should we come?" sub="We'll wash your car at this location" />

              <div className="flex gap-2.5 mt-4 mb-5">
                <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (navigator.geolocation) {
                      toast.info("Detecting your location…");
                      navigator.geolocation.getCurrentPosition(
                        () => {
                          setBooking((b) => ({ ...b, postcode: "SW1A 1AA", address: "10 Downing Street" }));
                          toast.success("Location detected!");
                        },
                        () => toast.error("Could not detect location")
                      );
                    }
                  }}
                  className="flex-1 flex items-center gap-2.5 px-3.5 py-3.5 rounded-2xl bg-accent text-foreground font-semibold text-sm ring-1 ring-border transition-colors active:bg-accent/80">
                  <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0">
                    <LocateFixed size={16} />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs block text-foreground">Use GPS</span>
                    <span className="text-[10px] text-muted-foreground">Auto-detect</span>
                  </div>
                </motion.button>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField icon={MapPin} label="Postcode" placeholder="SW1A 1AA" value={booking.postcode}
                    onChange={(v) => setBooking({ ...booking, postcode: v.toUpperCase() })} />
                  <InputField icon={Home} label="Address" placeholder="10 Downing St" value={booking.address}
                    onChange={(v) => setBooking({ ...booking, address: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField icon={User} label="Full name" placeholder="John Smith" value={booking.name}
                    onChange={(v) => setBooking({ ...booking, name: v })} />
                  <InputField icon={Phone} label="Phone" placeholder="07XXX XXX XXX" type="tel" value={booking.phone}
                    onChange={(v) => setBooking({ ...booking, phone: v })} />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="mt-5 flex items-center gap-4 justify-center">
                {[
                  { icon: ShieldCheck, text: "Fully insured" },
                  { icon: Clock, text: "30-min heads up" },
                ].map(({ icon: Ic, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <Ic size={12} /> {text}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ══════ STEP 5: Review ══════ */}
          {step === 5 && (
            <motion.div key="s5" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={spring}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">
              <StepHeader title="Review your booking" sub="Everything looks good?" />

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mt-5 rounded-2xl border border-border overflow-hidden">

                <div className="p-4 flex items-center gap-3.5 bg-card">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", svc?.color)}>
                    {svc && <svc.icon size={22} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-foreground">{svc?.title}</p>
                    <p className="text-muted-foreground text-xs">{carType?.label} vehicle · {svc?.duration}</p>
                  </div>
                  <span className="text-lg font-extrabold tabular-nums text-foreground">£{servicePrice}</span>
                </div>

                <div className="h-px bg-border" />

                <div className="p-4 space-y-3.5 bg-card">
                  {[
                    { icon: CalendarIcon, label: "Date", value: booking.date ? format(booking.date, "EEE, d MMM yyyy") : "", editStep: 2 },
                    { icon: Clock, label: "Time", value: WINDOWS.find((w) => w.id === booking.window)?.time, editStep: 3 },
                    { icon: MapPin, label: "Location", value: `${booking.address}, ${booking.postcode}`, editStep: 4 },
                    { icon: User, label: "Contact", value: `${booking.name} · ${booking.phone}`, editStep: 4 },
                  ].map(({ icon: Ic, label, value, editStep }, i) => (
                    <motion.div key={label} initial={{ x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.15 + i * 0.04 }} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Ic size={15} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium text-foreground truncate">{value}</p>
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => goTo(editStep)}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 -mr-2">
                        Edit
                      </motion.button>
                    </motion.div>
                  ))}

                  {selectedAddons.length > 0 && (
                    <div className="pt-2 border-t border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add-ons</p>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => goTo(0)}
                          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 -mr-2">
                          Edit
                        </motion.button>
                      </div>
                      {selectedAddons.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <a.icon size={12} /> {a.title}
                          </span>
                          <span className="font-semibold text-foreground">+£{a.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {discountPct > 0 && (
                  <div className="bg-emerald-50 px-4 py-2.5 flex items-center justify-between border-t border-border">
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                      <Repeat size={11} /> {activePlan.label} plan · {discountPct}% off
                    </span>
                    <span className="text-xs font-bold text-emerald-600 tabular-nums">−£{discountAmount}</span>
                  </div>
                )}

                <div className="bg-muted/50 px-4 py-4 flex justify-between items-center border-t border-border">
                  <span className="font-bold text-foreground text-sm">Total{booking.plan !== "once" ? " per wash" : ""}</span>
                  <div className="text-right flex items-baseline gap-2">
                    {discountPct > 0 && <span className="text-sm text-muted-foreground line-through tabular-nums">£{baseTotal}</span>}
                    <span className={cn("text-2xl font-extrabold tabular-nums", discountPct > 0 ? "text-emerald-600" : "text-foreground")}>£{total}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="flex items-center gap-2 justify-center text-xs text-muted-foreground mt-4">
                <Shield size={13} className="text-emerald-500" />
                <span>Secure booking · Fully insured · Cancel anytime</span>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ─── Bottom Bar ─── */}
      <AnimatePresence>
        {!confirmed && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border pb-safe">

            {/* Subscription nudge banner */}
            {step === 0 && booking.service && booking.plan === "once" && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="overflow-hidden">
                <button onClick={() => setBooking((b) => ({ ...b, plan: "weekly" }))}
                  className="w-full px-5 py-2 bg-emerald-50 flex items-center gap-2 text-left">
                  <Sparkles size={13} className="text-emerald-600 shrink-0" />
                  <span className="text-[11px] text-emerald-700 font-semibold flex-1">
                    This wash would be <span className="font-extrabold">£{Math.round((svc?.price || 0) * 0.8)}/wash</span> with a Weekly plan
                  </span>
                  <ChevronRight size={14} className="text-emerald-500" />
                </button>
              </motion.div>
            )}

            <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                {booking.service && total > 0 ? (
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      {discountPct > 0 && (
                        <span className="text-sm text-muted-foreground line-through tabular-nums">£{baseTotal}</span>
                      )}
                      <motion.span key={total} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className={cn("text-xl font-extrabold tabular-nums leading-tight", discountPct > 0 ? "text-emerald-600" : "text-foreground")}>£{total}</motion.span>
                      {booking.plan !== "once" && (
                        <span className="text-[10px] text-muted-foreground font-medium">/wash</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">
                      {booking.plan !== "once"
                        ? `${activePlan.label} subscription · ${svc?.title}${carType ? ` · ${carType.label}` : ""}`
                        : [svc?.title, carType?.label].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Build your package</span>
                )}
              </div>
              <motion.button
                whileTap={canContinue() ? { scale: 0.95 } : {}}
                disabled={!canContinue() || submitting}
                onClick={step === 5 ? confirm : next}
                className={cn(
                  "flex-[1.5] font-bold text-[15px] h-14 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-30 active:scale-[0.95]",
                  booking.plan !== "once" && step === 5
                    ? "bg-emerald-500 text-white"
                    : "bg-foreground text-background"
                )}>
                {step === 5 ? (
                  booking.plan !== "once"
                    ? <>Subscribe · £{total}/wash <Repeat size={16} /></>
                    : <>Confirm · £{total} <CheckCircle2 size={16} /></>
                ) : step === 0 ? (
                  <>Continue with package <ChevronRight size={16} /></>
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

/* ─── Sub-components ─── */

const StepHeader = ({ title, sub }: { title: string; sub: string }) => (
  <header>
    <h1 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h1>
    <p className="text-sm text-muted-foreground mt-1">{sub}</p>
  </header>
);

const RadioDot = ({ selected, inverted }: { selected: boolean; inverted?: boolean }) => (
  <div className={cn(
    "w-6 h-6 rounded-full flex items-center justify-center transition-all",
    selected
      ? inverted ? "bg-background text-foreground" : "bg-foreground text-background"
      : "border-2 border-border"
  )}>
    {selected && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
        <Check size={12} strokeWidth={3} />
      </motion.div>
    )}
  </div>
);

interface InputFieldProps {
  icon: typeof MapPin;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}

const InputField = ({ icon: Icon, label, placeholder, value, onChange, type = "text" }: InputFieldProps) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
      <Icon size={11} /> {label}
    </label>
    <input type={type} placeholder={placeholder}
      className="w-full bg-card rounded-2xl px-4 h-13 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 ring-1 ring-border transition-all"
      value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

/* ─── Live Tracking Component ─── */

const getTrackingStages = (cleanerName: string | null) => {
  const name = cleanerName || "Your cleaner";
  const firstName = name.split(" ")[0];
  return [
    { id: "confirmed", label: "Booking confirmed", desc: "Your booking has been received", icon: CheckCircle2, eta: null },
    { id: "assigned", label: "Cleaner assigned", desc: `${name} is preparing for your wash`, icon: User, eta: null },
    { id: "onway", label: "On the way", desc: `${firstName} is heading to your location`, icon: Navigation, eta: "12 min away" },
    { id: "arrived", label: "Arrived", desc: `${firstName} has arrived — wash starting now`, icon: MapPin, eta: null },
  ];
};

interface LiveTrackingProps {
  booking: BookingState;
  svc: typeof SERVICES[number] | undefined;
  carType: typeof CAR_TYPES[number] | undefined;
  total: number;
  baseTotal: number;
  discountPct: number;
  discountAmount: number;
  activePlan: typeof PLANS[number];
  servicePrice: number;
  addonsTotal: number;
  onReset: () => void;
}

const LiveTracking = ({ booking, svc, carType, total, baseTotal, discountPct, activePlan, servicePrice, addonsTotal, onReset }: LiveTrackingProps) => {
  const [stageIdx, setStageIdx] = useState(0);
  const [eta, setEta] = useState(18);
  const [workerName, setWorkerName] = useState<string | null>(null);
  const selectedAddons = ADDONS.filter((a) => booking.addons.includes(a.id));

  // Simulate stage progression with notifications
  useEffect(() => {
    const timers = [
      setTimeout(async () => {
        // In a real app, this would be triggered by a realtime subscription on booking status change
        // For now we simulate and attempt to fetch the assigned worker
        setStageIdx(1);
        // Try fetching assigned worker from the most recent booking
        const { data } = await supabase
          .from("bookings")
          .select("assigned_worker_id")
          .eq("customer_name", booking.name)
          .eq("status", "assigned" as any)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.assigned_worker_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", data.assigned_worker_id)
            .maybeSingle();
          if (profile?.full_name) setWorkerName(profile.full_name);
        }
        const name = workerName || "A cleaner";
        pushNotification({ title: "Cleaner assigned", body: `${name} has been assigned to your wash and is getting ready.`, icon: "assigned" });
      }, 3000),
      setTimeout(() => {
        setStageIdx(2);
        const firstName = workerName?.split(" ")[0] || "Your cleaner";
        pushNotification({ title: "On the way!", body: `${firstName} is heading to your location. Estimated arrival: 18 min.`, icon: "onway" });
      }, 7000),
      setTimeout(() => {
        setStageIdx(3);
        const firstName = workerName?.split(" ")[0] || "Your cleaner";
        pushNotification({ title: "Cleaner arrived", body: `${firstName} has arrived at your location. Your wash is starting now!`, icon: "arrived" });
      }, 15000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Simulate ETA countdown when on the way
  useEffect(() => {
    if (stageIdx < 2) return;
    if (stageIdx >= 3) { setEta(0); return; }
    const interval = setInterval(() => {
      setEta((e) => Math.max(0, e - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [stageIdx]);

  const trackingStages = getTrackingStages(workerName);
  const currentStage = trackingStages[stageIdx];
  const CurIcon = currentStage.icon;
  const initials = workerName ? workerName.split(" ").map(n => n[0]).join("").toUpperCase() : null;

  return (
    <div className="min-h-svh bg-background flex flex-col max-w-lg mx-auto w-full">

      {/* ─── Map Area ─── */}
      <div className="relative h-[240px] bg-muted overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />

        {/* Animated rings */}
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 2.5, 1], opacity: [0.12, 0, 0.12] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <div className="w-24 h-24 rounded-full bg-foreground/10" />
        </motion.div>
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.8, 1], opacity: [0.1, 0, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}>
          <div className="w-16 h-16 rounded-full bg-foreground/10" />
        </motion.div>

        {/* Destination pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg z-10">
            <MapPin size={18} />
          </div>
          <div className="w-2 h-2 rounded-full bg-foreground/30 mt-1" />
        </div>

        {/* Cleaner dot (animates toward center when on the way) */}
        {stageIdx >= 2 && (
          <motion.div
            initial={{ x: -120, y: -80 }}
            animate={stageIdx >= 3 ? { x: 0, y: 0 } : { x: [-120, -60, -30], y: [-80, -40, -15] }}
            transition={stageIdx >= 3 ? { duration: 1 } : { duration: 8, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
              <Car size={14} />
            </motion.div>
          </motion.div>
        )}

        {/* ETA overlay */}
        {stageIdx === 2 && eta > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-foreground text-background rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
            <Clock size={14} />
            <div>
              <motion.span key={eta} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="text-lg font-extrabold tabular-nums block leading-tight">{eta} min</motion.span>
              <span className="text-[10px] text-background/60 font-medium">Estimated arrival</span>
            </div>
          </motion.div>
        )}

        {/* Arrived badge */}
        {stageIdx === 3 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white rounded-2xl px-5 py-2.5 flex items-center gap-2 shadow-lg">
            <CheckCircle2 size={16} />
            <span className="font-bold text-sm">Cleaner has arrived!</span>
          </motion.div>
        )}

        {/* Address badge */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5 max-w-[200px]">
          <MapPin size={11} className="text-foreground shrink-0" />
          <span className="text-[11px] font-bold text-foreground truncate">{booking.address}</span>
        </motion.div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 px-5 pt-5 pb-safe overflow-y-auto">

        {/* Current status header */}
        <AnimatePresence mode="wait">
          <motion.div key={stageIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }} className="flex items-center gap-3.5 mb-5">
            <motion.div
              animate={stageIdx < 3 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                stageIdx === 3 ? "bg-emerald-50 text-emerald-500" : "bg-foreground text-background"
              )}>
              <CurIcon size={22} />
            </motion.div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-foreground">{currentStage.label}</h2>
              <p className="text-sm text-muted-foreground">{currentStage.desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress timeline */}
        <div className="space-y-0 mb-6">
          {TRACKING_STAGES.map((stage, i) => {
            const completed = i < stageIdx;
            const active = i === stageIdx;
            const upcoming = i > stageIdx;
            const SIcon = stage.icon;
            return (
              <div key={stage.id} className="flex gap-3.5">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center w-8 shrink-0">
                  <motion.div
                    animate={active ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500",
                      completed ? "bg-emerald-500 text-white"
                        : active ? "bg-foreground text-background ring-4 ring-foreground/10"
                        : "bg-muted text-muted-foreground"
                    )}>
                    {completed ? <Check size={14} strokeWidth={3} /> : <SIcon size={14} />}
                  </motion.div>
                  {i < TRACKING_STAGES.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[32px] relative overflow-hidden bg-border rounded-full my-1">
                      <motion.div
                        className="absolute top-0 left-0 w-full bg-emerald-500 rounded-full"
                        initial={{ height: "0%" }}
                        animate={{ height: completed ? "100%" : active ? "40%" : "0%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={cn("pb-4 pt-1 flex-1 min-w-0", upcoming && "opacity-40")}>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-semibold text-sm", active ? "text-foreground" : completed ? "text-emerald-600" : "text-muted-foreground")}>
                      {stage.label}
                    </span>
                    {completed && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">Done</motion.span>
                    )}
                    {active && (
                      <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{stage.desc}</p>
                  {active && stage.id === "onway" && eta > 0 && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-xs font-bold text-foreground mt-1 block tabular-nums">
                      {eta} min away
                    </motion.span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cleaner card (appears when assigned) */}
        <AnimatePresence>
          {stageIdx >= 1 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl ring-1 ring-border bg-card p-4 mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Your cleaner</p>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-lg">
                  JM
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">James M.</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-amber-400 text-xs">★</span>
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">4.9 · 342 washes</span>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Phone size={16} className="text-foreground" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Before & After Photos (customer view) */}
        <JobPhotosCustomerView bookingId={booking.service ? undefined : undefined} />

        {/* Booking summary card */}
        <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden mb-5">
          <div className="p-4 flex items-center gap-3.5 border-b border-border">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", svc?.color)}>
              {svc && <svc.icon size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{svc?.title}</p>
              <p className="text-[11px] text-muted-foreground">{carType?.label} · {svc?.duration}{booking.plan !== "once" ? ` · ${activePlan.label}` : ""}</p>
            </div>
            <div className="text-right">
              {discountPct > 0 && <span className="text-[10px] text-muted-foreground line-through tabular-nums block">£{baseTotal}</span>}
              <span className={cn("font-extrabold tabular-nums", discountPct > 0 ? "text-emerald-600" : "text-foreground")}>£{total}</span>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarIcon size={11} /> {booking.date ? format(booking.date, "EEE, d MMM") : ""}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {WINDOWS.find((w) => w.id === booking.window)?.time}</span>
            {selectedAddons.length > 0 && <span className="flex items-center gap-1"><Plus size={11} /> {selectedAddons.length} add-on{selectedAddons.length > 1 ? "s" : ""}</span>}
          </div>
        </div>

        {/* Book again button */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={onReset}
          className="w-full bg-foreground text-background font-bold text-[15px] h-14 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform mb-4">
          Book Another Wash <ChevronRight size={16} />
        </motion.button>

        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground mb-6">
          <Shield size={13} className="text-emerald-500" />
          <span>Fully insured · Free cancellation</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Customer-facing photo comparison (polls for photos) ─── */
const JobPhotosCustomerView = ({ bookingId }: { bookingId?: string }) => {
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);

  useEffect(() => {
    // In a real app this would use the actual booking ID
    // For the demo, poll latest photos from any booking
    const fetchPhotos = async () => {
      const { data } = await supabase
        .from("job_photos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!data || data.length === 0) return;

      // Group by booking and find one with both
      const byBooking: Record<string, any[]> = {};
      data.forEach((p: any) => {
        if (!byBooking[p.booking_id]) byBooking[p.booking_id] = [];
        byBooking[p.booking_id].push(p);
      });

      for (const photos of Object.values(byBooking)) {
        const before = photos.find((p: any) => p.photo_type === "before");
        const after = photos.find((p: any) => p.photo_type === "after");
        if (before && after) {
          const { data: bUrl } = supabase.storage.from("job-photos").getPublicUrl(before.storage_path);
          const { data: aUrl } = supabase.storage.from("job-photos").getPublicUrl(after.storage_path);
          setBeforeUrl(bUrl.publicUrl);
          setAfterUrl(aUrl.publicUrl);
          return;
        }
      }
    };

    fetchPhotos();
    const interval = setInterval(fetchPhotos, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  if (!beforeUrl || !afterUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl ring-1 ring-border bg-card overflow-hidden mb-5"
    >
      <div className="p-4 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Before & After
        </p>
        <BeforeAfterComparison beforeUrl={beforeUrl} afterUrl={afterUrl} />
        <p className="text-[10px] text-center text-muted-foreground font-medium mt-2">
          Drag to compare
        </p>
      </div>
    </motion.div>
  );
};

export default BookingApp;
