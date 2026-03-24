import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import {
  ArrowLeft, CheckCircle2, ChevronRight, Clock, MapPin, User,
  Phone, Calendar as CalendarIcon, Loader2, Sparkles, Shield,
  Sun, CloudSun, Sunset,
} from "lucide-react";

const WINDOWS = [
  { id: "morning", label: "Morning", time: "9 – 12", icon: Sun },
  { id: "afternoon", label: "Afternoon", time: "12 – 4", icon: CloudSun },
  { id: "evening", label: "Evening", time: "4 – 7", icon: Sunset },
];

const STEP_LABELS = ["Service", "Date", "Time", "Details", "Review"];

interface BookingState {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  date: Date | undefined;
  window: string;
  name: string;
  phone: string;
  address: string;
  postcode: string;
}

const WhiteLabelBooking = () => {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [booking, setBooking] = useState<BookingState>({
    serviceId: "", serviceName: "", servicePrice: 0,
    date: undefined, window: "",
    name: "", phone: "", address: "", postcode: "",
  });

  useEffect(() => {
    const load = async () => {
      const { data: biz } = await supabase.from("businesses").select("*").eq("slug", slug).maybeSingle();
      if (!biz) { setNotFound(true); setLoading(false); return; }
      setBusiness(biz);
      const { data: svcs } = await supabase.from("business_services").select("*").eq("business_id", biz.id).eq("active", true).order("sort_order");
      setServices(svcs || []);
      setLoading(false);
    };
    load();
  }, [slug]);

  const primaryColor = business?.primary_color || "#1a1b2e";

  const next = useCallback(() => {
    setDir(1); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const back = useCallback(() => {
    setDir(-1); setStep((s) => Math.max(s - 1, 0));
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const selectService = (svc: any) => {
    setBooking((b) => ({ ...b, serviceId: svc.id, serviceName: svc.title, servicePrice: svc.price }));
    setTimeout(() => next(), 300);
  };

  const canContinue = () => {
    if (step === 0) return !!booking.serviceId;
    if (step === 1) return !!booking.date;
    if (step === 2) return !!booking.window;
    if (step === 3) return !!(booking.name && booking.phone && booking.address && booking.postcode);
    return true;
  };

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      business_id: business.id,
      customer_name: booking.name,
      phone: booking.phone,
      address: booking.address,
      postcode: booking.postcode,
      service: booking.serviceName,
      service_price: booking.servicePrice,
      time_window: booking.window,
      booking_date: booking.date ? format(booking.date, "yyyy-MM-dd") : "",
      express: false,
      total_price: booking.servicePrice,
    });
    setSubmitting(false);
    if (error) { toast.error("Booking failed"); return; }
    setConfirmed(true);
  };

  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  if (loading) return (
    <div className="min-h-svh bg-background flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-muted-foreground" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-svh bg-background flex items-center justify-center px-5 text-center">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Not Found</h1>
        <p className="text-muted-foreground">This booking page doesn't exist.</p>
      </div>
    </div>
  );

  if (submitting) return (
    <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
        <div className="relative">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-[3px] border-muted" style={{ borderTopColor: primaryColor }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={20} style={{ color: primaryColor }} />
          </div>
        </div>
        <p className="font-bold text-lg">Confirming booking…</p>
      </motion.div>
    </div>
  );

  if (confirmed) return (
    <div className="min-h-svh bg-background flex flex-col px-5 py-8 max-w-lg mx-auto">
      <div className="flex flex-col items-center text-center mb-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: primaryColor + "15" }}>
          <CheckCircle2 size={44} style={{ color: primaryColor }} />
        </motion.div>
        <h1 className="text-2xl font-extrabold tracking-tight">Booking Confirmed!</h1>
        <p className="text-muted-foreground text-sm mt-2">
          {booking.serviceName} on {booking.date ? format(booking.date, "EEE, d MMM") : ""}
        </p>
      </div>
      <div className="card-surface p-4 space-y-3">
        {[
          { icon: CalendarIcon, label: "Date", value: booking.date ? format(booking.date, "EEEE, d MMMM yyyy") : "" },
          { icon: Clock, label: "Time", value: WINDOWS.find((w) => w.id === booking.window)?.time },
          { icon: MapPin, label: "Location", value: `${booking.address}, ${booking.postcode}` },
        ].map(({ icon: Ic, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Ic size={15} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground mt-4">
        <Shield size={13} style={{ color: primaryColor }} />
        <span>Powered by Valet Ease</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-background text-foreground font-sans flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <motion.button whileTap={{ scale: 0.85 }} onClick={back}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted -ml-1 mr-1">
                <ArrowLeft size={20} />
              </motion.button>
            )}
            <div className="flex items-center gap-2">
              {business.logo_url && <img src={business.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover" />}
              <span className="text-lg font-extrabold tracking-tight">{business.name}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium tabular-nums">{step + 1}/{STEP_LABELS.length}</span>
        </div>
        <div className="max-w-lg mx-auto px-5 pb-0.5 flex gap-1">
          {Array.from({ length: STEP_LABELS.length }, (_, i) => (
            <div key={i} className="h-[3px] flex-1 rounded-full overflow-hidden bg-border">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: primaryColor }}
                initial={false} animate={{ width: step > i ? "100%" : step === i ? "40%" : "0%" }}
                transition={{ duration: 0.4 }} />
            </div>
          ))}
        </div>
      </nav>

      <div ref={scrollRef} className="flex-1 flex flex-col overflow-y-auto">
        <AnimatePresence mode="wait" custom={dir}>
          {/* Step 0: Services */}
          {step === 0 && (
            <motion.div key="svc" custom={dir} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.25 }} className="max-w-lg mx-auto w-full px-5 py-6 space-y-3">
              <div className="mb-2">
                <h2 className="text-xl font-extrabold tracking-tight">Choose a service</h2>
                {business.tagline && <p className="text-sm text-muted-foreground mt-0.5">{business.tagline}</p>}
              </div>
              {services.map((svc) => (
                <motion.button key={svc.id} whileTap={{ scale: 0.97 }} onClick={() => selectService(svc)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    booking.serviceId === svc.id ? "border-current shadow-md" : "border-border hover:border-current/30"
                  }`}
                  style={{ borderColor: booking.serviceId === svc.id ? primaryColor : undefined }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm">{svc.title}</p>
                      {svc.description && <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{svc.duration}</p>
                    </div>
                    <span className="text-xl font-extrabold tabular-nums">£{svc.price}</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 1: Date */}
          {step === 1 && (
            <motion.div key="date" custom={dir} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.25 }} className="max-w-lg mx-auto w-full px-5 py-6">
              <h2 className="text-xl font-extrabold tracking-tight mb-4">Pick a date</h2>
              <div className="grid grid-cols-3 gap-2">
                {dateOptions.map((d) => {
                  const selected = booking.date && format(booking.date, "yyyy-MM-dd") === format(d, "yyyy-MM-dd");
                  return (
                    <motion.button key={d.toISOString()} whileTap={{ scale: 0.95 }}
                      onClick={() => { setBooking((b) => ({ ...b, date: d })); setTimeout(() => next(), 300); }}
                      className={`p-3 rounded-xl text-center border-2 transition-all ${
                        selected ? "text-white shadow-md" : "border-border hover:border-current/30"
                      }`}
                      style={selected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}>
                      <p className="text-[10px] font-bold uppercase">{format(d, "EEE")}</p>
                      <p className="text-lg font-extrabold tabular-nums">{format(d, "d")}</p>
                      <p className="text-[10px]">{format(d, "MMM")}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Time */}
          {step === 2 && (
            <motion.div key="time" custom={dir} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.25 }} className="max-w-lg mx-auto w-full px-5 py-6">
              <h2 className="text-xl font-extrabold tracking-tight mb-4">Choose a time</h2>
              <div className="space-y-3">
                {WINDOWS.map((w) => {
                  const selected = booking.window === w.id;
                  return (
                    <motion.button key={w.id} whileTap={{ scale: 0.97 }}
                      onClick={() => { setBooking((b) => ({ ...b, window: w.id })); setTimeout(() => next(), 300); }}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        selected ? "text-white shadow-md" : "border-border hover:border-current/30"
                      }`}
                      style={selected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}>
                      <w.icon size={22} />
                      <div className="text-left">
                        <p className="font-bold text-sm">{w.label}</p>
                        <p className="text-xs opacity-75">{w.time}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <motion.div key="details" custom={dir} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.25 }} className="max-w-lg mx-auto w-full px-5 py-6 space-y-3">
              <h2 className="text-xl font-extrabold tracking-tight mb-4">Your details</h2>
              {[
                { icon: User, placeholder: "Full name", value: booking.name, key: "name" as const },
                { icon: Phone, placeholder: "Phone number", value: booking.phone, key: "phone" as const },
                { icon: MapPin, placeholder: "Address", value: booking.address, key: "address" as const },
                { icon: MapPin, placeholder: "Postcode", value: booking.postcode, key: "postcode" as const },
              ].map(({ icon: Ic, placeholder, value, key }) => (
                <div key={key} className="relative">
                  <Ic size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input placeholder={placeholder} value={value}
                    onChange={(e) => setBooking((b) => ({ ...b, [key]: e.target.value }))}
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring outline-none" />
                </div>
              ))}
              <motion.button whileTap={{ scale: 0.97 }} onClick={next} disabled={!canContinue()}
                className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{ backgroundColor: primaryColor }}>
                Continue <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <motion.div key="review" custom={dir} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.25 }} className="max-w-lg mx-auto w-full px-5 py-6 space-y-4">
              <h2 className="text-xl font-extrabold tracking-tight">Review & Confirm</h2>
              <div className="card-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{booking.serviceName}</p>
                    <p className="text-xs text-muted-foreground">{booking.date ? format(booking.date, "EEE, d MMM") : ""} · {WINDOWS.find((w) => w.id === booking.window)?.time}</p>
                  </div>
                  <span className="text-2xl font-extrabold tabular-nums">£{booking.servicePrice}</span>
                </div>
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <p className="text-muted-foreground"><span className="font-medium text-foreground">{booking.name}</span> · {booking.phone}</p>
                  <p className="text-muted-foreground">{booking.address}, {booking.postcode}</p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={confirm}
                className="w-full h-14 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}>
                Confirm Booking <CheckCircle2 size={18} />
              </motion.button>
              <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Shield size={12} /> Secure booking · Free cancellation
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WhiteLabelBooking;
