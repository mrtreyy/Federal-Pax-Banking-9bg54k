import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import APLogin from "./pages/APLogin";
import APDashboard from "./pages/APDashboard";
import CASLogin from "./pages/CASLogin";
import CASDashboard from "./pages/CASDashboard";
import NotFound from "./pages/NotFound";
import ChangePinPage from "./pages/ChangePinPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AboutPage from "./pages/AboutPage";
import ForgotPasswordIDA from "./pages/ForgotPasswordIDA";
import ForgotPasswordCEO from "./pages/ForgotPasswordCEO";
import ForgotPasswordAdmin from "./pages/ForgotPasswordAdmin";
import ForgotPasswordAP from "./pages/ForgotPasswordAP";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/ap/login" element={<APLogin />} />
          <Route path="/ap/dashboard" element={<APDashboard />} />
          <Route path="/cas/login" element={<CASLogin />} />
          <Route path="/cas/dashboard" element={<CASDashboard />} />
          <Route path="/change-pin" element={<ChangePinPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordIDA returnPath="/" />} />
          <Route path="/forgot-password/ceo" element={<ForgotPasswordCEO returnPath="/cas/login" />} />
          <Route path="/forgot-password/admin" element={<ForgotPasswordAdmin returnPath="/admin" />} />
          <Route path="/forgot-password/ap" element={<ForgotPasswordAP returnPath="/ap/login" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
