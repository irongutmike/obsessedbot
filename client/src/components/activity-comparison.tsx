import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ComparisonData {
  snootPalace: {
    messagesPerMinute: number;
    activeUsers: number;
    server: {
      totalMembers: number;
    };
  };
  snootClub: {
    messagesPerMinute: number;
    activeUsers: number;
    server: {
      totalMembers: number;
    };
  };
  activityRatio: number;
  isWinning: boolean;
  advantage: number;
}

interface ActivityComparisonProps {
  comparison?: ComparisonData;
  isLoading: boolean;
}

export function ActivityComparison({ comparison, isLoading }: ActivityComparisonProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-discord-surface border-discord-surfaceLight">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-discord-surface border-discord-surfaceLight">
          <CardContent className="p-6">
            <div className="text-center text-discord-textMuted">
              No activity data available
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { snootPalace, snootClub, activityRatio, isWinning, advantage } = comparison;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Snoot Palace Stats */}
      <Card className="bg-discord-surface border-discord-surfaceLight">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-discord-text">Snoot Palace</h3>
            <div className="w-3 h-3 bg-discord-success rounded-full"></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-discord-textMuted">Messages/Min</span>
              <span className="font-bold text-discord-success">
                {snootPalace.messagesPerMinute?.toFixed(1) || "0.0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-discord-textMuted">Active Users</span>
              <span className="font-bold">{snootPalace.activeUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-discord-textMuted">Total Members</span>
              <span className="font-bold">{snootPalace.server?.totalMembers || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Snoot Club Stats */}
      <Card className="bg-discord-surface border-discord-surfaceLight">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-discord-text">Snoot Club</h3>
            <div className="w-3 h-3 bg-discord-warning rounded-full"></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-discord-textMuted">Messages/Min</span>
              <span className="font-bold text-discord-error">
                {snootClub.messagesPerMinute?.toFixed(1) || "0.0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-discord-textMuted">Active Users</span>
              <span className="font-bold">{snootClub.activeUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-discord-textMuted">Total Members</span>
              <span className="font-bold">{snootClub.server?.totalMembers?.toLocaleString() || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Victory Indicator */}
      <Card className={`${isWinning ? 'bg-gradient-to-br from-discord-success to-discord-primary' : 'bg-gradient-to-br from-discord-error to-discord-warning'} text-white`}>
        <CardContent className="p-6">
          <div className="text-center">
            <Trophy className="h-10 w-10 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">
              {isWinning ? "We're Winning!" : "We're Behind"}
            </h3>
            <p className="text-sm opacity-90">
              {advantage}% {isWinning ? 'more' : 'less'} active per capita
            </p>
            <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-2xl font-bold">{activityRatio.toFixed(2)}x</div>
              <div className="text-xs">Activity Multiplier</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
