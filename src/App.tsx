import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import Index from "./pages/Index";
import AIOverview from "./pages/AIOverview";
import ConsolidatedView from "./pages/ConsolidatedView";
import MetaPerformance from "./pages/MetaPerformance";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex min-h-screen w-full">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <div className="container px-4 py-8 md:px-6">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/ai-overview" element={<AIOverview />} />
                  <Route path="/consolidated-view" element={<ConsolidatedView />} />
                  <Route path="/meta-performance" element={<MetaPerformance />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
