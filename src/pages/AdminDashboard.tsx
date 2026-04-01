import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, MapPin, Car, Phone, User, Calendar,
  Zap, Inbox, Loader2, RefreshCw, CheckCircle2, CircleDot, Truck,
  TrendingUp, PoundSterling, Users, BarChart3, XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import type { Database } from "@/integrations/supabase/types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type BookingStatus = Database["public"]["Enums"]["booking_status"];

const STATUS_CONFIG: Record<BookingStatus, { color: string; icon: typeof CircleDot; label: string }> = {
  pending: { color: "bg-warning-muted text-foreground ring-warning/30", icon: CircleDot, label: "Pending" },
  assigned: { color: "bg-accent text-accent-foreground ring-primary/30", icon: Truck, label: "Assigned" },
  completed: { color: "bg-success-muted text-foreground ring-success/30", icon: CheckCircle2, label: "Done" },
  cancelled: { color: "bg-destructive/10 text-destructive ring-destructive/30", icon: XCircle, label: "Cancelled" },
};

const CHART_COLORS = [
  "hsl(222, 47%, 11%)",
  "hsl(262, 83%, 58%)",
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(43, 96%, 56%)",
];

type Tab = "analytics" | "bookings";

type Worker = { id: string; full_name: string | null; email: string | null };

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("analytics");

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

  const fetchWorkers = async () => {
    const { data } = await supabase.rpc("get_workers");
    setWorkers((data as Worker[]) || []);
  };

  useEffect(() => {
    fetchBookings();
    fetchWorkers();

    const channel = supabase
      .channel("admin-bookings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          setBookings((prev) => [payload.new as Booking, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        (payload) => {
          setBookings((prev) =>
            prev.map((b) => (b.id === (payload.new as Booking).id ? (payload.new as Booking) : b))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, status: BookingStatus) => {
    // If cancelling a paid booking, also set refund_requested
    if (status === "cancelled") {
      const booking = bookings.find((b) => b.id === id);
      const hasStripePayment = !!(booking as any)?.stripe_session_id;
      await supabase.from("bookings").update({
        status,
        ...(hasStripePayment ? { refund_requested: true } : {}),
      } as any).eq("id", id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status, ...(hasStripePayment ? { refund_requested: true } : {}) } as any : b))
      );
    } else {
      await supabase.from("bookings").update({ status }).eq("id", id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    }
  };

  const assignWorker = async (bookingId: string, workerId: string | null) => {
    await supabase.from("bookings").update({ assigned_worker_id: workerId } as any).eq("id", bookingId);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, assigned_worker_id: workerId } as any : b))
    );
  };

  // ── Analytics computations ──
  const analytics = useMemo(() => {
    if (bookings.length === 0) return null;

    const today = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter((b) => b.booking_date === today);
    const todayRevenue = todayBookings.reduce((s, b) => s + b.total_price, 0);
    const totalRevenue = bookings.reduce((s, b) => s + b.total_price, 0);
    const completedCount = bookings.filter((b) => b.status === "completed").length;

    // Daily bookings (last 7 days)
    const dailyMap = new Map<string, { bookings: number; revenue: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, { bookings: 0, revenue: 0 });
    }
    bookings.forEach((b) => {
      const entry = dailyMap.get(b.booking_date);
      if (entry) {
        entry.bookings++;
        entry.revenue += b.total_price;
      }
    });
    const dailyData = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date: new Date(date).toLocaleDateString("en-GB", { weekday: "short" }),
      bookings: v.bookings,
      revenue: v.revenue,
    }));

    // Popular services
    const serviceMap = new Map<string, number>();
    bookings.forEach((b) => {
      serviceMap.set(b.service, (serviceMap.get(b.service) || 0) + 1);
    });
    const serviceData = Array.from(serviceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Repeat customers (by phone)
    const customerMap = new Map<string, number>();
    bookings.forEach((b) => {
      customerMap.set(b.phone, (customerMap.get(b.phone) || 0) + 1);
    });
    const repeatCustomers = Array.from(customerMap.values()).filter((c) => c > 1).length;
    const totalCustomers = customerMap.size;

    // Average order value
    const avgOrder = bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0;

    return {
      todayBookings: todayBookings.length,
      todayRevenue,
      totalRevenue,
      completedCount,
      dailyData,
      serviceData,
      repeatCustomers,
      totalCustomers,
      avgOrder,
    };
  }, [bookings]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-muted-foreground">
            {p.name}: <span className="font-bold text-foreground">{p.name === "revenue" ? `£${p.value}` : p.value}</span>
          </p>
        ))}
      </div>
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
        <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-5">
          <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] leading-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
          {([
            { id: "analytics" as Tab, label: "Analytics", icon: BarChart3 },
            { id: "bookings" as Tab, label: "Bookings", icon: Inbox },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all
                ${tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm font-medium">Loading data…</span>
          </div>
        ) : tab === "analytics" ? (
          <AnalyticsView analytics={analytics} bookings={bookings} CustomTooltip={CustomTooltip} />
        ) : (
          <BookingsView bookings={bookings} updateStatus={updateStatus} workers={workers} assignWorker={assignWorker} />
        )}
      </main>
    </div>
  );
};

// ── Analytics Tab ──
const AnalyticsView = ({ analytics, bookings, CustomTooltip }: {
  analytics: any;
  bookings: Booking[];
  CustomTooltip: any;
}) => {
  if (!analytics || bookings.length === 0) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <BarChart3 size={28} className="text-muted-foreground" />
        </div>
        <p className="font-bold text-foreground mb-1">No data yet</p>
        <p className="text-sm text-muted-foreground">Analytics will appear once bookings come in.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="grid grid-cols-2 gap-3">
        {[
          { label: "Today's Revenue", value: `£${analytics.todayRevenue}`, icon: PoundSterling, sub: `${analytics.todayBookings} bookings` },
          { label: "Total Revenue", value: `£${analytics.totalRevenue}`, icon: TrendingUp, sub: `${analytics.completedCount} completed` },
          { label: "Avg Order", value: `£${analytics.avgOrder}`, icon: BarChart3, sub: `${bookings.length} orders` },
          { label: "Repeat Rate", value: analytics.totalCustomers > 0 ? `${Math.round((analytics.repeatCustomers / analytics.totalCustomers) * 100)}%` : "0%", icon: Users, sub: `${analytics.repeatCustomers} of ${analytics.totalCustomers}` },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="card-surface p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <kpi.icon size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
            </div>
            <span className="text-2xl font-extrabold tabular-nums tracking-tight">{kpi.value}</span>
            <span className="text-xs text-muted-foreground">{kpi.sub}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Revenue Trend */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="card-surface p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-muted-foreground" />
          Revenue (Last 7 Days)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 92%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(222, 47%, 11%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(222, 47%, 11%)" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Daily Bookings Bar */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
        className="card-surface p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          Daily Bookings
        </h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.dailyData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bookings" fill="hsl(262, 83%, 58%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Popular Services Pie */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="card-surface p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Car size={14} className="text-muted-foreground" />
          Popular Services
        </h3>
        <div className="flex items-center gap-4">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={35} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                  {analytics.serviceData.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            {analytics.serviceData.map((s: any, i: number) => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="font-medium capitalize truncate">{s.name}</span>
                <span className="ml-auto font-bold tabular-nums text-muted-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Repeat Customers */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
        className="card-surface p-5">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Users size={14} className="text-muted-foreground" />
          Customer Loyalty
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: analytics.totalCustomers > 0 ? `${(analytics.repeatCustomers / analytics.totalCustomers) * 100}%` : "0%" }}
                transition={{ duration: 1, delay: 0.8 }}
                className="h-full rounded-full"
                style={{ backgroundColor: "hsl(160, 84%, 39%)" }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-extrabold tabular-nums">{analytics.repeatCustomers}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Repeat</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-extrabold tabular-nums">{analytics.totalCustomers - analytics.repeatCustomers}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">New</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── Bookings Tab ──
const BookingsView = ({ bookings, updateStatus, workers, assignWorker }: { bookings: Booking[]; updateStatus: (id: string, s: BookingStatus) => void; workers: Worker[]; assignWorker: (bookingId: string, workerId: string | null) => void }) => {
  if (bookings.length === 0) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <Inbox size={28} className="text-muted-foreground" />
        </div>
        <p className="font-bold text-foreground mb-1">No bookings yet</p>
        <p className="text-sm text-muted-foreground">Bookings will appear here once customers start booking.</p>
      </motion.div>
    );
  }

  // Status summary
  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    assigned: bookings.filter((b) => b.status === "assigned").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <div className="space-y-4">
      {/* Status counters */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-2">
        {(["pending", "assigned", "completed"] as BookingStatus[]).map((s) => {
          const config = STATUS_CONFIG[s];
          const Icon = config.icon;
          return (
            <div key={s} className="card-surface p-4 flex flex-col items-center text-center gap-1.5">
              <Icon size={18} className="text-muted-foreground" />
              <span className="text-2xl font-extrabold tabular-nums">{counts[s]}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{config.label}</span>
            </div>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {bookings.map((b, i) => (
          <motion.div key={b.id} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.05 }} className="card-elevated p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <User size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="font-bold text-foreground leading-tight">{b.customer_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone size={12} />{b.phone}</p>
                </div>
              </div>
              <span className="text-xl font-extrabold tabular-nums tracking-tight">£{b.total_price}</span>
            </div>
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
            <div className="flex items-center gap-2 pt-1 border-t border-muted flex-wrap">
              {(["pending", "assigned", "completed", "cancelled"] as BookingStatus[]).map((s) => {
                const config = STATUS_CONFIG[s];
                const Icon = config.icon;
                const isActive = b.status === s;
                return (
                  <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => updateStatus(b.id, s)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200
                      ${isActive ? `${config.color} ring-2` : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
                    <Icon size={13} />{config.label}
                  </motion.button>
                );
              })}
            </div>
            {/* Refund badge for cancelled bookings */}
            {b.status === "cancelled" && (b as any).refund_requested && (
              <div className="flex items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warning-muted text-foreground text-xs font-bold ring-1 ring-warning/30">
                  <PoundSterling size={12} /> Refund Pending
                </span>
                <span className="text-[10px] text-muted-foreground">Processed within 5–10 business days</span>
              </div>
            )}
            {/* Worker assignment */}
            <div className="flex items-center gap-3 pt-2 border-t border-muted">
              <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                <User size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Assign worker</span>
              </div>
              <select
                value={(b as any).assigned_worker_id || ""}
                onChange={(e) => assignWorker(b.id, e.target.value || null)}
                className="flex-1 h-9 px-3 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Unassigned</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name || w.email || "Unknown"}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
