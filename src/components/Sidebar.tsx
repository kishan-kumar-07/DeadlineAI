import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  Calendar, 
  TrendingUp, 
  Bot, 
  Settings, 
  Clock, 
  Sparkles,
  Zap,
  Activity
} from "lucide-react";
import { UserSettings } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: UserSettings;
  activeAgentName?: string;
  logout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, settings, activeAgentName, logout }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Task Hub", icon: CheckSquare },
    { id: "calendar", label: "IntelliCalendar", icon: Calendar },
    { id: "goals", label: "Impact Goals", icon: Target },
    { id: "coach", label: "AI Coach & Chat", icon: Bot },
    { id: "reports", label: "Analytics & Reports", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside id="sidebar-container" className="w-64 lg:w-72 h-screen bg-[#0F0F12] border-r border-white/10 p-5 flex flex-col justify-between sticky top-0">
      <div>
        {/* Brand logo */}
        <div id="brand-logo" className="flex items-center gap-3 mb-8 px-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Zap className="w-4.5 h-4.5 text-white fill-white/10" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg tracking-tight text-white">
              DeadlineAI
            </h1>
            <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-1 mt-0.5">
              <Activity className="w-2.5 h-2.5 animate-pulse" /> AI Core v2.5
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav id="sidebar-nav" className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium text-left group ${
                  isActive
                    ? "bg-white/5 text-white border-l-2 border-indigo-500 shadow-md"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${
                    isActive ? "text-white scale-110" : "text-white/40 group-hover:scale-110 group-hover:text-white"
                  }`} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_8px_#818cf8]"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Active Agent and Profile details */}
      <div id="sidebar-footer" className="space-y-4">
        {/* Active AI Agent Status Bubble */}
        <div id="active-agent-status" className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-indigo-400`}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
              System Health
            </span>
          </div>
          <p className="text-xs text-white/80 mt-2 font-medium">
            {activeAgentName ? (
              <span className="text-indigo-400 animate-pulse">{activeAgentName} Operational</span>
            ) : (
              <span className="text-white/80">9 Agents Operational</span>
            )}
          </p>
          <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[94%]"></div>
          </div>
        </div>

        {/* User Login Section */}
        <div id="user-profile-section" className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              id="user-avatar"
              src={settings.avatar}
              alt={settings.name}
              className="w-8.5 h-8.5 rounded-full border border-white/10 object-cover"
            />
            <div className="flex flex-col min-w-0">
              <span id="user-display-name" className="text-xs font-semibold text-white truncate leading-none">
                {settings.name}
              </span>
              <span id="user-display-email" className="text-[9px] text-white/40 truncate mt-1">
                {settings.email}
              </span>
            </div>
          </div>
          <button
            id="btn-logout"
            onClick={logout}
            className="p-1.5 hover:bg-red-500/10 text-white/40 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
            title="Log Out"
          >
            <Clock className="w-4 h-4 rotate-45" />
          </button>
        </div>
      </div>
    </aside>
  );
}
