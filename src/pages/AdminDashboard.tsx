import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, MapPin, Car, Phone, User, Calendar,
  Zap, Inbox, Loader2, RefreshCw, CheckCircle2, CircleDot, Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type BookingStatus = Database["public"]["Enums"]["booking_status"];

const STATUS_CONFIG: Record<BookingStatus, { color: string; icon: typeof CircleDot; label: string }> = {
  pending: { color: "bg-warning-muted text-foreground ring-warning/30", icon: CircleDot, label: "Pending" },
  assigned: { color: "bg-accent text-accent-foreground ring-primary/30", icon: Truck, label: "Assigned" },
  completed: { color: "bg-success-muted text-foreground ring-success/30", icon: CheckCircle2, label: "Done" },
};

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id: string, status: BookingStatus) => {
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
  };

  return (
    <div className="min-h-svh bg-background text-foreground font-sans antialiased">
      <nav className="sticky top-0 z-30 glass-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <span className="font-black tracking-[-0.04em] text-primary text-xl">GLOSS.</span>
        <button
          onClick={() => fetchBookings(true)}
          disabled={refreshing}
          className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] leading-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
          </p>
        </motion.div>

        {/* Stats */}
        {!loading && bookings.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {(["pending", "assigned", "completed"] as BookingStatus[]).map((s) => {
              const count = bookings.filter((b) => b.status === s).length;
              const config = STATUS_CONFIG[s];
              const Icon = config.icon;
              return (
                <div key={s} className="card-surface p-4 flex flex-col items-center text-center gap-1.5">
                  <Icon size={18} className="text-muted-foreground" />
                  <span className="text-2xl font-extrabold tabular-nums">{count}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {config.label}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm font-medium">Loading bookings…</span>
          </div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Inbox size={28} className="text-muted-foreground" />
            </div>
            <p className="font-bold text-foreground mb-1">No bookings yet</p>
            <p className="text-sm text-muted-foreground">Bookings will appear here once customers start booking.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {bookings.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="card-elevated p-5 space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <User size={18} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-tight">{b.customer_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone size={12} />
                          {b.phone}
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-extrabold tabular-nums tracking-tight">£{b.total_price}</span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Address</p>
                        <p className="font-medium leading-snug">{b.address}</p>
                        <p className="font-medium uppercase text-muted-foreground">{b.postcode}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Car size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Service</p>
                        <p className="font-medium capitalize">{b.service}</p>
                        {b.express && (
                          <p className="text-xs text-warning font-semibold flex items-center gap-1 mt-0.5">
                            <Zap size={10} fill="currentColor" /> Express
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Date</p>
                        <p className="font-medium">{b.booking_date}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Window</p>
                        <p className="font-medium capitalize">{b.time_window}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 pt-1 border-t border-muted">
                    {(["pending", "assigned", "completed"] as BookingStatus[]).map((s) => {
                      const config = STATUS_CONFIG[s];
                      const Icon = config.icon;
                      const isActive = b.status === s;
                      return (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateStatus(b.id, s)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200
                            ${isActive
                              ? `${config.color} ring-2`
                              : "bg-muted text-muted-foreground hover:bg-secondary"}`}
                        >
                          <Icon size={13} />
                          {config.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
