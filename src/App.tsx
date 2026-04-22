
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Documents from "./pages/Documents";
import Spreadsheet from "./pages/Spreadsheet";
import Presentation from "./pages/Presentation";
import Forms from "./pages/Forms";
import Dashboards from "./pages/Dashboards";
import Planner from "./pages/Planner";
import Docs from "./pages/Docs";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tools/documents" element={<Documents />} />
          <Route path="/tools/spreadsheet" element={<Spreadsheet />} />
          <Route path="/tools/presentation" element={<Presentation />} />
          <Route path="/tools/forms" element={<Forms />} />
          <Route path="/tools/dashboards" element={<Dashboards />} />
          <Route path="/tools/planner" element={<Planner />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/docs/:section" element={<Docs />} />
          <Route path="/pricing" element={<Pricing />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;