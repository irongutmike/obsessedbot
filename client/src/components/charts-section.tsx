import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export function ChartsSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: spActivity } = useQuery({
    queryKey: ["/api/servers/snoot_palace/activity?limit=24"]
  });

  const { data: scActivity } = useQuery({
    queryKey: ["/api/servers/snoot_club/activity?limit=24"]
  });

  useEffect(() => {
    if (canvasRef.current && spActivity && scActivity) {
      // Import Chart.js dynamically to avoid SSR issues
      import('chart.js/auto').then(({ default: Chart }) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        Chart.getChart(ctx)?.destroy();

        const hours = Array.from({ length: 24 }, (_, i) => {
          const hour = i;
          return hour === 0 ? '12AM' : hour === 12 ? '12PM' : hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
        });

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: hours,
            datasets: [{
              label: 'Snoot Palace',
              data: (spActivity as any[])?.slice(-24).map((d: any) => d.messagesPerMinute || 0) || [],
              borderColor: 'hsl(139, 45%, 75%)',
              backgroundColor: 'hsla(139, 45%, 75%, 0.1)',
              tension: 0.4
            }, {
              label: 'Snoot Club',
              data: (scActivity as any[])?.slice(-24).map((d: any) => d.messagesPerMinute || 0) || [],
              borderColor: 'hsl(359, 83%, 57%)',
              backgroundColor: 'hsla(359, 83%, 57%, 0.1)',
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: 'hsl(215, 8%, 73%)'
                }
              }
            },
            scales: {
              y: {
                grid: {
                  color: 'hsl(225, 6%, 26%)'
                },
                ticks: {
                  color: 'hsl(215, 8%, 73%)'
                }
              },
              x: {
                grid: {
                  color: 'hsl(225, 6%, 26%)'
                },
                ticks: {
                  color: 'hsl(215, 8%, 73%)'
                }
              }
            }
          }
        });
      });
    }
  }, [spActivity, scActivity]);

  // Mock hourly activity data for the heatmap
  const hourlyData = [
    { hour: '12AM', activity: 65 },
    { hour: '1AM', activity: 45 },
    { hour: '2AM', activity: 30 },
    { hour: '3AM', activity: 25 },
    { hour: '4AM', activity: 20 },
    { hour: '5AM', activity: 25 },
    { hour: '6AM', activity: 35 },
    { hour: '7AM', activity: 55 },
    { hour: '8AM', activity: 75 },
    { hour: '9AM', activity: 85 },
    { hour: '10AM', activity: 90 },
    { hour: '11AM', activity: 95 },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      {/* Activity Timeline Chart */}
      <Card className="bg-discord-surface border-discord-surfaceLight">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-discord-text">
            Activity Timeline (Last 24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <canvas ref={canvasRef} className="w-full h-full"></canvas>
          </div>
        </CardContent>
      </Card>

      {/* User Activity Heatmap */}
      <Card className="bg-discord-surface border-discord-surfaceLight">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-discord-text">
            Hourly Activity Pattern
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hourlyData.map((hour) => (
              <div key={hour.hour} className="flex items-center space-x-3">
                <span className="text-xs text-discord-textMuted w-8">{hour.hour}</span>
                <div className="flex-1 bg-discord-background rounded-full h-3 relative overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-discord-primary to-discord-success h-full rounded-full transition-all duration-300" 
                    style={{ width: `${hour.activity}%` }}
                  ></div>
                </div>
                <span className="text-xs text-discord-textMuted w-8">{hour.activity}%</span>
              </div>
            ))}
            <div className="text-center mt-4">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-discord-primary hover:text-discord-secondary hover:bg-discord-surfaceLight"
              >
                View Full 24h Pattern <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
