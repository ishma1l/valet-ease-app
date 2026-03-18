import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, CheckCircle2,
  ChevronRight, ArrowLeft, Zap,
} from "lucide-react";
import StepWrapper from "./StepWrapper";
import ServiceCard from "./ServiceCard";
import TimeWindowCard from "./TimeWindowCard";

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
      <nav className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        {step > 0 && step < 3 ? (
          <button onClick={prevStep} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <span className="font-extrabold tracking-tight text-primary text-lg">GLOSS.</span>
        <div className="w-9" />
      </nav>

      {/* Progress */}
      {step < 3 && (
        <div className="max-w-md mx-auto px-5 pt-4">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto px-5 py-6 pb-36">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepWrapper key="step0" title="Book a wash" subtitle="Enter your location and select a service.">
              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    placeholder="Enter Postcode"
                    className="w-full pl-11 pr-4 py-4 rounded-2xl bg-card ring-1 ring-border focus:ring-2 focus:ring-primary outline-none transition-all font-medium uppercase placeholder:normal-case placeholder:text-muted-foreground"
                    value={booking.postcode}
                    onChange={(e) => setBooking({ ...booking, postcode: e.target.value })}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Services
                  </label>
                  {SERVICES.map((s) => (
                    <ServiceCard
                      key={s.id}
                      {...s}
                      selected={booking.service === s.id}
                      onClick={(id) => setBooking({ ...booking, service: id })}
                    />
                  ))}
                </div>
              </div>
            </StepWrapper>
          )}

          {step === 1 && (
            <StepWrapper key="step1" title="When should we come?" subtitle="Select a date and arrival window.">
              <div className="space-y-6">
                <input
                  type="date"
                  className="w-full p-4 rounded-2xl bg-card ring-1 ring-border focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                  value={booking.date}
                  onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                />

                <div className="space-y-3">
                  <div className="p-3 bg-accent rounded-xl border border-primary/20 flex gap-3 items-start">
                    <Clock className="text-primary shrink-0 mt-0.5" size={16} />
                    <p className="text-xs leading-relaxed text-accent-foreground">
                      <strong>Window Booking:</strong> Your car will be washed within your selected time window, not at a specific minute.
                    </p>
                  </div>

                  {WINDOWS.map((w) => (
                    <TimeWindowCard
                      key={w.id}
                      {...w}
                      selected={booking.window === w.id}
                      onClick={(id) => setBooking({ ...booking, window: id })}
                    />
                  ))}
                </div>
              </div>
            </StepWrapper>
          )}

          {step === 2 && (
            <StepWrapper key="step2" title="Final details" subtitle="Who are we looking for?">
              <div className="space-y-4">
                <div className="space-y-3">
                  <input
                    placeholder="Full Name"
                    className="w-full p-4 rounded-2xl bg-card ring-1 ring-border focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground"
                    value={booking.details.name}
                    onChange={(e) =>
                      setBooking({ ...booking, details: { ...booking.details, name: e.target.value } })
                    }
                  />
                  <input
                    placeholder="Phone Number"
                    type="tel"
                    className="w-full p-4 rounded-2xl bg-card ring-1 ring-border focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground"
                    value={booking.details.phone}
                    onChange={(e) =>
                      setBooking({ ...booking, details: { ...booking.details, phone: e.target.value } })
                    }
                  />
                  <textarea
                    placeholder="Full Address"
                    rows={3}
                    className="w-full p-4 rounded-2xl bg-card ring-1 ring-border focus:ring-2 focus:ring-primary outline-none resize-none placeholder:text-muted-foreground"
                    value={booking.details.address}
                    onChange={(e) =>
                      setBooking({ ...booking, details: { ...booking.details, address: e.target.value } })
                    }
                  />
                </div>

                <button
                  onClick={() => setBooking({ ...booking, express: !booking.express })}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left border-2
                    ${booking.express
                      ? "border-warning bg-warning-muted"
                      : "border-transparent bg-muted"}`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      booking.express ? "bg-warning text-warning-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Zap size={20} fill={booking.express ? "currentColor" : "none"} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">Express Service</span>
                      <span className="font-bold text-warning tabular-nums">+£7</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get your car washed within 1 hour of your window start.
                    </p>
                  </div>
                </button>

                {/* Pricing Breakdown */}
                <div className="mt-2 bg-card rounded-2xl ring-1 ring-border p-5 space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Price Summary
                  </label>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">{selectedService?.title}</span>
                    <span className="font-semibold tabular-nums">£{selectedService?.price || 0}</span>
                  </div>
                  {booking.express && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Express Service</span>
                      <span className="font-semibold tabular-nums text-warning">£7</span>
                    </div>
                  )}
                  <div className="border-t border-muted pt-3 flex justify-between items-center">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-xl font-extrabold tabular-nums">£{total}</span>
                  </div>
                </div>
              </div>
            </StepWrapper>
          )}

          {step === 3 && (
            <StepWrapper key="step3" title="Booking Confirmed!">
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-20 h-20 bg-success-muted text-success rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-xl font-bold mb-2">We're on our way soon</h2>
                <p className="text-muted-foreground mb-8">
                  A confirmation text has been sent to {booking.details.phone}.
                </p>

                <div className="w-full bg-card rounded-3xl p-6 ring-1 ring-border space-y-4 text-left">
                  <div className="flex justify-between border-b border-muted pb-3">
                    <span className="text-muted-foreground text-sm">Service</span>
                    <span className="font-semibold capitalize">{selectedService?.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-muted pb-3">
                    <span className="text-muted-foreground text-sm">Date</span>
                    <span className="font-semibold">{booking.date}</span>
                  </div>
                  <div className="flex justify-between border-b border-muted pb-3">
                    <span className="text-muted-foreground text-sm">Window</span>
                    <span className="font-semibold capitalize">
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
                    <span className="text-muted-foreground text-sm">Total</span>
                    <span className="font-bold text-lg tabular-nums">£{total}</span>
                  </div>
                </div>

                <button
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
                  className="mt-8 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold transition-all active:scale-[0.98]"
                >
                  Book Another Wash
                </button>
              </div>
            </StepWrapper>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Action Bar */}
      {step < 3 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-card/80 backdrop-blur-xl border-t border-border z-40">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <div className="flex flex-col flex-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                Total Estimate
              </span>
              <span className="text-xl font-bold tabular-nums">£{total}</span>
            </div>
            <button
              disabled={!isStepValid()}
              onClick={step === 2 ? confirmBooking : nextStep}
              className="flex-[2] bg-primary disabled:bg-muted disabled:text-muted-foreground text-primary-foreground py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {step === 2 ? "Confirm Booking" : "Continue"}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingApp;
