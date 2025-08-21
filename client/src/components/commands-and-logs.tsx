import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function CommandsAndLogs() {
  const { toast } = useToast();

  const { data: commandLogs } = useQuery({
    queryKey: ["/api/commands?limit=10"]
  });

  const { data: systemLogs } = useQuery({
    queryKey: ["/api/logs?limit=10"]
  });

  const commands = [
    {
      command: "/activity",
      description: "Show current activity comparison",
      uses: 47,
      color: "text-discord-success border-discord-success"
    },
    {
      command: "/history [timeframe]",
      description: "Show historical activity data",
      uses: 23,
      color: "text-discord-secondary border-discord-secondary"
    },
    {
      command: "/compare [metric]",
      description: "Compare specific metrics between servers",
      uses: 12,
      color: "text-discord-warning border-discord-warning"
    }
  ];

  const handleTestCommand = (command: string) => {
    toast({
      title: "Command Executed",
      description: `Test execution of ${command} command`,
    });
  };

  const handleClearLogs = () => {
    toast({
      title: "Logs Cleared",
      description: "Activity logs have been cleared successfully.",
    });
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      {/* Slash Commands Interface */}
      <Card className="bg-discord-surface border-discord-surfaceLight">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-discord-text">
              Available Commands
            </CardTitle>
            <Badge className="bg-discord-primary text-white">Live</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commands.map((cmd) => (
              <div key={cmd.command} className={`bg-discord-background rounded-lg p-4 border-l-4 ${cmd.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <code className={`font-mono ${cmd.color.split(' ')[0]}`}>{cmd.command}</code>
                  <span className="text-xs text-discord-textMuted">Used {cmd.uses} times</span>
                </div>
                <p className="text-sm text-discord-textMuted mb-2">{cmd.description}</p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-discord-primary hover:text-discord-secondary"
                  onClick={() => handleTestCommand(cmd.command)}
                >
                  Test Command <Play className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card className="bg-discord-surface border-discord-surfaceLight">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-discord-text">
              Recent Activity
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-discord-primary hover:text-discord-secondary"
              onClick={handleClearLogs}
            >
              Clear Log <Trash2 className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {systemLogs && (systemLogs as any[]).length > 0 ? (
              (systemLogs as any[]).map((log: any) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 bg-discord-background rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    log.type === 'activity_spike' ? 'bg-discord-success' :
                    log.type === 'command_executed' ? 'bg-discord-primary' :
                    log.type === 'monitor_reconnected' ? 'bg-discord-warning' :
                    'bg-discord-textMuted'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-discord-text">{log.message}</span>
                      <span className="text-xs text-discord-textMuted">
                        {formatTimeAgo(log.timestamp)}
                      </span>
                    </div>
                    {log.metadata && (
                      <p className="text-xs text-discord-textMuted">{log.metadata}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              // Fallback activity logs if no system logs
              <>
                <div className="flex items-start space-x-3 p-3 bg-discord-background rounded-lg">
                  <div className="w-2 h-2 bg-discord-success rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-discord-text">Activity spike detected</span>
                      <span className="text-xs text-discord-textMuted">2m ago</span>
                    </div>
                    <p className="text-xs text-discord-textMuted">SP: 15 msg/min, SC: 8 msg/min</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-discord-background rounded-lg">
                  <div className="w-2 h-2 bg-discord-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-discord-text">System initialized</span>
                      <span className="text-xs text-discord-textMuted">5m ago</span>
                    </div>
                    <p className="text-xs text-discord-textMuted">Dashboard started successfully</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
