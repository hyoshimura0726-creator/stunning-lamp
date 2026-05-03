import { useState } from 'react';
import { LayoutDashboard, PenTool, BrainCircuit, Target, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

const navItems = [
  { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { id: 'editor', label: '台本エディタ', icon: PenTool },
  { id: 'habits', label: '学習・習慣ログ', icon: Target },
  { id: 'ideas', label: 'AIブレスト', icon: BrainCircuit },
];

export default function Sidebar() {
  const [active, setActive] = useState('dashboard');

  return (
    <>
      {/* Sidebar Content */}
      <motion.aside
        className={`static inset-y-0 left-0 z-50 w-64 bg-[#0d0d0d] border-r border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
              R
            </div>

            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">RevEngine</h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">人生逆転クリエイター</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = active === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-indigo-500/10 text-indigo-400' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-zinc-500'} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}

          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-zinc-900/50 rounded-lg p-4 mb-4 border border-zinc-800">

            <p className="text-[10px] tracking-widest text-zinc-500 mb-1 font-bold">現在のチャンネル登録者</p>
            <p className="text-xl font-bold tracking-tight text-zinc-100 mb-2">1,600 <span className="text-[10px] text-zinc-500 font-normal tracking-widest">/ 目標 2000人</span></p>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-1 overflow-hidden">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
            <LogOut size={16} />
            <span className="font-medium text-sm">ログアウト</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
