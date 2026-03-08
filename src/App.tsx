import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectNew from "./pages/ProjectNew";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Files from "./pages/Files";
import Knowledge from "./pages/Knowledge";
import Settings from "./pages/Settings";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";
import Assistant from "./pages/Assistant";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import ProductsCatalog from "./pages/ProductsCatalog";
import ProductDetailPage from "./pages/ProductDetail";
import Researches from "./pages/Researches";
import ResearchDetail from "./pages/ResearchDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/invites/:token" element={<AcceptInvite />} />
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            <Route
              path="/assistant"
              element={
                <AppLayout>
                  <Assistant />
                </AppLayout>
              }
            />
            <Route
              path="/projects"
              element={
                <AppLayout>
                  <Projects />
                </AppLayout>
              }
            />
            <Route
              path="/projects/new"
              element={
                <AppLayout>
                  <ProjectNew />
                </AppLayout>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <AppLayout>
                  <ProjectDetail />
                </AppLayout>
              }
            />
            <Route
              path="/tasks"
              element={
                <AppLayout>
                  <Tasks />
                </AppLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <AppLayout>
                  <Reports />
                </AppLayout>
              }
            />
            <Route
              path="/files"
              element={
                <AppLayout>
                  <Files />
                </AppLayout>
              }
            />
            <Route
              path="/knowledge"
              element={
                <AppLayout>
                  <Knowledge />
                </AppLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <Settings />
                </AppLayout>
              }
            />
            <Route
              path="/admin"
              element={
                <AppLayout>
                  <Admin />
                </AppLayout>
              }
            />
            <Route
              path="/products"
              element={
                <AppLayout>
                  <ProductsCatalog />
                </AppLayout>
              }
            />
            <Route
              path="/products/:id"
              element={
                <AppLayout>
                  <ProductDetailPage />
                </AppLayout>
              }
            />
            <Route
              path="/researches"
              element={
                <AppLayout>
                  <Researches />
                </AppLayout>
              }
            />
            <Route
              path="/researches/:id"
              element={
                <AppLayout>
                  <ResearchDetail />
                </AppLayout>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
