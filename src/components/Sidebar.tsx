import { NavLink } from "@/components/NavLink";
import { BarChart3, Sparkles, TrendingUp, TableProperties, Settings, ChevronLeft, ChevronRight, Target, ShoppingBag, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import activeIronLogo from "@/assets/activeiron-logo.png";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onNavigate, collapsed = false, onCollapsedChange }: SidebarProps) {
  const navItems = [
    { to: "/ai-overview", label: "AI Overview", icon: Sparkles },
    { to: "/", label: "Dashboard", icon: BarChart3 },
    { to: "/traffic-analysis", label: "Traffic Analysis", icon: Globe },
    { to: "/consolidated-view", label: "Consolidated", icon: TableProperties },
    { to: "/meta-performance", label: "Meta Ads", icon: TrendingUp },
    { to: "/google-ads", label: "Google Ads", icon: Target },
    { to: "/email", label: "Email", icon: Mail },
    { to: "/shopify", label: "Shopify", icon: ShoppingBag },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className={cn(
      "h-screen sticky top-0 border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center justify-center border-b border-sidebar-border transition-all duration-300",
        collapsed ? "h-16 px-2" : "h-24 px-4"
      )}>
        <img 
          src={activeIronLogo} 
          alt="Active Iron" 
          className={cn(
            "w-auto transition-all duration-300",
            collapsed ? "h-8" : "h-16"
          )}
        />
      </div>
      
      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-1",
        collapsed ? "p-2" : "p-4"
      )}>
        {navItems.map((item) => (
          collapsed ? (
            <Tooltip key={item.to} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className="flex items-center justify-center rounded-lg p-2.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-sidebar-primary text-sidebar-primary-foreground"
                  onClick={onNavigate}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
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
          )
        ))}
      </nav>

      {/* Collapse toggle - only show on larger screens */}
      {onCollapsedChange && (
        <div className={cn(
          "border-t border-sidebar-border",
          collapsed ? "p-2" : "p-4"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center px-2" : "justify-start gap-2"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}
