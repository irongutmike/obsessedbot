import { Crown, BarChart3, MessageSquare, Terminal, Settings, Database } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { BotStatus } from "@shared/schema";

interface SidebarProps {
  botStatuses?: BotStatus[];
}

export function Sidebar({ botStatuses = [] }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    { path: "/", icon: BarChart3, label: "Dashboard", active: location === "/" },
    { path: "/activity", icon: MessageSquare, label: "Activity Monitor" },
    { path: "/commands", icon: Terminal, label: "Commands" },
    { path: "/settings", icon: Settings, label: "Settings" },
    { path: "/export", icon: Database, label: "Data Export" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-discord-success";
      case "monitoring":
        return "bg-discord-success";
      case "offline":
        return "bg-discord-error";
      default:
        return "bg-discord-warning";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "monitoring":
        return "Monitoring";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="w-64 bg-discord-surface border-r border-discord-surfaceLight flex flex-col">
      {/* Logo/Title */}
      <div className="p-6 border-b border-discord-surfaceLight">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-discord-primary rounded-lg flex items-center justify-center">
            <Crown className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-discord-text">Snoot Palace</h1>
            <p className="text-sm text-discord-textMuted">Bot Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                item.active
                  ? "bg-discord-primary text-white"
                  : "text-discord-textMuted hover:bg-discord-surfaceLight hover:text-discord-text"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Bot Status */}
      <div className="p-4 border-t border-discord-surfaceLight">
        <div className="space-y-3">
          {botStatuses.map((bot) => (
            <div key={bot.id} className="flex items-center justify-between">
              <span className="text-sm text-discord-textMuted">{bot.name}</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(bot.status)}`}></div>
                <span className={`text-xs ${getStatusColor(bot.status).replace('bg-', 'text-')}`}>
                  {getStatusText(bot.status)}
                </span>
              </div>
            </div>
          ))}
          
          {/* Default statuses if no data */}
          {botStatuses.length === 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-discord-textMuted">Official Bot</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-discord-success rounded-full"></div>
                  <span className="text-xs text-discord-success">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-discord-textMuted">Monitor Bot</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-discord-success rounded-full"></div>
                  <span className="text-xs text-discord-success">Monitoring</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
