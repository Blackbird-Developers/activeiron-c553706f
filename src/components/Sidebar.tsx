import { NavLink } from "@/components/NavLink";
import { BarChart3, Sparkles, TrendingUp, TableProperties, Settings } from "lucide-react";
import activeIronLogo from "@/assets/activeiron-logo.jpg";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const navItems = [
    { to: "/ai-overview", label: "AI Overview", icon: Sparkles },
    { to: "/", label: "Marketing Dashboard", icon: BarChart3 },
    { to: "/consolidated-view", label: "Consolidated View", icon: TableProperties },
    { to: "/meta-performance", label: "Meta Performance", icon: TrendingUp },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 min-h-screen border-r border-sidebar-border bg-sidebar">
      <div className="flex h-20 items-center border-b border-sidebar-border px-6">
        <img 
          src={activeIronLogo} 
          alt="Active Iron" 
          className="h-10 w-auto"
        />
      </div>
      
      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium"
            onClick={onNavigate}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
