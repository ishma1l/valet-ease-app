import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin, Clock, CheckCircle2,
  ChevronRight, ArrowLeft, Zap, Calendar, User, Phone, MapPinned,
  Loader2, ShieldCheck, Sparkles,
} from "lucide-react";
import StepWrapper from "./StepWrapper";
import ServiceCard from "./ServiceCard";
import TimeWindowCard from "./TimeWindowCard";
import TrustBanner from "./TrustBanner";

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
  { id: "valet", title: "Full Valet", description: "Complete interior & exterior", price: 25 },
  { id: "interior", title: "Interior Clean", description: "Deep interior detailing", price: 20 },
];

const WINDOWS = [
  { id: "morning", label: "Morning", time: "9am – 12pm" },
  { id: "afternoon", label: "Afternoon", time: "12pm – 4pm" },
  { id: "evening", label: "Evening", time: "4pm – 7pm" },
];

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

  const STEP_LABELS = ["Service", "Schedule", "Details"];

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

      {/* Progress */}
      {step < 3 && (
        <div className="max-w-md mx-auto px-5 pt-5 pb-1">
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
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                  i <= step ? "text-primary" : "text-muted-foreground/50"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto px-5 py-6 pb-40">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepWrapper key="step0" title="Book a wash" subtitle="Enter your location and select a service.">
              <div className="space-y-4">
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

                <div className="space-y-3 pt-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1 flex items-center gap-1.5">
                    <Sparkles size={12} />
                    Choose your service
                  </label>
                  {SERVICES.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.08 }}
                    >
                      <ServiceCard
                        {...s}
                        selected={booking.service === s.id}
                        onClick={(id) => setBooking({ ...booking, service: id })}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </StepWrapper>
          )}

          {step === 1 && (
            <StepWrapper key="step1" title="When should we come?" subtitle="Select a date and arrival window.">
              <div className="space-y-6">
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="date"
                    className="input-field pl-11"
                    value={booking.date}
                    onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-accent rounded-2xl border border-primary/10 flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="text-primary" size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-accent-foreground mb-0.5">Window Booking</p>
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
                      transition={{ delay: 0.25 + i * 0.08 }}
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

          {step === 2 && (
            <StepWrapper key="step2" title="Final details" subtitle="Almost there — just a few more things.">
              <div className="space-y-4">
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

                {/* Express upgrade */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setBooking({ ...booking, express: !booking.express })}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 text-left border-2
                    ${booking.express
                      ? "border-warning bg-warning-muted"
                      : "border-transparent bg-muted hover:bg-secondary"}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                      ${booking.express ? "bg-warning text-warning-foreground" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Zap size={20} fill={booking.express ? "currentColor" : "none"} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">Express Service</span>
                      <span className="font-bold text-warning tabular-nums">+£7</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Get your car washed within 1 hour of your window start.
                    </p>
                  </div>
                </motion.button>

                {/* Pricing Breakdown */}
                <div className="mt-2 card-elevated p-5 space-y-3">
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
                        <span className="font-semibold tabular-nums text-warning">£7</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="border-t border-muted pt-3 flex justify-between items-center">
                    <span className="font-bold text-foreground">Total</span>
                    <motion.span
                      key={total}
                      initial={{ y: -4, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-xl font-extrabold tabular-nums"
                    >
                      £{total}
                    </motion.span>
                  </div>
                </div>
              </div>
            </StepWrapper>
          )}

          {step === 3 && (
            <StepWrapper key="step3" title="Booking Confirmed!">
              <div className="flex flex-col items-center py-8 text-center">
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
                  className="text-xl font-bold mb-2"
                >
                  We're on our way soon
                </motion.h2>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground mb-8"
                >
                  A confirmation text has been sent to {booking.details.phone}.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-full card-elevated p-6 space-y-4 text-left"
                >
                  <div className="flex justify-between border-b border-muted pb-3">
                    <span className="text-muted-foreground text-sm">Service</span>
                    <span className="font-semibold">{selectedService?.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-muted pb-3">
                    <span className="text-muted-foreground text-sm">Date</span>
                    <span className="font-semibold">{booking.date}</span>
                  </div>
                  <div className="flex justify-between border-b border-muted pb-3">
                    <span className="text-muted-foreground text-sm">Window</span>
                    <span className="font-semibold">
                      {WINDOWS.find((w) => w.id === booking.window)?.label} ({WINDOWS.find((w) => w.id === booking.window)?.time})
                    </span>
                  </div>
                  {booking.express && (
                    <div className="flex justify-between border-b border-muted pb-3">
                      <span className="text-muted-foreground text-sm">Express</span>
                      <span className="font-semibold text-warning">Yes (+£7)</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground text-sm">Total Paid</span>
                    <span className="font-extrabold text-xl tabular-nums">£{total}</span>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.65 }}
                  whileTap={{ scale: 0.98 }}
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
                  className="mt-8 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold transition-all"
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
          className="fixed bottom-0 left-0 right-0 p-5 glass-surface border-t border-border z-40"
        >
          <div className="max-w-md mx-auto flex items-center gap-4">
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
              className="flex-[2] bg-primary disabled:bg-muted disabled:text-muted-foreground text-primary-foreground py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-primary/20 disabled:shadow-none"
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
