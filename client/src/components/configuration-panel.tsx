import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function ConfigurationPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    updateInterval: "5",
    dataRetention: "30",
    activityAlerts: true,
    errorNotifications: true
  });

  const handleExportData = () => {
    toast({
      title: "Data Export Started",
      description: "Your activity data is being prepared for download...",
    });
    
    // Simulate export process
    setTimeout(() => {
      const data = {
        exportDate: new Date().toISOString(),
        servers: ["snoot_palace", "snoot_club"],
        activityData: "Activity data would be here...",
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snoot-activity-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Activity data has been downloaded successfully.",
      });
    }, 2000);
  };

  const handleClearData = () => {
    toast({
      title: "Clear Data",
      description: "Are you sure you want to clear old data? This action cannot be undone.",
      variant: "destructive",
    });
  };

  return (
    <Card className="bg-discord-surface border-discord-surfaceLight">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-discord-text">
          System Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monitoring Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-discord-text">Monitoring Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-discord-textMuted">Update Interval</label>
                <Select 
                  value={settings.updateInterval} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, updateInterval: value }))}
                >
                  <SelectTrigger className="w-32 bg-discord-background border-discord-surfaceLight">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-discord-background border-discord-surfaceLight">
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-discord-textMuted">Data Retention</label>
                <Select 
                  value={settings.dataRetention} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, dataRetention: value }))}
                >
                  <SelectTrigger className="w-32 bg-discord-background border-discord-surfaceLight">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-discord-background border-discord-surfaceLight">
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-discord-text">Alert Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-discord-textMuted">Activity Alerts</span>
                <Switch 
                  checked={settings.activityAlerts}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, activityAlerts: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-discord-textMuted">Error Notifications</span>
                <Switch 
                  checked={settings.errorNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, errorNotifications: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="space-y-4">
            <h4 className="font-medium text-discord-text">Data Management</h4>
            <div className="space-y-3">
              <Button 
                onClick={handleExportData}
                className="w-full bg-discord-primary hover:bg-discord-secondary"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button 
                onClick={handleClearData}
                variant="outline"
                className="w-full bg-discord-warning hover:bg-yellow-500 text-black border-discord-warning"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Old Data
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
