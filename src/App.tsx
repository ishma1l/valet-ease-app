import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationToast } from "@/components/notifications/NotificationCenter";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import { AdminGuard } from "@/components/AdminGuard";
import WorkerDashboard from "./pages/WorkerDashboard.tsx";
import Auth from "./pages/Auth.tsx";
import BusinessDashboard from "./pages/BusinessDashboard.tsx";
import WhiteLabelBooking from "./pages/WhiteLabelBooking.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NotificationToast />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<BusinessDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/b/:slug" element={<WhiteLabelBooking />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
