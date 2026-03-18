import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin, Clock, CheckCircle2,
  ChevronRight, ArrowLeft, Zap, Calendar, User, Phone, MapPinned,
  Loader2, ShieldCheck, Star,
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
  { id: "valet", title: "Full Valet", description: "Complete interior & exterior clean", price: 25, tag: "Popular" },
  { id: "interior", title: "Interior Clean", description: "Deep interior detailing", price: 20 },
];

const WINDOWS = [
  { id: "morning", label: "Morning", time: "9am – 12pm" },
  { id: "afternoon", label: "Afternoon", time: "12pm – 4pm" },
  { id: "evening", label: "Evening", time: "4pm – 7pm" },
];

const STEP_LABELS = ["Service", "Schedule", "Details"];

const BookingApp = () => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingState>({
    postcode: "",
    service: null,
    date: "",
    window: "",
    express: false,
    details: { name: "", phone: "", address: "" },
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

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
      toast.error("Failed to save booking. Please try again.");
      return;
    }
    setStep(3);
  };

  const selectedService = SERVICES.find((s) => s.id === booking.service);
  const total = (selectedService?.price || 0) + (booking.express ? 7 : 0);

  const isStepValid = () => {
    if (step === 0) return booking.postcode.length >= 3 && booking.service;
    if (step === 1) return booking.date && booking.window;
    if (step === 2) return booking.details.name && booking.details.phone && booking.details.address;
    return true;
  };

  return (
    <div className="min-h-svh bg-background text-foreground font-sans selection:bg-accent antialiased">
      {/* Header */}
      <nav className="sticky top-0 z-30 glass-surface border-b border-border px-4 py-3 flex items-center justify-between">
        {step > 0 && step < 3 ? (
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={prevStep}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </motion.button>
        ) : (
          <div className="w-9" />
        )}
        <span className="font-black tracking-[-0.04em] text-primary text-xl">GLOSS.</span>
        <div className="w-9" />
      </nav>

      {/* Progress Bar */}
      {step > 0 && step < 3 && (
        <div className="max-w-md mx-auto px-5 pt-4 pb-1">
          <div className="flex gap-2 mb-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: i <= step ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: i * 0.05 }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between px-0.5">
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${
                  i <= step ? "text-primary" : "text-muted-foreground/40"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto px-5 py-0 pb-40">
        <AnimatePresence mode="wait">
          {/* ============ STEP 0: Hero + Service Selection ============ */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ x: -30, opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6 w-full"
            >
              {/* Hero Section */}
              <div className="relative -mx-5 -mt-0 overflow-hidden">
                <div className="relative h-[280px] sm:h-[320px]">
                  <img
                    src={heroImage}
                    alt="Professional car wash at your doorstep"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
                    <motion.h1
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="text-[2rem] sm:text-[2.25rem] font-black tracking-[-0.04em] text-foreground leading-[1.1] mb-2"
                    >
                      Car Wash At
                      <br />
                      Your Doorstep
                    </motion.h1>
                    <motion.p
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.35, duration: 0.4 }}
                      className="text-muted-foreground text-[0.95rem] leading-relaxed"
                    >
                      Book in 60 seconds. We come to you.
                    </motion.p>
                  </div>
                </div>
              </div>

              {/* Trust strip */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <TrustBanner variant="compact" delay={0.5} />
              </motion.div>

              {/* Postcode */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1 mb-2 block">
                  Your location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    placeholder="Enter Postcode"
                    className="input-field pl-11 uppercase placeholder:normal-case"
                    value={booking.postcode}
                    onChange={(e) => setBooking({ ...booking, postcode: e.target.value })}
                  />
                </div>
              </motion.div>

              {/* Services */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="space-y-3"
              >
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1 flex items-center gap-1.5">
                  <Star size={12} />
                  Choose your service
                </label>
                {SERVICES.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >
                    <ServiceCard
                      {...s}
                      selected={booking.service === s.id}
                      onClick={(id) => setBooking({ ...booking, service: id })}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ============ STEP 1: Date & Time ============ */}
          {step === 1 && (
            <StepWrapper key="step1" title="When should we come?" subtitle="Pick a date and time window that works for you.">
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1 mb-2 flex items-center gap-1.5">
                    <Calendar size={12} />
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                    <input
                      type="date"
                      className="input-field pl-11"
                      value={booking.date}
                      onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl flex gap-3 items-start"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--muted)))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-card flex items-center justify-center shrink-0 mt-0.5"
                      style={{ boxShadow: "var(--shadow-sm)" }}>
                      <ShieldCheck className="text-primary" size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground mb-0.5">Window Booking</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Your car will be washed within your selected time window, not at a specific minute.
                      </p>
                    </div>
                  </div>

                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1 flex items-center gap-1.5 pt-1">
                    <Clock size={12} />
                    Time window
                  </label>

                  {WINDOWS.map((w, i) => (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
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
            </StepWrapper>
          )}

          {/* ============ STEP 2: Details + Express + Pricing ============ */}
          {step === 2 && (
            <StepWrapper key="step2" title="Final details" subtitle="Almost there — just a few more things.">
              <div className="space-y-5">
                {/* Form fields */}
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      placeholder="Full Name"
                      className="input-field pl-11"
                      value={booking.details.name}
                      onChange={(e) =>
                        setBooking({ ...booking, details: { ...booking.details, name: e.target.value } })
                      }
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      placeholder="Phone Number"
                      type="tel"
                      className="input-field pl-11"
                      value={booking.details.phone}
                      onChange={(e) =>
                        setBooking({ ...booking, details: { ...booking.details, phone: e.target.value } })
                      }
                    />
                  </div>
                  <div className="relative">
                    <MapPinned className="absolute left-4 top-5 text-muted-foreground" size={18} />
                    <textarea
                      placeholder="Full Address"
                      rows={3}
                      className="input-field pl-11 resize-none"
                      value={booking.details.address}
                      onChange={(e) =>
                        setBooking({ ...booking, details: { ...booking.details, address: e.target.value } })
                      }
                    />
                  </div>
                </div>

                {/* Premium Express Card */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setBooking({ ...booking, express: !booking.express })}
                  className={`w-full p-5 rounded-2xl flex items-center gap-4 transition-all duration-200 text-left relative overflow-hidden
                    ${booking.express
                      ? "bg-premium-muted"
                      : "bg-card hover:translate-y-[-1px]"}`}
                  style={{
                    border: booking.express
                      ? "2px solid hsl(var(--premium))"
                      : "1.5px solid hsl(var(--border))",
                    boxShadow: booking.express
                      ? "0 0 0 1px hsl(var(--premium)), 0 4px 20px rgba(124,58,237,0.15)"
                      : "var(--shadow-card)",
                  }}
                >
                  {/* Glow effect when active */}
                  {booking.express && (
                    <div className="absolute inset-0 bg-gradient-to-r from-premium/5 via-transparent to-premium/5 pointer-events-none" />
                  )}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200
                      ${booking.express ? "bg-premium text-premium-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    <Zap size={22} fill={booking.express ? "currentColor" : "none"} />
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-foreground block">Express Service</span>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          Need it ASAP? Get your car washed within 1 hour.
                        </p>
                      </div>
                      <span className="font-extrabold tabular-nums text-premium shrink-0 ml-3">+£7</span>
                    </div>
                  </div>
                </motion.button>

                {/* Pricing Breakdown */}
                <div className="card-elevated p-5 space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1.5">
                    Price Summary
                  </label>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">{selectedService?.title}</span>
                    <span className="font-semibold tabular-nums">£{selectedService?.price || 0}</span>
                  </div>
                  <AnimatePresence>
                    {booking.express && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex justify-between items-center overflow-hidden"
                      >
                        <span className="text-sm text-foreground">Express Service</span>
                        <span className="font-semibold tabular-nums text-premium">£7</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="font-bold text-foreground">Total</span>
                    <motion.span
                      key={total}
                      initial={{ y: -4, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-2xl font-extrabold tabular-nums"
                    >
                      £{total}
                    </motion.span>
                  </div>
                </div>
              </div>
            </StepWrapper>
          )}

          {/* ============ STEP 3: Confirmation ============ */}
          {step === 3 && (
            <StepWrapper key="step3" title="Booking Confirmed!">
              <div className="flex flex-col items-center py-6 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-20 h-20 bg-success-muted text-success rounded-full flex items-center justify-center mb-6"
                >
                  <CheckCircle2 size={40} />
                </motion.div>
                <motion.h2
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-extrabold mb-2 tracking-tight"
                >
                  We're on our way soon
                </motion.h2>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground mb-6 text-sm"
                >
                  A confirmation text has been sent to {booking.details.phone}.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-full card-elevated p-6 space-y-4 text-left"
                >
                  {[
                    { label: "Service", value: selectedService?.title },
                    { label: "Date", value: booking.date },
                    {
                      label: "Window",
                      value: `${WINDOWS.find((w) => w.id === booking.window)?.label} (${WINDOWS.find((w) => w.id === booking.window)?.time})`,
                    },
                    ...(booking.express ? [{ label: "Express", value: "Yes (+£7)", highlight: true }] : []),
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="flex justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                      <span className="text-muted-foreground text-sm">{label}</span>
                      <span className={`font-semibold ${highlight ? "text-premium" : ""}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <span className="text-muted-foreground text-sm">Total Paid</span>
                    <span className="font-extrabold text-xl tabular-nums">£{total}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-full mt-5"
                >
                  <TrustBanner items={[0, 1]} delay={0.65} />
                </motion.div>

                <motion.button
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.75 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setStep(0);
                    setBooking({
                      postcode: "",
                      service: null,
                      date: "",
                      window: "",
                      express: false,
                      details: { name: "", phone: "", address: "" },
                    });
                  }}
                  className="btn-primary mt-6 px-8 py-4 w-full"
                >
                  Book Another Wash
                </motion.button>
              </div>
            </StepWrapper>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Action Bar */}
      {step < 3 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 glass-surface border-t border-border z-40"
        >
          <div className="max-w-md mx-auto px-5 py-4 flex items-center gap-4">
            <div className="flex flex-col flex-1">
              <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-muted-foreground">
                Total
              </span>
              <motion.span
                key={total}
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-extrabold tabular-nums tracking-tight"
              >
                £{total}
              </motion.span>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!isStepValid() || submitting}
              onClick={step === 2 ? confirmBooking : nextStep}
              className="btn-primary flex-[2] py-4 px-6"
            >
              {submitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {step === 2 ? "Confirm Booking" : "Continue"}
                  <ChevronRight size={18} />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BookingApp;
