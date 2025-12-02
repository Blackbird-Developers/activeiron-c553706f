import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Moon, Sun, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CACHE_KEYS = [
  'consolidated_view_cache',
  'marketing_dashboard_cache',
  'meta_performance_cache',
];

export default function Settings() {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleClearCache = () => {
    CACHE_KEYS.forEach(key => localStorage.removeItem(key));
    toast({
      title: "Cache Cleared",
      description: "All cached data has been cleared. Pages will fetch fresh data on next visit.",
    });
  };

  const handleForceRefresh = () => {
    handleClearCache();
    window.location.href = '/';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage application preferences</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customise how the dashboard looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark theme
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Data Refresh
            </CardTitle>
            <CardDescription>
              Data is automatically cached for 24 hours to optimise API usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Clear Cache</Label>
                <p className="text-sm text-muted-foreground">
                  Remove cached data without refreshing
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearCache}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Force Refresh All Data</Label>
                <p className="text-sm text-muted-foreground">
                  Clear cache and fetch fresh data from all sources
                </p>
              </div>
              <Button variant="default" size="sm" onClick={handleForceRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
