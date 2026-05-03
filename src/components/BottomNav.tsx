import { LayoutDashboard, BarChart2, Settings } from 'lucide-react';
import { MobileTab } from '../types';

interface BottomNavProps {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
}

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: 'ideas', label: '企画一覧', icon: LayoutDashboard },
    { id: 'stats', label: 'スタッツ', icon: BarChart2 },
    { id: 'settings', label: '設定', icon: Settings },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-zinc-800 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center justify-center w-full min-h-[64px] min-w-[44px] py-2 transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Icon size={22} className="mb-1" />
            <span className="text-[10px] font-bold tracking-widest">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
