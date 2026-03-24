import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, CheckCircle2, User, Navigation, MapPin, Camera, Info,
  Trash2,
} from "lucide-react";
import {
  useNotifications, markAllRead, markRead, clearNotifications,
  type AppNotification,
} from "@/hooks/use-notifications";

const ICON_MAP: Record<AppNotification["icon"], { icon: typeof Bell; color: string }> = {
  confirmed: { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600" },
  assigned: { icon: User, color: "bg-blue-100 text-blue-600" },
  onway: { icon: Navigation, color: "bg-amber-100 text-amber-600" },
  arrived: { icon: MapPin, color: "bg-violet-100 text-violet-600" },
  photo: { icon: Camera, color: "bg-pink-100 text-pink-600" },
  info: { icon: Info, color: "bg-muted text-muted-foreground" },
};

const timeAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount } = useNotifications();

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) markAllRead();
  };

  return (
    <>
      {/* Bell button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Bell size={20} className="text-foreground" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 tabular-nums"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
              onClick={toggle}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-[var(--shadow-float)] max-h-[75vh] flex flex-col pb-safe"
            >
              {/* Handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-border">
                <h2 className="font-extrabold text-lg tracking-tight">Notifications</h2>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={clearNotifications}
                      className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggle}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <X size={18} />
                  </motion.button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-5 py-3">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-3">
                      <Bell size={24} className="text-muted-foreground" />
                    </div>
                    <p className="font-bold text-foreground text-sm">No notifications yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Updates will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <AnimatePresence>
                      {notifications.map((n, i) => {
                        const cfg = ICON_MAP[n.icon];
                        const Icon = cfg.icon;
                        return (
                          <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => markRead(n.id)}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                              !n.read ? "bg-accent" : "hover:bg-muted"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-foreground truncate">{n.title}</p>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                              <p className="text-[10px] text-muted-foreground/60 font-medium mt-1">{timeAgo(n.timestamp)}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Toast-style notification popup ─── */
export const NotificationToast = () => {
  const { notifications } = useNotifications();
  const latest = notifications[0];
  const [dismissed, setDismissed] = useState<string | null>(null);

  if (!latest || latest.read || latest.id === dismissed) return null;

  const cfg = ICON_MAP[latest.icon];
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={latest.id}
        initial={{ y: -80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -80, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="fixed top-3 left-3 right-3 z-[60] max-w-lg mx-auto"
      >
        <motion.div
          onClick={() => setDismissed(latest.id)}
          className="bg-card rounded-2xl shadow-[var(--shadow-float)] ring-1 ring-border p-4 flex items-start gap-3 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">{latest.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{latest.body}</p>
          </div>
          <X size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationBell;
