import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Settings, BarChart3, Inbox, Plus, Trash2, Save,
  Loader2, ArrowRight, Copy, ExternalLink, Palette, Type,
  TrendingUp, PoundSterling, Users, Calendar, CheckCircle2,
  User, Phone, MapPin, Clock, Car, Zap, CircleDot, Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

type Tab = "analytics" | "bookings" | "services" | "branding";

const CHART_COLORS = [
  "hsl(222, 47%, 11%)",
  "hsl(262, 83%, 58%)",
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning-muted text-foreground" },
  assigned: { label: "Assigned", color: "bg-accent text-accent-foreground" },
  completed: { label: "Done", color: "bg-success-muted text-foreground" },
};

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("analytics");
  const [showSetup, setShowSetup] = useState(false);

  // Setup form
  const [setupName, setSetupName] = useState("");
  const [setupSlug, setSetupSlug] = useState("");
  const [setupSaving, setSetupSaving] = useState(false);

  // Branding form
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#1a1b2e");
  const [brandTagline, setBrandTagline] = useState("");
  const [brandPhone, setBrandPhone] = useState("");
  const [brandSaving, setBrandSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    loadBusiness();
  }, [user]);

  const loadBusiness = async () => {
    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!biz) {
      setShowSetup(true);
      setLoading(false);
      return;
    }

    setBusiness(biz);
    setBrandName(biz.name);
    setBrandColor(biz.primary_color);
    setBrandTagline(biz.tagline || "");
    setBrandPhone(biz.phone || "");

    const [{ data: bookingsData }, { data: servicesData }] = await Promise.all([
      supabase.from("bookings").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }),
      supabase.from("business_services").select("*").eq("business_id", biz.id).order("sort_order"),
    ]);

    setBookings(bookingsData || []);
    setServices(servicesData || []);
    setLoading(false);
  };

  const createBusiness = async () => {
    if (!setupName.trim() || !setupSlug.trim()) return;
    const slug = setupSlug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSetupSaving(true);
    const { data, error } = await supabase.from("businesses").insert({
      owner_id: user.id,
      name: setupName.trim(),
      slug,
    }).select().single();
    setSetupSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "That URL slug is taken" : error.message);
      return;
    }
    // Create default services
    await supabase.from("business_services").insert([
      { business_id: data.id, title: "Basic Wash", description: "Exterior hand wash", price: 15, duration: "30 min", sort_order: 0 },
      { business_id: data.id, title: "Full Valet", description: "Interior & exterior", price: 25, duration: "60 min", sort_order: 1 },
      { business_id: data.id, title: "Premium Detail", description: "Deep clean, polish & wax", price: 45, duration: "90 min", sort_order: 2 },
    ]);
    setShowSetup(false);
    await loadBusiness();
    toast.success("Business created!");
  };

  const saveBranding = async () => {
    setBrandSaving(true);
    const { error } = await supabase.from("businesses").update({
      name: brandName,
      primary_color: brandColor,
      tagline: brandTagline,
      phone: brandPhone,
    }).eq("id", business.id);
    setBrandSaving(false);
    if (error) { toast.error(error.message); return; }
    setBusiness((b: any) => ({ ...b, name: brandName, primary_color: brandColor, tagline: brandTagline, phone: brandPhone }));
    toast.success("Branding saved!");
  };

  const addService = async () => {
    if (!business) return;
    const { data, error } = await supabase.from("business_services").insert({
      business_id: business.id,
      title: "New Service",
      description: "",
      price: 20,
      duration: "30 min",
      sort_order: services.length,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setServices((s) => [...s, data]);
  };

  const updateService = async (id: string, field: string, value: any) => {
    setServices((s) => s.map((svc) => svc.id === id ? { ...svc, [field]: value } : svc));
  };

  const saveService = async (svc: any) => {
    const { error } = await supabase.from("business_services").update({
      title: svc.title,
      description: svc.description,
      price: svc.price,
      duration: svc.duration,
      active: svc.active,
    }).eq("id", svc.id);
    if (error) toast.error(error.message);
    else toast.success("Service saved");
  };

  const deleteService = async (id: string) => {
    await supabase.from("business_services").delete().eq("id", id);
    setServices((s) => s.filter((svc) => svc.id !== id));
    toast.success("Service removed");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Analytics
  const analytics = useMemo(() => {
    if (bookings.length === 0) return null;
    const today = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter((b) => b.booking_date === today);
    const totalRevenue = bookings.reduce((s: number, b: any) => s + (b.total_price || 0), 0);
    const completedCount = bookings.filter((b: any) => b.status === "completed").length;

    const dailyMap = new Map<string, { bookings: number; revenue: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dailyMap.set(d.toISOString().split("T")[0], { bookings: 0, revenue: 0 });
    }
    bookings.forEach((b: any) => {
      const entry = dailyMap.get(b.booking_date);
      if (entry) { entry.bookings++; entry.revenue += b.total_price || 0; }
    });
    const dailyData = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date: new Date(date).toLocaleDateString("en-GB", { weekday: "short" }), ...v,
    }));

    const serviceMap = new Map<string, number>();
    bookings.forEach((b: any) => serviceMap.set(b.service, (serviceMap.get(b.service) || 0) + 1));
    const serviceData = Array.from(serviceMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const customerMap = new Map<string, number>();
    bookings.forEach((b: any) => customerMap.set(b.phone, (customerMap.get(b.phone) || 0) + 1));
    const repeatCustomers = Array.from(customerMap.values()).filter((c) => c > 1).length;

    return {
      todayBookings: todayBookings.length,
      todayRevenue: todayBookings.reduce((s: number, b: any) => s + (b.total_price || 0), 0),
      totalRevenue,
      completedCount,
      totalCustomers: customerMap.size,
      repeatCustomers,
      avgOrder: Math.round(totalRevenue / bookings.length),
      dailyData,
      serviceData,
    };
  }, [bookings]);

  const ChartTooltip = ({ active, payload, label }: any) => {
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

  // ── Setup screen ──
  if (showSetup) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center px-5">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">Set up your business</h1>
          <p className="text-muted-foreground text-sm mb-6">Create your booking page in seconds.</p>
          <div className="space-y-3">
            <input placeholder="Business name" value={setupName}
              onChange={(e) => { setSetupName(e.target.value); setSetupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")); }}
              className="w-full h-12 px-4 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring outline-none" />
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Booking URL</label>
              <div className="flex items-center h-12 rounded-xl border border-border bg-muted overflow-hidden mt-1">
                <span className="px-3 text-sm text-muted-foreground shrink-0">/b/</span>
                <input value={setupSlug} onChange={(e) => setSetupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="flex-1 h-full bg-card px-3 text-sm font-medium outline-none" />
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={createBusiness} disabled={setupSaving || !setupName.trim() || !setupSlug.trim()}
              className="w-full h-12 bg-foreground text-background rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {setupSaving ? <Loader2 size={18} className="animate-spin" /> : <>Create Business <ArrowRight size={16} /></>}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const bookingUrl = `/b/${business?.slug}`;

  return (
    <div className="min-h-svh bg-background text-foreground font-sans antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="font-black tracking-[-0.04em] text-primary text-xl">{business?.name || "GLOSS."}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => { navigator.clipboard.writeText(window.location.origin + bookingUrl); toast.success("Link copied!"); }}
            className="p-2 hover:bg-muted rounded-full transition-colors" title="Copy booking link">
            <Copy size={16} />
          </button>
          <button onClick={signOut} className="p-2 hover:bg-muted rounded-full transition-colors" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Booking link banner */}
        <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="card-surface p-4 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <ExternalLink size={16} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your Booking Page</p>
            <p className="text-sm font-bold text-foreground truncate">{window.location.origin}{bookingUrl}</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 overflow-x-auto scrollbar-hide">
          {([
            { id: "analytics" as Tab, label: "Analytics", icon: BarChart3 },
            { id: "bookings" as Tab, label: "Bookings", icon: Inbox },
            { id: "services" as Tab, label: "Services", icon: Car },
            { id: "branding" as Tab, label: "Branding", icon: Palette },
          ]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-1
                ${tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!analytics ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                    <BarChart3 size={28} className="text-muted-foreground" />
                  </div>
                  <p className="font-bold">No data yet</p>
                  <p className="text-sm text-muted-foreground">Share your booking link to get started.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Today's Revenue", value: `£${analytics.todayRevenue}`, icon: PoundSterling, sub: `${analytics.todayBookings} bookings` },
                      { label: "Total Revenue", value: `£${analytics.totalRevenue}`, icon: TrendingUp, sub: `${analytics.completedCount} completed` },
                      { label: "Avg Order", value: `£${analytics.avgOrder}`, icon: BarChart3, sub: `${bookings.length} orders` },
                      { label: "Repeat Rate", value: analytics.totalCustomers > 0 ? `${Math.round((analytics.repeatCustomers / analytics.totalCustomers) * 100)}%` : "0%", icon: Users, sub: `${analytics.repeatCustomers} of ${analytics.totalCustomers}` },
                    ].map((kpi) => (
                      <div key={kpi.label} className="card-surface p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <kpi.icon size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
                        </div>
                        <span className="text-2xl font-extrabold tabular-nums">{kpi.value}</span>
                        <span className="text-xs text-muted-foreground">{kpi.sub}</span>
                      </div>
                    ))}
                  </div>

                  <div className="card-surface p-5">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <TrendingUp size={14} className="text-muted-foreground" /> Revenue (7 Days)
                    </h3>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.dailyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 92%)" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
                          <Tooltip content={<ChartTooltip />} />
                          <Line type="monotone" dataKey="revenue" stroke="hsl(222, 47%, 11%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(222, 47%, 11%)" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {analytics.serviceData.length > 0 && (
                    <div className="card-surface p-5">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Car size={14} className="text-muted-foreground" /> Popular Services
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="h-36 w-36 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={analytics.serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                innerRadius={30} outerRadius={55} paddingAngle={3} strokeWidth={0}>
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
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {tab === "bookings" && (
            <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                    <Inbox size={28} className="text-muted-foreground" />
                  </div>
                  <p className="font-bold">No bookings yet</p>
                  <p className="text-sm text-muted-foreground">Bookings from your customers will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b: any) => (
                    <div key={b.id} className="card-elevated p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-foreground">{b.customer_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={11} /> {b.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-extrabold tabular-nums">£{b.total_price}</span>
                          <div className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ml-2 ${STATUS_LABELS[b.status]?.color || "bg-muted"}`}>
                            {STATUS_LABELS[b.status]?.label || b.status}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Car size={12} /> {b.service}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {b.booking_date}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {b.time_window}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {b.postcode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "services" && (
            <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {services.map((svc) => (
                <div key={svc.id} className="card-surface p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <input value={svc.title} onChange={(e) => updateService(svc.id, "title", e.target.value)}
                        className="w-full font-bold text-sm bg-transparent outline-none border-b border-transparent focus:border-border transition-colors pb-1" />
                      <input value={svc.description} onChange={(e) => updateService(svc.id, "description", e.target.value)}
                        placeholder="Description" className="w-full text-xs text-muted-foreground bg-transparent outline-none border-b border-transparent focus:border-border transition-colors pb-1" />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-bold text-muted-foreground">£</span>
                      <input type="number" value={svc.price} onChange={(e) => updateService(svc.id, "price", parseInt(e.target.value) || 0)}
                        className="w-16 text-right font-extrabold text-lg bg-transparent outline-none tabular-nums" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input value={svc.duration} onChange={(e) => updateService(svc.id, "duration", e.target.value)}
                      className="text-xs text-muted-foreground bg-muted rounded-lg px-2.5 py-1.5 w-20 outline-none" />
                    <div className="flex-1" />
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => saveService(svc)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground" title="Save">
                      <Save size={14} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteService(svc.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive" title="Delete">
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              ))}
              <motion.button whileTap={{ scale: 0.97 }} onClick={addService}
                className="w-full h-12 border-2 border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground flex items-center justify-center gap-2 hover:border-foreground hover:text-foreground transition-colors">
                <Plus size={16} /> Add Service
              </motion.button>
            </motion.div>
          )}

          {tab === "branding" && (
            <motion.div key="branding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="card-surface p-5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><Type size={14} className="text-muted-foreground" /> Business Info</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Business Name</label>
                    <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
                      className="w-full h-11 px-3 mt-1 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tagline</label>
                    <input value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} placeholder="e.g. Mobile car wash"
                      className="w-full h-11 px-3 mt-1 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone</label>
                    <input value={brandPhone} onChange={(e) => setBrandPhone(e.target.value)} placeholder="07xxx"
                      className="w-full h-11 px-3 mt-1 rounded-xl border border-border bg-card text-sm font-medium focus:ring-2 focus:ring-ring outline-none" />
                  </div>
                </div>
              </div>

              <div className="card-surface p-5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><Palette size={14} className="text-muted-foreground" /> Brand Color</h3>
                <div className="flex items-center gap-4">
                  <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                    className="w-14 h-14 rounded-xl border-2 border-border cursor-pointer" />
                  <div className="flex-1">
                    <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-card text-sm font-mono font-medium focus:ring-2 focus:ring-ring outline-none" />
                    <p className="text-[10px] text-muted-foreground mt-1">Used as the primary color on your booking page</p>
                  </div>
                </div>
                {/* Preview */}
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preview</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: brandColor }}>
                      {brandName.charAt(0)}
                    </div>
                    <span className="font-extrabold">{brandName || "Your Business"}</span>
                  </div>
                  <button className="w-full h-11 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: brandColor }}>
                    Book Now
                  </button>
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={saveBranding} disabled={brandSaving}
                className="w-full h-12 bg-foreground text-background rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {brandSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /> Save Branding</>}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default BusinessDashboard;
