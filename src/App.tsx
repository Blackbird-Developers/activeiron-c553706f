import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Index from "./pages/Index";
import AIOverview from "./pages/AIOverview";
import ConsolidatedView from "./pages/ConsolidatedView";
import MetaPerformance from "./pages/MetaPerformance";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Check if we're on a tablet-sized screen initially
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 && window.innerWidth < 1280;
    }
    return false;
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Auto-collapse on tablet screens
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Auto-collapse on tablet (lg) screens, expand on xl+ screens
      if (width >= 1024 && width < 1280) {
        setSidebarCollapsed(true);
      } else if (width >= 1280) {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex min-h-screen w-full">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Mobile Sidebar */}
            <div className={`
              fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:hidden
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block shrink-0">
              <Sidebar 
                collapsed={sidebarCollapsed} 
                onCollapsedChange={setSidebarCollapsed}
              />
            </div>

            <main className="flex-1 overflow-auto w-full">
              <div className="px-4 py-6 pt-16 lg:pt-6 lg:px-6 xl:px-8 max-w-[1600px] mx-auto">
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
