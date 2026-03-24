import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, Car, Phone, User, Calendar, Zap,
  Inbox, Loader2, RefreshCw, CheckCircle2, Navigation,
  Play, X, Check, ChevronRight, Camera, ImageIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import BeforeAfterComparison, { PhotoUploadButton } from "@/components/photos/BeforeAfterComparison";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type BookingStatus = Database["public"]["Enums"]["booking_status"];

type WorkerJobStatus = "new" | "accepted" | "on_the_way" | "in_progress" | "completed" | "rejected";

interface JobPhoto {
  id: string;
  photo_type: "before" | "after";
  storage_path: string;
  url: string;
}

interface WorkerJob extends Booking {
  workerStatus: WorkerJobStatus;
  photos: JobPhoto[];
}

const STATUS_FLOW: { key: WorkerJobStatus; label: string; icon: typeof Play; color: string }[] = [
  { key: "on_the_way", label: "On my way", icon: Navigation, color: "bg-blue-500 text-white" },
  { key: "in_progress", label: "Start wash", icon: Play, color: "bg-warning text-warning-foreground" },
  { key: "completed", label: "Complete", icon: CheckCircle2, color: "bg-success text-success-foreground" },
];

const WORKER_STATUS_BADGE: Record<WorkerJobStatus, { label: string; classes: string }> = {
  new: { label: "New Job", classes: "bg-blue-100 text-blue-700 ring-blue-300" },
  accepted: { label: "Accepted", classes: "bg-accent text-accent-foreground ring-primary/20" },
  on_the_way: { label: "On the way", classes: "bg-blue-100 text-blue-700 ring-blue-300" },
  in_progress: { label: "In progress", classes: "bg-warning-muted text-foreground ring-warning/30" },
  completed: { label: "Completed", classes: "bg-success-muted text-foreground ring-success/30" },
  rejected: { label: "Rejected", classes: "bg-destructive/10 text-destructive ring-destructive/20" },
};

const getPhotoUrl = (path: string) => {
  const { data } = supabase.storage.from("job-photos").getPublicUrl(path);
  return data.publicUrl;
};

const WorkerDashboard = () => {
  const [jobs, setJobs] = useState<WorkerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [uploading, setUploading] = useState<Record<string, "before" | "after" | null>>({});
  const [expandedPhotos, setExpandedPhotos] = useState<string | null>(null);

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    const [{ data: bookings }, { data: photos }] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("job_photos").select("*"),
    ]);

    const photosByBooking: Record<string, JobPhoto[]> = {};
    (photos || []).forEach((p: any) => {
      if (!photosByBooking[p.booking_id]) photosByBooking[p.booking_id] = [];
      photosByBooking[p.booking_id].push({
        id: p.id,
        photo_type: p.photo_type,
        storage_path: p.storage_path,
        url: getPhotoUrl(p.storage_path),
      });
    });

    const mapped: WorkerJob[] = (bookings || []).map((b) => ({
      ...b,
      workerStatus: b.status === "completed" ? "completed" as WorkerJobStatus
        : b.status === "assigned" ? "accepted" as WorkerJobStatus
        : "new" as WorkerJobStatus,
      photos: photosByBooking[b.id] || [],
    }));
    setJobs(mapped);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const updateJobStatus = async (id: string, newStatus: WorkerJobStatus) => {
    let dbStatus: BookingStatus = "pending";
    if (newStatus === "accepted" || newStatus === "on_the_way" || newStatus === "in_progress") {
      dbStatus = "assigned";
    } else if (newStatus === "completed") {
      dbStatus = "completed";
    }
    await supabase.from("bookings").update({ status: dbStatus }).eq("id", id);
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, workerStatus: newStatus, status: dbStatus } : j))
    );
  };

  const acceptJob = (id: string) => updateJobStatus(id, "accepted");
  const rejectJob = (id: string) => updateJobStatus(id, "rejected");

  const uploadPhoto = async (jobId: string, type: "before" | "after", file: File) => {
    setUploading((u) => ({ ...u, [jobId]: type }));
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${jobId}/${type}-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("job-photos").upload(path, file, { upsert: true });
    if (uploadErr) {
      toast.error("Upload failed");
      setUploading((u) => ({ ...u, [jobId]: null }));
      return;
    }

    // Remove existing photo of same type for this job
    const existing = jobs.find((j) => j.id === jobId)?.photos.find((p) => p.photo_type === type);
    if (existing) {
      await supabase.from("job_photos").delete().eq("id", existing.id);
      await supabase.storage.from("job-photos").remove([existing.storage_path]);
    }

    const { error: dbErr } = await supabase.from("job_photos").insert({
      booking_id: jobId,
      photo_type: type,
      storage_path: path,
    });

    if (dbErr) {
      toast.error("Failed to save photo");
    } else {
      toast.success(`${type === "before" ? "Before" : "After"} photo saved`);
      const newPhoto: JobPhoto = { id: crypto.randomUUID(), photo_type: type, storage_path: path, url: getPhotoUrl(path) };
      setJobs((prev) =>
        prev.map((j) => j.id === jobId ? {
          ...j,
          photos: [...j.photos.filter((p) => p.photo_type !== type), newPhoto],
        } : j)
      );
    }
    setUploading((u) => ({ ...u, [jobId]: null }));
  };

  const getNextAction = (status: WorkerJobStatus) => {
    if (status === "accepted") return STATUS_FLOW[0];
    if (status === "on_the_way") return STATUS_FLOW[1];
    if (status === "in_progress") return STATUS_FLOW[2];
    return null;
  };

  const activeJobs = jobs.filter((j) => !["completed", "rejected"].includes(j.workerStatus));
  const completedJobs = jobs.filter((j) => j.workerStatus === "completed");
  const displayJobs = activeTab === "active" ? activeJobs : completedJobs;
  const todayEarnings = completedJobs.reduce((sum, j) => sum + j.total_price, 0);

  return (
    <div className="min-h-svh bg-background text-foreground font-sans antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between pt-safe">
        <Link to="/" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
          <Car size={20} />
        </Link>
        <span className="font-black tracking-[-0.04em] text-primary text-lg">Worker</span>
        <button
          onClick={() => fetchJobs(true)}
          disabled={refreshing}
          className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-5 pb-safe">
        {/* Earnings card */}
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-2xl bg-primary text-primary-foreground p-5 mb-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Today's earnings</p>
          <p className="text-3xl font-extrabold tabular-nums mt-1">£{todayEarnings}</p>
          <p className="text-xs opacity-60 mt-1">{completedJobs.length} job{completedJobs.length !== 1 ? "s" : ""} completed</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-5">
          {(["active", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {tab === "active" ? `Active (${activeJobs.length})` : `Done (${completedJobs.length})`}
            </button>
          ))}
        </div>

        {/* Job list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm font-medium">Loading jobs…</span>
          </div>
        ) : displayJobs.length === 0 ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Inbox size={28} className="text-muted-foreground" />
            </div>
            <p className="font-bold text-foreground mb-1">
              {activeTab === "active" ? "No active jobs" : "No completed jobs"}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeTab === "active" ? "New jobs will appear here." : "Completed jobs will show here."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {displayJobs.map((job, i) => {
                const badge = WORKER_STATUS_BADGE[job.workerStatus];
                const nextAction = getNextAction(job.workerStatus);
                const isNew = job.workerStatus === "new";
                const beforePhoto = job.photos.find((p) => p.photo_type === "before");
                const afterPhoto = job.photos.find((p) => p.photo_type === "after");
                const showPhotoSection = ["in_progress", "completed"].includes(job.workerStatus) || job.photos.length > 0;
                const isPhotosExpanded = expandedPhotos === job.id;
                const jobUploading = uploading[job.id];

                return (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-2xl border p-4 space-y-3 transition-shadow ${
                      isNew
                        ? "border-blue-200 bg-blue-50/50 shadow-[var(--shadow-elevated)]"
                        : "border-border bg-card shadow-[var(--shadow-card)]"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <User size={16} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-tight">{job.customer_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone size={10} /> {job.phone}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ring-1 ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="flex items-start gap-1.5">
                        <Car size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider">Service</p>
                          <p className="font-semibold capitalize">{job.service}</p>
                          {job.express && (
                            <p className="text-[10px] text-warning font-semibold flex items-center gap-0.5">
                              <Zap size={9} fill="currentColor" /> Express
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider">Location</p>
                          <p className="font-semibold leading-snug">{job.address}</p>
                          <p className="font-medium uppercase text-muted-foreground text-[10px]">{job.postcode}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Calendar size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider">Date</p>
                          <p className="font-semibold">{job.booking_date}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Clock size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider">Time</p>
                          <p className="font-semibold capitalize">{job.time_window}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground font-medium">Payout</span>
                      <span className="text-lg font-extrabold tabular-nums">£{job.total_price}</span>
                    </div>

                    {/* Photo Section */}
                    {showPhotoSection && (
                      <div className="pt-2 border-t border-border space-y-3">
                        <button
                          onClick={() => setExpandedPhotos(isPhotosExpanded ? null : job.id)}
                          className="flex items-center gap-2 w-full text-left"
                        >
                          <Camera size={14} className="text-muted-foreground" />
                          <span className="text-xs font-bold text-foreground flex-1">
                            Before & After Photos
                            {job.photos.length > 0 && (
                              <span className="ml-1.5 text-[10px] font-semibold text-muted-foreground">
                                ({job.photos.length}/2)
                              </span>
                            )}
                          </span>
                          <ChevronRight size={14} className={`text-muted-foreground transition-transform ${isPhotosExpanded ? "rotate-90" : ""}`} />
                        </button>

                        <AnimatePresence>
                          {isPhotosExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              {/* Comparison view when both photos exist */}
                              {beforePhoto && afterPhoto ? (
                                <div className="space-y-3">
                                  <BeforeAfterComparison
                                    beforeUrl={beforePhoto.url}
                                    afterUrl={afterPhoto.url}
                                  />
                                  <p className="text-[10px] text-center text-muted-foreground font-medium">
                                    Drag slider to compare
                                  </p>
                                </div>
                              ) : (
                                <div className="flex gap-3">
                                  <PhotoUploadButton
                                    label="📷 Before"
                                    photoUrl={beforePhoto?.url}
                                    uploading={jobUploading === "before"}
                                    onUpload={(file) => uploadPhoto(job.id, "before", file)}
                                  />
                                  <PhotoUploadButton
                                    label="✨ After"
                                    photoUrl={afterPhoto?.url}
                                    uploading={jobUploading === "after"}
                                    onUpload={(file) => uploadPhoto(job.id, "after", file)}
                                  />
                                </div>
                              )}

                              {/* Retake buttons when both exist */}
                              {beforePhoto && afterPhoto && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.capture = "environment"; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadPhoto(job.id, "before", f); }; input.click(); }}
                                    className="flex-1 text-[11px] font-semibold text-muted-foreground py-2 rounded-lg bg-muted hover:bg-secondary transition-colors"
                                  >
                                    Retake Before
                                  </button>
                                  <button
                                    onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.capture = "environment"; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadPhoto(job.id, "after", f); }; input.click(); }}
                                    className="flex-1 text-[11px] font-semibold text-muted-foreground py-2 rounded-lg bg-muted hover:bg-secondary transition-colors"
                                  >
                                    Retake After
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Actions */}
                    {isNew && (
                      <div className="flex gap-2 pt-1">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => rejectJob(job.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <X size={16} /> Decline
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => acceptJob(job.id)}
                          className="flex-[2] flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
                        >
                          <Check size={16} /> Accept Job
                        </motion.button>
                      </div>
                    )}

                    {nextAction && !isNew && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => updateJobStatus(job.id, nextAction.key)}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-colors ${nextAction.color}`}
                      >
                        <nextAction.icon size={16} />
                        {nextAction.label}
                        <ChevronRight size={14} className="opacity-60" />
                      </motion.button>
                    )}

                    {job.workerStatus === "completed" && (
                      <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-success">
                        <CheckCircle2 size={16} /> Job completed
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkerDashboard;
