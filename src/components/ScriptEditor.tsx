import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { VideoIdea, ScriptSection } from '../types';
import { ArrowLeft, Plus, MoveUp, MoveDown, Trash2, Check, GripVertical, FileText, BrainCircuit, CircleDashed } from 'lucide-react';
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
            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{idea.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleGenerateScript}
            disabled={isGenerating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg"
          >
            {isGenerating ? <CircleDashed size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
            AIに構成案を作ってもらう
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
        <div className="h-20 shrink-0"></div>
      </div>
    </div>
  );
}
