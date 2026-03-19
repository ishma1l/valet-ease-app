import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { format, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  MapPin, Clock, CheckCircle2, ChevronRight, ArrowLeft, Zap,
  CalendarIcon, User, Phone, MapPinned, Sparkles,
  Navigation, Shield, Edit3, LocateFixed, Star, Award, Users,
} from "lucide-react";
import ServiceCard from "./ServiceCard";
import TrustBanner from "./TrustBanner";
import heroImage from "@/assets/hero-car-wash.jpg";

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
  { id: "basic", title: "Basic Wash", description: "Exterior hand wash, rinse & dry", price: 15, duration: "30 min", rating: 4.8, bookings: 340 },
  { id: "valet", title: "Full Valet", description: "Complete interior & exterior clean", price: 25, tag: "Most Popular", duration: "60 min", rating: 4.9, bookings: 520 },
  { id: "premium", title: "Premium Detail", description: "Deep clean, polish & wax treatment", price: 45, duration: "90 min", rating: 5.0, bookings: 180 },
];

const WINDOWS = [
  { id: "morning", label: "Morning", time: "9 – 12", slots: 3 },
  { id: "afternoon", label: "Afternoon", time: "12 – 4", slots: 5 },
  { id: "evening", label: "Evening", time: "4 – 7", slots: 2 },
];

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};
const transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

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
    if (step === 0) return true;
    if (step === 1) return !!booking.service;
    if (step === 2) return !!booking.date && !!booking.window;
    if (step === 3) return booking.name && booking.phone && booking.address && booking.postcode;
    if (step === 4) return true;
    return true;
  };

  const reset = () => {
    setDir(1); setStep(0); setConfirmed(false);
    setBooking({ postcode: "", service: null, date: undefined, window: "", express: false, name: "", phone: "", address: "" });
  };

  // Generate next 14 days for date picker
  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  /* ─── Loading ─── */
  if (submitting) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-14 h-14 rounded-full border-[2.5px] border-muted border-t-foreground" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={18} className="text-foreground" />
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

  /* ═══════════ MAIN FLOW ═══════════ */
  return (
    <div className="min-h-svh bg-background text-foreground font-sans flex flex-col">

      {/* Nav */}
      <AnimatePresence>
        {step > 0 && (
          <motion.nav
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={back}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft size={20} />
            </motion.button>
            <div className="flex-1 flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <motion.div key={i} className="h-1 rounded-full flex-1 overflow-hidden bg-muted">
                  <motion.div
                    className="h-full bg-foreground rounded-full"
                    initial={false}
                    animate={{ width: step > i ? "100%" : step === i ? "50%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </motion.div>
              ))}
            </div>
            <span className="text-xs font-semibold text-muted-foreground tabular-nums w-8 text-right">
              {Math.min(step, TOTAL_STEPS)}/{TOTAL_STEPS}
            </span>
          </motion.nav>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>

          {/* ══════ HERO ══════ */}
          {step === 0 && (
            <motion.div key="hero" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={transition}
              className="flex flex-col flex-1">
              <div className="relative h-[52vh] min-h-[320px] overflow-hidden">
                <motion.img initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  src={heroImage} alt="Premium car detailing" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="absolute top-5 left-5 z-10">
                  <span className="text-xs font-extrabold tracking-tight text-primary-foreground bg-foreground/80 backdrop-blur-md px-4 py-2 rounded-full">
                    Valet Ease
                  </span>
                </motion.div>
              </div>

              <div className="relative -mt-28 z-10 px-6 flex flex-col flex-1">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] leading-[1.1] text-foreground">
                    Premium Car Wash<br />
                    <span className="text-muted-foreground">at Your Doorstep</span>
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2.5 leading-relaxed">
                    Book in under 60 seconds. We come to you.
                  </p>
                </motion.div>

                {/* Stats bar - Booksy style */}
                <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                  className="mt-5 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 bg-foreground text-background px-2.5 py-1 rounded-full">
                      <Star size={11} fill="currentColor" />
                      <span className="text-[11px] font-bold">4.9</span>
                    </div>
                    <span className="text-xs text-muted-foreground">200+ reviews</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users size={13} />
                    <span>1,200+ bookings</span>
                  </div>
                </motion.div>

                <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                  className="mt-4">
                  <TrustBanner variant="pills" delay={0.45} />
                </motion.div>

                <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                  className="mt-auto pt-6 pb-8 space-y-3">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={next}
                    className="w-full bg-foreground text-background font-bold text-[15px] py-4 rounded-2xl flex items-center justify-center gap-2 active:bg-primary-hover transition-colors">
                    Book Now
                    <ChevronRight size={17} />
                  </motion.button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Free cancellation · No payment required yet
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 1: Service ══════ */}
          {step === 1 && (
            <motion.div key="service" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={transition}
              className="flex-1 px-5 pt-6 pb-36">
              <header className="mb-6">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Choose a service</h1>
                <p className="text-sm text-muted-foreground mt-1">Select what your car needs</p>
              </header>

              <div className="space-y-3">
                {SERVICES.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.08, ...transition }}>
                    <ServiceCard {...s} selected={booking.service === s.id}
                      onClick={(id) => setBooking({ ...booking, service: id })} />
                  </motion.div>
                ))}
              </div>

              {/* Express upsell */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="mt-4">
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={() => setBooking({ ...booking, express: !booking.express })}
                  className={cn(
                    "w-full rounded-2xl p-4 flex items-center gap-3.5 text-left transition-all duration-200",
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
            <motion.div key="schedule" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={transition}
              className="flex-1 px-5 pt-6 pb-36">
              <header className="mb-6">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Pick date & time</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose when works for you</p>
              </header>

              {/* Horizontal scrolling date chips */}
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
                        transition={{ delay: 0.05 + i * 0.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setBooking({ ...booking, date: d })}
                        className={cn(
                          "flex flex-col items-center min-w-[60px] py-3 px-2 rounded-2xl transition-all duration-200 shrink-0",
                          isSelected
                            ? "bg-foreground text-background ring-2 ring-foreground"
                            : "bg-card ring-1 ring-border hover:ring-foreground/20"
                        )}
                      >
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          isSelected ? "text-background/70" : "text-muted-foreground"
                        )}>
                          {isToday ? "TMR" : format(d, "EEE")}
                        </span>
                        <span className={cn(
                          "text-lg font-extrabold tabular-nums leading-tight mt-0.5",
                          isSelected ? "text-background" : "text-foreground"
                        )}>
                          {format(d, "d")}
                        </span>
                        <span className={cn(
                          "text-[10px] font-medium",
                          isSelected ? "text-background/70" : "text-muted-foreground"
                        )}>
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
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.06 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setBooking({ ...booking, window: w.id })}
                        className={cn(
                          "w-full rounded-2xl p-4 flex items-center justify-between transition-all duration-200",
                          isSelected
                            ? "bg-foreground text-background ring-2 ring-foreground"
                            : "bg-card ring-1 ring-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            isSelected ? "bg-background/15" : "bg-muted"
                          )}>
                            <Clock size={16} className={isSelected ? "text-background" : "text-muted-foreground"} />
                          </div>
                          <div className="text-left">
                            <span className={cn("font-bold text-sm block", isSelected ? "text-background" : "text-foreground")}>
                              {w.label}
                            </span>
                            <span className={cn("text-xs", isSelected ? "text-background/70" : "text-muted-foreground")}>
                              {w.time}
                            </span>
                          </div>
                        </div>
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full",
                          isSelected ? "bg-background/15 text-background" : "bg-success/10 text-success"
                        )}>
                          {w.slots} slots
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 3: Location ══════ */}
          {step === 3 && (
            <motion.div key="location" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={transition}
              className="flex-1 px-5 pt-6 pb-36">
              <header className="mb-6">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Where's your car?</h1>
                <p className="text-sm text-muted-foreground mt-1">We'll come right to you</p>
              </header>

              {/* Map visual */}
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl overflow-hidden bg-muted relative h-[120px] flex items-center justify-center mb-4"
                style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="absolute inset-0 opacity-[0.05]"
                  style={{ backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex flex-col items-center gap-1 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg">
                    <Navigation size={16} />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-foreground/20" />
                </motion.div>
              </motion.div>

              {/* Use current location */}
              <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent text-foreground font-semibold text-sm transition-colors hover:bg-accent/80 mb-5">
                <LocateFixed size={16} />
                Use current location
              </motion.button>

              <div className="space-y-4">
                <InputField icon={MapPin} label="Postcode" placeholder="e.g. SW1A 1AA" value={booking.postcode}
                  onChange={(v) => setBooking({ ...booking, postcode: v.toUpperCase() })} delay={0.15} />
                <InputField icon={MapPinned} label="Address" placeholder="House number & street" value={booking.address}
                  onChange={(v) => setBooking({ ...booking, address: v })} delay={0.2} />
                <div className="grid grid-cols-2 gap-3">
                  <InputField icon={User} label="Name" placeholder="Full name" value={booking.name}
                    onChange={(v) => setBooking({ ...booking, name: v })} delay={0.25} />
                  <InputField icon={Phone} label="Phone" placeholder="07XXX" type="tel" value={booking.phone}
                    onChange={(v) => setBooking({ ...booking, phone: v })} delay={0.28} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════ STEP 4: Review ══════ */}
          {step === 4 && (
            <motion.div key="review" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={transition}
              className="flex-1 px-5 pt-6 pb-36">
              <header className="mb-6">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Review booking</h1>
                <p className="text-sm text-muted-foreground mt-1">Everything look good?</p>
              </header>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-border overflow-hidden">

                {/* Service header */}
                <div className="p-5 flex items-center gap-3.5 bg-card">
                  <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-foreground">{svc?.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{svc?.description}</p>
                  </div>
                  <span className="text-lg font-extrabold tabular-nums text-foreground">£{svc?.price}</span>
                </div>

                <div className="h-px bg-border" />

                {/* Detail rows */}
                <div className="p-5 space-y-3.5 bg-card">
                  {[
                    { icon: CalendarIcon, label: "Date", value: booking.date ? format(booking.date, "EEE, d MMM yyyy") : "" },
                    { icon: Clock, label: "Time", value: WINDOWS.find((w) => w.id === booking.window)?.time },
                    { icon: MapPin, label: "Location", value: `${booking.address}, ${booking.postcode}` },
                    { icon: User, label: "Contact", value: `${booking.name} · ${booking.phone}` },
                  ].map(({ icon: Ic, label, value }, i) => (
                    <motion.div key={label} initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Ic size={14} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium text-foreground truncate">{value}</p>
                      </div>
                    </motion.div>
                  ))}
                  {booking.express && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-premium-muted flex items-center justify-center shrink-0">
                        <Zap size={14} className="text-premium" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Express</p>
                        <p className="text-sm font-medium text-premium">Within 1 hour (+£7)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="bg-muted/50 px-5 py-4 flex justify-between items-center">
                  <span className="font-bold text-foreground text-sm">Total</span>
                  <motion.span key={total} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-extrabold tabular-nums text-foreground">
                    £{total}
                  </motion.span>
                </div>
              </motion.div>

              {/* Trust */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="flex items-center gap-2 justify-center text-xs text-muted-foreground mt-5">
                <Shield size={13} className="text-success" />
                <span>Secure booking · Fully insured · Cancel anytime</span>
              </motion.div>

              {/* Edit */}
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => go(1)}
                className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-foreground bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center gap-2">
                <Edit3 size={13} />
                Edit details
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Bar ─── */}
      <AnimatePresence>
        {step >= 1 && step <= 4 && !confirmed && (
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
                onClick={step === 4 ? confirm : next}
                className="flex-[2] bg-foreground text-background font-bold text-[15px] py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-30 active:bg-primary-hover">
                {step === 4 ? (
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
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="space-y-1.5">
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
