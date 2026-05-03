import { Sparkles, Loader2 } from 'lucide-react';
import { TitleIdea } from '../types';

export default function RightSidebar({ titleIdeas, isGenerating }: { titleIdeas: TitleIdea[], isGenerating: boolean }) {
  const handleScriptClick = () => {
    alert("アイデアカードの「台本を書く」アイコンから台本エディタを開き、コピーして貼り付けてください。");
  };

  return (
    <aside className="w-72 bg-[#0d0d0d] border-l border-zinc-800 p-6 hidden lg:flex flex-col shrink-0">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded flex items-center justify-center">
          <Sparkles size={12} />
        </div>
        <h2 className="text-[10px] font-bold tracking-widest text-zinc-400">AIタイトル案</h2>
      </div>
      
      <div className="flex flex-col gap-3">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="animate-spin text-indigo-400" size={24} />
            <p className="text-xs text-zinc-500 font-medium tracking-widest mt-2">AIと考え中...</p>
          </div>
        ) : (
          titleIdeas.map((idea, idx) => (
            <div key={idx} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer">
              <p className="text-xs font-medium text-zinc-300 leading-snug">{idea.title}</p>
              <p className="text-[10px] text-zinc-500 mt-1.5 font-medium">{idea.reason}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto pt-6">
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
          <h3 className="text-[10px] font-bold text-indigo-400 tracking-widest mb-2 flex items-center gap-2">
            今日のメモ
          </h3>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            今日は連結会計に2時間集中できた。この「辛さ」と「分かった時の快感」を動画で話せば、同じ苦労をしている視聴者の心に刺さるはず。
          </p>
          <button 
            onClick={handleScriptClick}
            className="w-full mt-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-[10px] font-bold rounded-lg uppercase tracking-widest flex items-center justify-center gap-2"
          >
            台本へ引用
          </button>
        </div>
      </div>
    </aside>
  );
}
