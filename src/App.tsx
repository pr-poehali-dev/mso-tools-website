
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tools/documents" element={<Documents />} />
          <Route path="/tools/spreadsheet" element={<Spreadsheet />} />
          <Route path="/tools/presentation" element={<Presentation />} />
          <Route path="/tools/forms" element={<Forms />} />
          <Route path="/tools/dashboards" element={<Dashboards />} />
          <Route path="/tools/planner" element={<Planner />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;