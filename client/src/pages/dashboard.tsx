import { Sidebar } from "@/components/sidebar";
import { ActivityComparison } from "@/components/activity-comparison";
import { ChartsSection } from "@/components/charts-section";
import { CommandsAndLogs } from "@/components/commands-and-logs";
import { ConfigurationPanel } from "@/components/configuration-panel";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { BotStatus } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: comparison, refetch: refetchComparison, isLoading } = useQuery({
    queryKey: ["/api/comparison"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: botStatuses } = useQuery({
    queryKey: ["/api/bots/status"],
    refetchInterval: 10000, // Check bot status every 10 seconds
  });

  useEffect(() => {
    setLastUpdated(new Date());
  }, [comparison]);

  const handleRefresh = async () => {
    try {
      await refetchComparison();
      setLastUpdated(new Date());
      toast({
        title: "Data refreshed",
        description: "Activity data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh activity data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
  };

  return (
    <div className="flex h-screen bg-discord-background text-discord-text font-inter">
      <Sidebar botStatuses={botStatuses as BotStatus[]} />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-discord-surface border-b border-discord-surfaceLight p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-discord-text">Activity Dashboard</h2>
              <p className="text-discord-textMuted">Real-time server activity comparison</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-discord-textMuted">Last Updated</p>
                <p className="text-sm font-medium">{formatTimeAgo(lastUpdated)}</p>
              </div>
              <Button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-discord-primary hover:bg-discord-secondary"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 overflow-y-auto h-full bg-discord-background">
          <ActivityComparison comparison={comparison as any} isLoading={isLoading} />
          <ChartsSection />
          <CommandsAndLogs />
          <ConfigurationPanel />
        </main>
      </div>
    </div>
  );
}
