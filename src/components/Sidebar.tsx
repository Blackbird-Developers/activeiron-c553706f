import { NavLink } from "@/components/NavLink";
import { BarChart3, Sparkles, TrendingUp } from "lucide-react";

export function Sidebar() {
  const navItems = [
    { to: "/ai-overview", label: "AI Overview", icon: Sparkles },
    { to: "/", label: "Marketing Dashboard", icon: BarChart3 },
    { to: "/meta-performance", label: "Meta Performance", icon: TrendingUp },
  ];

  return (
    <aside className="w-64 border-r bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-accent p-2">
            <BarChart3 className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Marketing Hub</h2>
          </div>
        </div>
      </div>
      
      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            activeClassName="bg-accent text-accent-foreground font-medium"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
