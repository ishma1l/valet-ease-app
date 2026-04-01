import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, CalendarIcon, Clock, MapPin, User, Shield, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setError("No session ID found");
      setLoading(false);
      return;
    }

    const createBooking = async () => {
      try {
        // Retrieve booking data from sessionStorage
        const raw = sessionStorage.getItem("pending_booking");
        if (!raw) {
          setError("Booking data not found. It may have already been processed.");
          setLoading(false);
          return;
        }

        const bookingData = JSON.parse(raw);

        // Check if booking with this session_id already exists
        const { data: existing } = await supabase
          .from("bookings")
          .select("id")
          .eq("stripe_session_id" as any, sessionId)
          .maybeSingle();

        if (existing) {
          // Already created
          setBooking(bookingData);
          sessionStorage.removeItem("pending_booking");
          setLoading(false);
          return;
        }

        const { error: insertError } = await supabase.from("bookings").insert({
          customer_name: bookingData.customer_name,
          phone: bookingData.phone,
          address: bookingData.address,
          postcode: bookingData.postcode,
          service: bookingData.service,
          service_price: bookingData.service_price,
          time_window: bookingData.time_window,
          booking_date: bookingData.booking_date,
          express: false,
          total_price: bookingData.total_price,
          business_id: bookingData.business_id,
          stripe_session_id: sessionId,
        } as any);

        if (insertError) throw insertError;

        setBooking(bookingData);
        sessionStorage.removeItem("pending_booking");
        toast.success("Booking confirmed!");
      } catch (err: any) {
        console.error("Error creating booking:", err);
        setError(err.message || "Failed to create booking");
      } finally {
        setLoading(false);
      }
    };

    createBooking();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6">
        <Loader2 size={40} className="animate-spin text-foreground mb-4" />
        <p className="font-bold text-lg text-foreground">Processing your booking…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-svh bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-destructive font-bold text-lg mb-2">Something went wrong</p>
        <p className="text-muted-foreground text-sm mb-6">{error}</p>
        <button onClick={() => navigate("/")} className="bg-foreground text-background font-bold text-sm h-12 px-6 rounded-xl">
          Back to Home
        </button>
      </div>
    );
  }

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
          Payment successful!
        </motion.h1>
        <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm mt-1.5 max-w-[280px] leading-relaxed">
          Your booking has been confirmed. We'll text you 30 minutes before arrival.
        </motion.p>
      </div>

      {booking && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border overflow-hidden mb-6">
          <div className="bg-foreground text-background px-5 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-background/60 block">Booking total</span>
              <span className="text-2xl font-extrabold tabular-nums">£{booking.total_price}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-background/15 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="p-4 space-y-3 bg-card">
            {[
              { icon: CalendarIcon, label: "Date", value: booking.booking_date },
              { icon: Clock, label: "Time", value: booking.time_window },
              { icon: MapPin, label: "Location", value: `${booking.address}, ${booking.postcode}` },
              { icon: User, label: "Contact", value: `${booking.customer_name} · ${booking.phone}` },
            ].map(({ icon: Ic, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Ic size={15} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground mb-6">
        <Shield size={13} className="text-emerald-500" />
        <span>Fully insured · Secure payment via Stripe</span>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/")}
        className="w-full bg-foreground text-background font-bold text-[15px] h-14 rounded-2xl flex items-center justify-center gap-2">
        Book Another Wash <ChevronRight size={16} />
      </motion.button>
    </div>
  );
};

export default BookingSuccess;
