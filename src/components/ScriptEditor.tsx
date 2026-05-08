import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { VideoIdea, ScriptSection } from '../types';
import { ArrowLeft, Plus, MoveUp, MoveDown, Trash2, Check, GripVertical, FileText, BrainCircuit, CircleDashed, Play, X, Pause, Hash, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const RichTextEditor = ({ content, onChange }: { content: string, onChange: (content: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'ここに入力...',
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:text-zinc-600 before:absolute'
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[100px] text-sm text-zinc-300 leading-relaxed'
      }
    }
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="bg-[#18181b] border border-zinc-800 rounded-b-xl overflow-hidden p-4 relative">
      <EditorContent editor={editor} />
    </div>
  );
};

const DEFAULT_SECTIONS: ScriptSection[] = [
  { id: '1', title: 'フック (Hook)', content: '' },
  { id: '2', title: 'イントロダクション (Intro)', content: '' },
  { id: '3', title: 'メインコンテンツ (Body)', content: '' },
  { id: '4', title: 'エンディング/CTA (Conclusion/CTA)', content: '' }
];

interface ScriptEditorProps {
  idea: VideoIdea;
  onClose: () => void;
  onSave: (ideaId: string, updatedSections: ScriptSection[]) => void;
}

export default function ScriptEditor({ idea, onClose, onSave }: ScriptEditorProps) {
  const [sections, setSections] = useState<ScriptSection[]>(
    idea.script?.sections || DEFAULT_SECTIONS
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrompterMode, setIsPrompterMode] = useState(false);
  const [prompterSpeed, setPrompterSpeed] = useState(2);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let animationId: number;
    const scroll = () => {
      if (isScrolling) {
        document.getElementById('prompter-scroll-container')?.scrollBy(0, prompterSpeed);
        animationId = requestAnimationFrame(scroll);
      }
    };
    if (isScrolling) {
      animationId = requestAnimationFrame(scroll);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling, prompterSpeed]);

  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');
  const totalChars = sections.reduce((acc, s) => acc + stripHtml(s.content).length, 0);
  const estimatedTime = Math.ceil(totalChars / 300);

  const [repurposeResult, setRepurposeResult] = useState<{type: string, text: string} | null>(null);
  const [isRepurposing, setIsRepurposing] = useState(false);

  const handleRepurpose = async (type: 'twitter' | 'shorts') => {
    setIsRepurposing(true);
    setRepurposeResult(null);
    try {
      const fullScript = sections.map(s => `[${s.title}]\n${stripHtml(s.content)}`).join('\n\n');
      const response = await fetch('/api/gemini-repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: fullScript, type })
      });
      const json = await response.json();
      if (json.success) {
        setRepurposeResult({ type, text: json.text });
      }
    } catch (e) {
      alert('自動生成に失敗しました');
    } finally {
      setIsRepurposing(false);
    }
  };

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/gemini-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: idea.title, tags: idea.tags })
      });
      if (!response.ok) throw new Error('Failed');
      const json = await response.json();
      if (json.data && json.data.length > 0) {
        setSections(json.data.map((s: any, i: number) => ({ id: Date.now().toString() + i, title: s.title, content: s.content })));
      }
    } catch (e) {
      alert('AI台本の作成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateContent = (id: string, content: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content } : s));
  };

  const handleUpdateTitle = (id: string, title: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  };

  const addSection = () => {
    setSections([...sections, { id: Date.now().toString(), title: '新しいセクション', content: '' }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[newIndex];
    newSections[newIndex] = temp;
    setSections(newSections);
  };

  const handleSave = () => {
    onSave(idea.id, sections);
    onClose();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] flex flex-col h-full absolute inset-0 z-40 pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-zinc-800 p-4 md:p-6 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-sm md:text-base font-bold text-zinc-100 flex items-center gap-2">
              <FileText size={16} className="text-indigo-400" />
              台本エディタ
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-zinc-500 line-clamp-1">{idea.title}</p>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{totalChars}文字 (約{estimatedTime}分)</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPrompterMode(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors px-3 py-2 text-xs font-bold uppercase tracking-widest rounded-lg"
          >
            <Play size={14} />
            <span className="hidden md:inline">プロンプター</span>
          </button>
          <button 
            onClick={handleGenerateScript}
            disabled={isGenerating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-2 text-xs font-bold uppercase tracking-widest rounded-lg"
          >
            {isGenerating ? <CircleDashed size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
            <span className="hidden md:inline">AIに構成案を作ってもらう</span>
            <span className="md:hidden">AI</span>
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
          >
            <Check size={14} />
            保存して戻る
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        <AnimatePresence>
          {sections.map((section, index) => (
            <motion.div 
              key={section.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col group"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between bg-[#131316] border border-zinc-800 border-b-0 rounded-t-xl p-3">
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <div className="text-zinc-600 cursor-grab px-1">
                    <GripVertical size={14} />
                  </div>
                  <input 
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateTitle(section.id, e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-zinc-300 w-full focus:outline-none focus:text-indigo-400 transition-colors uppercase tracking-widest"
                  />
                </div>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors rounded-md">
                    <MoveUp size={14} />
                  </button>
                  <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors rounded-md">
                    <MoveDown size={14} />
                  </button>
                  <div className="w-[1px] h-4 bg-zinc-800 mx-1"></div>
                  <button onClick={() => removeSection(section.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded-md">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              {/* Rich Text Editor inside section */}
              <RichTextEditor 
                content={section.content} 
                onChange={(content) => handleUpdateContent(section.id, content)} 
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button 
          onClick={addSection}
          className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-zinc-800/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-zinc-500 hover:text-indigo-400 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
        >
          <Plus size={16} />
          セクションを追加
        </button>

        {/* Repurpose Section */}
        <div className="mt-8 bg-[#131316] border border-zinc-800 rounded-xl p-6">
           <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-4">
             <BrainCircuit size={16} className="text-indigo-400" />
             ✨ この台本を再利用する (他SNS展開)
           </h3>
           <div className="flex flex-col md:flex-row gap-3">
             <button onClick={() => handleRepurpose('twitter')} disabled={isRepurposing} className="flex-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-colors disabled:opacity-50">
                <Hash size={16} />
                X(Twitter)用の投稿文を作る
             </button>
             <button onClick={() => handleRepurpose('shorts')} disabled={isRepurposing} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-colors disabled:opacity-50">
                <Smartphone size={16} />
                ショート動画用の台本にする
             </button>
           </div>
           
           {isRepurposing && (
              <div className="mt-6 flex flex-col items-center justify-center py-8">
                 <CircleDashed size={24} className="text-indigo-500 animate-spin mb-2" />
                 <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest animate-pulse">AIが台本を要約・最適化しています...</p>
              </div>
           )}
           
           {repurposeResult && !isRepurposing && (
              <div className="mt-6">
                 <div className="flex items-center justify-between mb-2">
                   <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                     {repurposeResult.type === 'twitter' ? 'X(Twitter)用テキスト' : 'ショート動画用台本'}
                   </h4>
                   <button onClick={() => navigator.clipboard.writeText(repurposeResult.text)} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded transition-colors">
                     コピーする
                   </button>
                 </div>
                 <textarea 
                   readOnly 
                   value={repurposeResult.text} 
                   className="w-full h-48 bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 focus:outline-none resize-none leading-relaxed"
                 />
              </div>
           )}
        </div>

        <div className="h-20 shrink-0"></div>
      </div>

      {/* Prompter Mode Modal */}
      <AnimatePresence>
        {isPrompterMode && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[100] bg-black text-white flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black/80 backdrop-blur-md z-10 shrink-0">
               <div className="flex items-center gap-4">
                  <button onClick={() => { setIsPrompterMode(false); setIsScrolling(false); }} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
                     <X size={20} />
                  </button>
                  <span className="font-bold text-sm hidden md:inline">プロンプターモード</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                     <span>速度:</span>
                     <input type="range" min="1" max="5" value={prompterSpeed} onChange={e => setPrompterSpeed(Number(e.target.value))} className="w-20 md:w-32" />
                  </div>
                  <button 
                    onClick={() => setIsScrolling(!isScrolling)} 
                    className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-full font-bold transition-colors text-sm ${isScrolling ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'}`}
                  >
                    {isScrolling ? <Pause size={16} /> : <Play size={16} />}
                    {isScrolling ? '停止' : '再生'}
                  </button>
               </div>
            </div>
            <div id="prompter-scroll-container" className="flex-1 overflow-y-auto p-6 md:p-16 pb-[60vh] scroll-smooth">
               <div className="max-w-4xl mx-auto space-y-16">
                  {sections.map(s => (
                    <div key={s.id}>
                       <h3 className="text-xl md:text-2xl font-bold text-emerald-400 mb-6 md:mb-8 uppercase tracking-widest">{s.title}</h3>
                       <div 
                         className="text-3xl md:text-5xl leading-[1.8] md:leading-[1.8] font-bold text-zinc-100 space-y-8" 
                         dangerouslySetInnerHTML={{ __html: s.content || '<span class="text-zinc-700">内容がありません</span>' }} 
                       />
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
