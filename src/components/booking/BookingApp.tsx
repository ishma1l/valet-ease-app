import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { format, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  MapPin, Clock, CheckCircle2, ChevronRight, ArrowLeft, Zap,
  CalendarIcon, User, Phone, MapPinned, Sparkles, X,
  Shield, ShieldCheck, Bell, CreditCard, Check,
  Droplets, Car, Truck, LocateFixed, Navigation, Search,
  Wind, Paintbrush, SprayCan, Armchair, Home, Building2, Bookmark,
  Sun, CloudSun, Sunset, AlertCircle,
} from "lucide-react";
import carIllustration from "@/assets/car-illustration.png";
import carSmall from "@/assets/car-small.png";
import carSedan from "@/assets/car-sedan.png";
import carSuv from "@/assets/car-suv.png";
import carVan from "@/assets/car-van.png";

/* ─── Types ─── */
interface BookingState {
  service: string | null;
  carType: string | null;
  addons: string[];
  date: Date | undefined;
  window: string;
  name: string;
  phone: string;
  address: string;
  postcode: string;
}

/* ─── Data ─── */
const SERVICES = [
  { id: "basic", title: "Basic Wash", desc: "Exterior hand wash, rinse & dry", price: 15, duration: "30 min", icon: Droplets, color: "bg-sky-50 text-sky-600" },
  { id: "valet", title: "Full Valet", desc: "Complete interior & exterior", price: 25, duration: "60 min", icon: Sparkles, tag: "Popular", color: "bg-amber-50 text-amber-600" },
  { id: "premium", title: "Premium Detail", desc: "Deep clean, polish & wax", price: 45, duration: "90 min", icon: Car, color: "bg-violet-50 text-violet-600" },
];

const CAR_TYPES = [
  { id: "small", label: "Small", example: "Corsa, Polo, Yaris", img: carSmall, multiplier: 1 },
  { id: "sedan", label: "Sedan", example: "Golf, Focus, A3", img: carSedan, multiplier: 1, tag: "Most Popular" },
  { id: "suv", label: "SUV", example: "X5, Q7, Range Rover", img: carSuv, multiplier: 1.3 },
  { id: "van", label: "Van", example: "Transit, Sprinter", img: carVan, multiplier: 1.5 },
];

const ADDONS = [
  { id: "airfresh", title: "Air Freshener", desc: "Long-lasting scent", price: 3, icon: Wind },
  { id: "tyre", title: "Tyre Shine", desc: "Glossy wheel finish", price: 5, icon: SprayCan },
  { id: "leather", title: "Leather Care", desc: "Condition & protect", price: 8, icon: Armchair },
  { id: "clay", title: "Clay Bar", desc: "Remove contaminants", price: 12, icon: Paintbrush },
];

const WINDOWS = [
  { id: "morning", label: "Morning", time: "9 – 12" },
  { id: "afternoon", label: "Afternoon", time: "12 – 4" },
  { id: "evening", label: "Evening", time: "4 – 7" },
];

const STEP_LABELS = ["Service", "Car Type", "Add-ons", "Schedule", "Location", "Confirm"];
const TOTAL_STEPS = 6;

/* ─── Animation ─── */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
};
const ease = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

/* ═══════════════════════════════════════════════ */
const BookingApp = () => {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [booking, setBooking] = useState<BookingState>({
    service: null, carType: null, addons: [], date: undefined,
    window: "", name: "", phone: "", address: "", postcode: "",
  });

  const go = useCallback((to: number) => { setDir(to > step ? 1 : -1); setStep(to); }, [step]);
  const next = useCallback(() => { setDir(1); setStep((s) => s + 1); }, []);
  const back = useCallback(() => { setDir(-1); setStep((s) => s - 1); }, []);

  const svc = SERVICES.find((s) => s.id === booking.service);
  const carType = CAR_TYPES.find((c) => c.id === booking.carType);
  const multiplier = carType?.multiplier || 1;
  const servicePrice = Math.round((svc?.price || 0) * multiplier);
  const addonsTotal = ADDONS.filter((a) => booking.addons.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const total = servicePrice + addonsTotal;

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
    });
    setSubmitting(false);
    if (error) { toast.error("Booking failed. Please try again."); return; }
    setConfirmed(true);
  };

  const canContinue = () => {
    if (step === 0) return !!booking.service;
    if (step === 1) return !!booking.carType;
    if (step === 2) return true; // addons optional
    if (step === 3) return !!booking.date && !!booking.window;
    if (step === 4) return booking.name && booking.phone && booking.address && booking.postcode;
    if (step === 5) return true;
    return true;
  };

  const reset = () => {
    setDir(1); setStep(0); setConfirmed(false);
    setBooking({ service: null, carType: null, addons: [], date: undefined, window: "", name: "", phone: "", address: "", postcode: "" });
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
          className="text-2xl font-extrabold tracking-tight text-foreground mb-2 text-center">You're all set!</motion.h1>
        <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-muted-foreground text-center text-sm mb-8 max-w-[280px] leading-relaxed">
          We'll text <span className="font-semibold text-foreground">{booking.phone}</span> 30 min before arrival.
        </motion.p>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="w-full max-w-sm rounded-2xl border border-border overflow-hidden">
          <div className="bg-foreground text-background px-5 py-4 flex items-center justify-between">
            <span className="font-bold text-sm">Booking confirmed</span>
            <span className="font-extrabold text-lg tabular-nums">£{total}</span>
          </div>
          <div className="p-5 space-y-3 bg-card">
            {[
              { l: "Service", v: `${svc?.title} · ${carType?.label}` },
              { l: "Date", v: booking.date ? format(booking.date, "EEE, d MMM") : "" },
              { l: "Time", v: WINDOWS.find((w) => w.id === booking.window)?.time },
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

  /* ═══════════ MAIN ═══════════ */
  return (
    <div className="min-h-svh bg-background text-foreground font-sans flex flex-col">

      {/* ─── Top Nav ─── */}
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <motion.button whileTap={{ scale: 0.9 }} onClick={back}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors -ml-1 mr-1">
                <ArrowLeft size={18} />
              </motion.button>
            ) : null}
            <span className="text-lg font-extrabold tracking-tight">Valet Ease</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {STEP_LABELS[step]}{" "}
            <span className="font-semibold text-foreground tabular-nums">{step + 1}/{TOTAL_STEPS}</span>
          </span>
        </div>
        <div className="max-w-lg mx-auto px-5 flex gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="h-[3px] flex-1 rounded-full overflow-hidden bg-border">
              <motion.div className="h-full bg-foreground rounded-full" initial={false}
                animate={{ width: step > i ? "100%" : step === i ? "40%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeOut" }} />
            </div>
          ))}
        </div>
      </nav>

      {/* ─── Content ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>

          {/* ══════ STEP 0: Service ══════ */}
          {step === 0 && (
            <motion.div key="s0" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={ease}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">

              {/* Car hero */}
              <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
                className="flex justify-center mb-2">
                <img src={carIllustration} alt="Premium car detailing" width={260} height={166} className="object-contain" />
              </motion.div>

              <StepHeader title="What does your car need?" sub="Choose a wash package" />

              <div className="space-y-3 mt-5">
                {SERVICES.map((s, i) => {
                  const selected = booking.service === s.id;
                  const Icon = s.icon;
                  return (
                    <motion.button key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.06, ...ease }} whileTap={{ scale: 0.98 }}
                      onClick={() => setBooking({ ...booking, service: s.id })}
                      className={cn(
                        "w-full rounded-2xl text-left p-4 transition-all duration-200",
                        selected ? "ring-2 ring-foreground bg-card shadow-[var(--shadow-glow)]" : "ring-1 ring-border bg-card"
                      )}>
                      <div className="flex items-center gap-3.5">
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
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1.5">
                            <Clock size={10} /> {s.duration}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-lg font-extrabold tabular-nums text-foreground">£{s.price}</span>
                          <RadioDot selected={selected} />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 1: Car Type ══════ */}
          {step === 1 && (
            <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={ease}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">
              <StepHeader title="What's your car size?" sub="Pricing adjusts based on vehicle" />

              <div className="grid grid-cols-2 gap-3 mt-5">
                {CAR_TYPES.map((c, i) => {
                  const selected = booking.carType === c.id;
                  const svcPrice = svc?.price || 0;
                  const adjustedPrice = Math.round(svcPrice * c.multiplier);
                  return (
                    <motion.button key={c.id} initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.06 + i * 0.06, ...ease }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setBooking({ ...booking, carType: c.id })}
                      className={cn(
                        "relative rounded-2xl text-center transition-all duration-300 overflow-hidden flex flex-col",
                        selected
                          ? "ring-2 ring-foreground bg-card shadow-[var(--shadow-glow)]"
                          : "ring-1 ring-border bg-card hover:shadow-[var(--shadow-elevated)]"
                      )}>

                      {/* Tag */}
                      {c.tag && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-foreground text-background px-2 py-0.5 rounded-full">
                            {c.tag}
                          </span>
                        </div>
                      )}

                      {/* Car image */}
                      <div className={cn(
                        "relative h-24 flex items-end justify-center pt-3 px-2 transition-colors duration-300",
                        selected ? "bg-muted/80" : "bg-muted/40"
                      )}>
                        <motion.img
                          src={c.img}
                          alt={c.label}
                          loading="lazy"
                          width={140}
                          height={90}
                          className="object-contain max-h-[80px] relative z-10"
                          animate={selected ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                      </div>

                      {/* Info */}
                      <div className="p-3 flex flex-col items-center gap-0.5">
                        <span className="font-bold text-sm text-foreground">{c.label}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{c.example}</span>
                        <span className="text-base font-extrabold tabular-nums text-foreground mt-1.5">£{adjustedPrice}</span>
                        {c.multiplier > 1 && (
                          <span className="text-[9px] font-semibold text-premium">+{Math.round((c.multiplier - 1) * 100)}% surcharge</span>
                        )}
                      </div>

                      {/* Selection indicator */}
                      <motion.div
                        className="absolute bottom-2 right-2"
                        animate={selected ? { scale: 1 } : { scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}>
                        <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 2: Add-ons ══════ */}
          {step === 2 && (
            <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={ease}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">
              <StepHeader title="Any extras?" sub="Optional add-ons for a perfect finish" />

              {/* Live price summary */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="mt-4 mb-5 rounded-xl bg-muted/60 p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{svc?.title} · {carType?.label}</span>
                  <span className="font-semibold text-foreground tabular-nums">£{servicePrice}</span>
                </div>
                <AnimatePresence>
                  {booking.addons.length > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="pt-2 mt-2 border-t border-border/60 space-y-1">
                        {ADDONS.filter((a) => booking.addons.includes(a.id)).map((a) => (
                          <div key={a.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{a.title}</span>
                            <span className="font-medium text-foreground tabular-nums">+£{a.price}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
                  <span className="font-bold text-sm text-foreground">Running total</span>
                  <motion.span key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                    className="font-extrabold text-lg tabular-nums text-foreground">£{total}</motion.span>
                </div>
              </motion.div>

              <div className="space-y-3">
                {ADDONS.map((a, i) => {
                  const selected = booking.addons.includes(a.id);
                  const Icon = a.icon;
                  return (
                    <motion.button key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + i * 0.05, ...ease }} whileTap={{ scale: 0.98 }}
                      onClick={() => toggleAddon(a.id)}
                      className={cn(
                        "w-full rounded-2xl p-4 text-left transition-all duration-200 flex items-center gap-3.5",
                        selected ? "ring-2 ring-foreground bg-card shadow-[var(--shadow-glow)]" : "ring-1 ring-border bg-card"
                      )}>
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm text-foreground block">{a.title}</span>
                        <span className="text-xs text-muted-foreground">{a.desc}</span>
                      </div>
                      <span className={cn(
                        "font-extrabold tabular-nums shrink-0 transition-colors",
                        selected ? "text-foreground" : "text-muted-foreground"
                      )}>+£{a.price}</span>
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center transition-all shrink-0",
                        selected ? "bg-foreground text-background" : "border-2 border-border rounded"
                      )}>
                        {selected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                            <Check size={12} strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="text-xs text-muted-foreground text-center mt-4">
                No extras? Just tap Continue to skip.
              </motion.p>
            </motion.div>
          )}

          {/* ══════ STEP 3: Schedule ══════ */}
          {step === 3 && (
            <motion.div key="s3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={ease}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">
              <StepHeader title="When works for you?" sub="Pick a date and time slot" />

              <div className="mt-5 mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <CalendarIcon size={12} /> Date
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
                  {dateOptions.map((d, i) => {
                    const isSelected = booking.date && isSameDay(booking.date, d);
                    return (
                      <motion.button key={d.toISOString()} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.03 + i * 0.02 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setBooking({ ...booking, date: d })}
                        className={cn(
                          "flex flex-col items-center min-w-[56px] py-2.5 px-2 rounded-xl transition-all shrink-0",
                          isSelected ? "bg-foreground text-background ring-2 ring-foreground" : "bg-card ring-1 ring-border"
                        )}>
                        <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-background/70" : "text-muted-foreground")}>
                          {i === 0 ? "TMR" : format(d, "EEE")}
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

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Clock size={12} /> Time
                </p>
                <div className="space-y-2.5">
                  {WINDOWS.map((w, i) => {
                    const isSelected = booking.window === w.id;
                    return (
                      <motion.button key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setBooking({ ...booking, window: w.id })}
                        className={cn(
                          "w-full rounded-xl p-4 flex items-center gap-3 transition-all",
                          isSelected ? "bg-foreground text-background ring-2 ring-foreground" : "bg-card ring-1 ring-border"
                        )}>
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-background/15" : "bg-muted")}>
                          <Clock size={15} className={isSelected ? "text-background" : "text-muted-foreground"} />
                        </div>
                        <div className="text-left">
                          <span className={cn("font-bold text-sm block", isSelected ? "text-background" : "text-foreground")}>{w.label}</span>
                          <span className={cn("text-xs", isSelected ? "text-background/70" : "text-muted-foreground")}>{w.time}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 4: Location ══════ */}
          {step === 4 && (
            <motion.div key="s4" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={ease}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">

              {/* Map visual — Uber style */}
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl overflow-hidden bg-muted relative h-[140px] flex items-center justify-center mb-5">
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
                {/* Radial pulse */}
                <motion.div
                  animate={{ scale: [1, 1.8, 1], opacity: [0.15, 0, 0.15] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-20 h-20 rounded-full bg-foreground/10" />
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0, 0.1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  className="absolute w-14 h-14 rounded-full bg-foreground/10" />
                {/* Pin */}
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex flex-col items-center gap-1 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg">
                    <Navigation size={18} />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-foreground/30" />
                </motion.div>
                {/* "We come to you" overlay */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  <Car size={12} className="text-foreground" />
                  <span className="text-[11px] font-bold text-foreground">We come to you</span>
                </motion.div>
              </motion.div>

              {/* Saved addresses */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <Bookmark size={10} /> Quick options
                </p>
                <div className="flex gap-2 mb-5">
                  <motion.button whileTap={{ scale: 0.97 }}
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
                    className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-accent text-foreground font-semibold text-sm ring-1 ring-border transition-colors hover:bg-accent/80">
                    <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
                      <LocateFixed size={14} />
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-xs block text-foreground">Current location</span>
                      <span className="text-[10px] text-muted-foreground">Use GPS</span>
                    </div>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setBooking((b) => ({ ...b, postcode: "", address: "" }))}
                    className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-card text-foreground font-semibold text-sm ring-1 ring-border transition-colors hover:bg-muted">
                    <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                      <Search size={14} />
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-xs block text-foreground">Search address</span>
                      <span className="text-[10px] text-muted-foreground">Enter manually</span>
                    </div>
                  </motion.button>
                </div>
              </motion.div>

              {/* Address fields */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="space-y-3.5">

                {/* Postcode with inline lookup feel */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <MapPin size={11} /> Postcode
                  </label>
                  <div className="relative">
                    <input type="text" placeholder="e.g. SW1A 1AA"
                      className="w-full bg-card rounded-xl pl-4 pr-12 py-3.5 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 ring-1 ring-border transition-all"
                      value={booking.postcode}
                      onChange={(e) => setBooking({ ...booking, postcode: e.target.value.toUpperCase() })} />
                    <AnimatePresence>
                      {booking.postcode.length >= 5 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-success/15 flex items-center justify-center">
                          <Check size={12} className="text-success" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <InputField icon={Home} label="Address" placeholder="House number & street" value={booking.address}
                  onChange={(v) => setBooking({ ...booking, address: v })} delay={0} />

                <div className="grid grid-cols-2 gap-3">
                  <InputField icon={User} label="Full name" placeholder="John Smith" value={booking.name}
                    onChange={(v) => setBooking({ ...booking, name: v })} delay={0} />
                  <InputField icon={Phone} label="Phone" placeholder="07XXX XXX XXX" type="tel" value={booking.phone}
                    onChange={(v) => setBooking({ ...booking, phone: v })} delay={0} />
                </div>
              </motion.div>

              {/* Save address toggle */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/60 ring-1 ring-border">
                <Bookmark size={14} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground flex-1">Save this address for next time</span>
                <SaveToggle />
              </motion.div>

              {/* Trust badges */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="mt-4 flex items-center gap-4 justify-center">
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

          {/* ══════ STEP 5: Confirm ══════ */}
          {step === 5 && (
            <motion.div key="s5" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={ease}
              className="flex-1 max-w-lg mx-auto w-full px-5 pt-6 pb-32">
              <StepHeader title="Review your booking" sub="Make sure everything looks good" />

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mt-5 rounded-2xl border border-border overflow-hidden">

                {/* Service header */}
                <div className="p-4 flex items-center gap-3.5 bg-card">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", svc?.color)}>
                    {svc && <svc.icon size={22} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-foreground">{svc?.title}</p>
                    <p className="text-muted-foreground text-xs">{carType?.label} vehicle</p>
                  </div>
                  <span className="text-lg font-extrabold tabular-nums text-foreground">£{servicePrice}</span>
                </div>

                <div className="h-px bg-border" />

                {/* Details */}
                <div className="p-4 space-y-3 bg-card">
                  {[
                    { icon: CalendarIcon, label: "Date", value: booking.date ? format(booking.date, "EEE, d MMM yyyy") : "" },
                    { icon: Clock, label: "Time", value: WINDOWS.find((w) => w.id === booking.window)?.time },
                    { icon: MapPin, label: "Location", value: `${booking.address}, ${booking.postcode}` },
                    { icon: User, label: "Contact", value: `${booking.name} · ${booking.phone}` },
                  ].map(({ icon: Ic, label, value }, i) => (
                    <motion.div key={label} initial={{ x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.15 + i * 0.04 }} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Ic size={14} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium text-foreground truncate">{value}</p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Add-ons */}
                  {booking.addons.length > 0 && (
                    <div className="pt-2 border-t border-border space-y-2">
                      {ADDONS.filter((a) => booking.addons.includes(a.id)).map((a) => (
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

                {/* Total */}
                <div className="bg-muted/50 px-4 py-3.5 flex justify-between items-center border-t border-border">
                  <span className="font-bold text-foreground text-sm">Total</span>
                  <span className="text-2xl font-extrabold tabular-nums text-foreground">£{total}</span>
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
        {!confirmed && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border">
            <div className="max-w-lg mx-auto px-5 py-3.5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                {step >= 1 && total > 0 ? (
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <motion.span key={total} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="text-xl font-extrabold tabular-nums text-foreground leading-tight">£{total}</motion.span>
                      {addonsTotal > 0 && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-[10px] text-muted-foreground font-medium">
                          incl. £{addonsTotal} extras
                        </motion.span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">
                      {[svc?.title, carType?.label, booking.addons.length > 0 ? `+${booking.addons.length} add-on${booking.addons.length > 1 ? "s" : ""}` : null]
                        .filter(Boolean).join(" · ")}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Select to see pricing</span>
                )}
              </div>
              <motion.button
                whileTap={canContinue() ? { scale: 0.97 } : {}}
                disabled={!canContinue() || submitting}
                onClick={step === 5 ? confirm : next}
                className="flex-[1.5] bg-foreground text-background font-bold text-[15px] py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-30">
                {step === 5 ? (
                  <>Confirm · £{total} <CheckCircle2 size={16} /></>
                ) : step === 2 ? (
                  <>{booking.addons.length > 0 ? "Continue" : "Skip"} <ChevronRight size={16} /></>
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

const RadioDot = ({ selected }: { selected: boolean }) => (
  <div className={cn(
    "w-5 h-5 rounded-full flex items-center justify-center transition-all",
    selected ? "bg-foreground text-background" : "border-2 border-border"
  )}>
    {selected && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
        <Check size={11} strokeWidth={3} />
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
  delay?: number;
  type?: string;
}

const InputField = ({ icon: Icon, label, placeholder, value, onChange, delay = 0, type = "text" }: InputFieldProps) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
      <Icon size={11} /> {label}
    </label>
    <input type={type} placeholder={placeholder}
      className="w-full bg-card rounded-xl px-4 py-3.5 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 ring-1 ring-border transition-all"
      value={value} onChange={(e) => onChange(e.target.value)} />
  </motion.div>
);

const SaveToggle = () => {
  const [on, setOn] = useState(false);
  return (
    <button onClick={() => { setOn(!on); if (!on) toast.success("Address will be saved"); }}
      className={cn(
        "w-10 h-6 rounded-full transition-colors relative shrink-0",
        on ? "bg-foreground" : "bg-border"
      )}>
      <motion.div
        className="w-4.5 h-4.5 rounded-full bg-background absolute top-[3px] shadow-sm"
        animate={{ left: on ? 20 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ width: 18, height: 18 }}
      />
    </button>
  );
};

export default BookingApp;
