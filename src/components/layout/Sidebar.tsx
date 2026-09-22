import type { FC } from 'react';
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  Clock,
  Settings,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'overview' | 'stations' | 'alerts' | 'history' | 'settings';
  setActiveTab: (tab: 'overview' | 'stations' | 'alerts' | 'history' | 'settings') => void;
  unreviewedAlertsCount: number;
  onOpenHardware: () => void;
  isConnected: boolean;
}

export const Sidebar: FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unreviewedAlertsCount,
  onOpenHardware,
  isConnected,
}) => {
  const navItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'stations' as const,
      label: 'Stations',
      icon: Radio,
    },
    {
      id: 'alerts' as const,
      label: 'Alerts',
      icon: AlertTriangle,
      badge: unreviewedAlertsCount > 0 ? unreviewedAlertsCount : null,
    },
    {
      id: 'history' as const,
      label: 'History',
      icon: Clock,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Logo Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-[#123c28] flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-lg text-slate-900 tracking-tight">
              Galamsey<span className="text-[#123c28]">Guard</span>
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#123c28] text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-rose-400' : 'bg-rose-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Box */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onOpenHardware}
          className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer group"
          title="Click to view physical hardware pinouts and diagnostic console"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-semibold text-slate-800">
                Edge Gateway
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              Online
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>RPi Stack • Supabase Sync</span>
            <Cpu className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </p>
        </button>
      </div>
    </aside>
  );
};
