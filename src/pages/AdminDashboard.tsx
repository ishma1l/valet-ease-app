import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type BookingStatus = Database["public"]["Enums"]["booking_status"];

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-warning-muted text-foreground",
  assigned: "bg-accent text-accent-foreground",
  completed: "bg-success-muted text-foreground",
};

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
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
      <nav className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <span className="font-extrabold tracking-tight text-primary text-lg">GLOSS.</span>
        <div className="w-9" />
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </p>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No bookings yet.</div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-card rounded-2xl ring-1 ring-border p-5 space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-foreground">{b.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{b.phone}</p>
                  </div>
                  <span className="text-lg font-extrabold tabular-nums">£{b.total_price}</span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Address</span>
                    <p className="font-medium">{b.address}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Postcode</span>
                    <p className="font-medium uppercase">{b.postcode}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Service</span>
                    <p className="font-medium capitalize">{b.service}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Window</span>
                    <p className="font-medium capitalize">{b.time_window}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date</span>
                    <p className="font-medium">{b.booking_date}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Express</span>
                    <p className="font-medium">{b.express ? "Yes (+£7)" : "No"}</p>
                  </div>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                  <div className="flex gap-2">
                    {(["pending", "assigned", "completed"] as BookingStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(b.id, s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                          b.status === s
                            ? `${STATUS_COLORS[s]} ring-2 ring-primary`
                            : "bg-muted text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
