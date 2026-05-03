import { useState, useEffect } from 'react';
import { IdeaStatus, VideoIdea, YoutubeDataResponse, MobileTab, ScriptSection } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Video, PenTool, CheckCircle2, CircleDashed, Flame, Target, MessageSquareOff, BrainCircuit, Trash2, X, AlertCircle, Youtube, TrendingUp, RefreshCw, BarChart, Edit2, FileText, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import VideoTrendChart from './VideoTrendChart';
import ChannelStatsChart from './ChannelStatsChart';
import ScriptEditor from './ScriptEditor';

const mockIdeas: VideoIdea[] = [
  { id: '1', title: '【32歳フリーター】簿記1級を目指す理由と学習戦略', status: 'published', tags: ['#決意表明', '#簿記1級'], createdAt: '2023-10-01' },
  { id: '2', title: '税理士試験（簿記論）のための直前期8時間勉強ルーティン', status: 'filmed', tags: ['#勉強ルーティン', '#Vlog'], createdAt: '2023-10-05' },
  { id: '3', title: 'アンチコメントに疲れた時、私がピアノを弾く理由', status: 'scripting', tags: ['#メンタルケア', '#ピアノ'], createdAt: '2023-10-10' },
  { id: '4', title: '無能と言われたフリーターが人生逆転のために捨てた3つのこと', status: 'idea', tags: ['#マインドセット', '#自己啓発'], createdAt: '2023-10-12' },
  { id: '5', title: '筋トレと勉強の両立は本当に可能なのか？1ヶ月検証', status: 'idea', tags: ['#筋トレ', '#検証'], createdAt: '2023-10-14' },
];

const COLUMNS: { id: IdeaStatus; label: string; icon: any; color: string }[] = [
  { id: 'idea', label: '未着手 / アイデア', icon: CircleDashed, color: 'text-zinc-400' },
  { id: 'scripting', label: '台本作成中', icon: PenTool, color: 'text-blue-400' },
  { id: 'filmed', label: '撮影・編集済', icon: Video, color: 'text-purple-400' },
  { id: 'published', label: '投稿済', icon: CheckCircle2, color: 'text-emerald-400' },
];

const BASE_SUBSCRIBERS = 1619;
const BASE_VIEWS = 136080;

interface DashboardProps {
  onGenerateIdeas: (ideas: VideoIdea[]) => void;
  isGenerating: boolean;
  mobileTab: MobileTab;
}

export default function Dashboard({ onGenerateIdeas, isGenerating, mobileTab }: DashboardProps) {
  const [ideas, setIdeas] = useState<VideoIdea[]>(() => {
    const saved = localStorage.getItem('dashboard_ideas');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return mockIdeas;
      }
    }
    return mockIdeas;
  });

  useEffect(() => {
    localStorage.setItem('dashboard_ideas', JSON.stringify(ideas));
  }, [ideas]);
  const [activeDragColumn, setActiveDragColumn] = useState<IdeaStatus | null>(null);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

  const [ideaToEdit, setIdeaToEdit] = useState<VideoIdea | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');

  const [editingScriptIdea, setEditingScriptIdea] = useState<VideoIdea | null>(null);

  const [youtubeData, setYoutubeData] = useState<YoutubeDataResponse | null>(null);
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');
  const [youtubeToken, setYoutubeToken] = useState<string | null>(() => localStorage.getItem('youtube_token'));
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    fetchYoutubeData();
  }, [youtubeToken]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const token = event.data.tokens.access_token;
        localStorage.setItem('youtube_token', token);
        setYoutubeToken(token);
        setAuthError(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    // ポップアップブロッカー対策：クリック直後に同期的にウィンドウを開く
    const authWindow = window.open('', 'oauth_popup', 'width=600,height=700');
    
    if (!authWindow) {
       alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可するか、Safari/Chromeなどの標準ブラウザで開いてください。');
       return;
    }

    try {
      const redirectUri = `${window.location.origin}/api/auth/callback`;
      const response = await fetch(`/api/auth/url?redirectUri=${encodeURIComponent(redirectUri)}`);
      if (!response.ok) {
         throw new Error('Failed to get auth URL. Check API keys.');
      }
      const { url } = await response.json();
      
      // 取得したURLにリダイレクト
      authWindow.location.href = url;
    } catch (error) {
      console.error('OAuth error:', error);
      authWindow.close();
      alert('OAuthの初期化に失敗しました。GOOGLE_CLIENT_IDとSECRETが設定されているか確認してください。');
    }
  };

  const fetchYoutubeData = async () => {
    if (!youtubeToken) {
      setAuthError('OAuth Required');
      return;
    }

    setIsLoadingYoutube(true);
    setYoutubeError('');
    try {
      const res = await fetch('/api/youtube', {
        headers: {
          'Authorization': `Bearer ${youtubeToken}`
        }
      });
      const data = await res.json();
      
      if (res.status === 401) {
        localStorage.removeItem('youtube_token');
        setYoutubeToken(null);
        setAuthError('Unauthorized');
        setYoutubeError('認証の有効期限が切れました。再度接続してください。');
        return;
      }

      if (data.success && data.data) {
        setYoutubeData(data.data);
      } else {
        setYoutubeError(data.error || 'YouTubeAPIのエラーが発生しました');
      }
    } catch (e: any) {
      console.error(e);
      setYoutubeError('ネットワークエラーが発生しました');
    } finally {
      setIsLoadingYoutube(false);
    }
  };

  const getIdeasByStatus = (status: IdeaStatus) => ideas.filter(idea => idea.status === status);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, status: IdeaStatus) => {
    e.preventDefault();
    setActiveDragColumn(status);
  };

  const handleDragLeave = () => {
    setActiveDragColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: IdeaStatus) => {
    e.preventDefault();
    setActiveDragColumn(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      setIdeas(prev => prev.map(idea => idea.id === id ? { ...idea, status } : idea));
    }
  };

  const handleMoveIdea = (id: string, direction: 'left' | 'right') => {
    setIdeas(prev => {
      return prev.map(idea => {
        if (idea.id === id) {
          const currentIndex = COLUMNS.findIndex(c => c.id === idea.status);
          const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
          if (newIndex >= 0 && newIndex < COLUMNS.length) {
            return { ...idea, status: COLUMNS[newIndex].id };
          }
        }
        return idea;
      });
    });
  };

  const handleDeleteIdea = () => {
    if (ideaToDelete) {
      setIdeas(prev => prev.filter(idea => idea.id !== ideaToDelete));
      setIdeaToDelete(null);
    }
  };

  const handleSaveIdeaEdit = () => {
    if (ideaToEdit) {
      const tagsArray = editTags.split(',').map(t => t.trim()).filter(t => t);
      const tagsWithHashes = tagsArray.map(t => t.startsWith('#') ? t : `#${t}`);
      
      setIdeas(prev => prev.map(idea => 
        idea.id === ideaToEdit.id 
          ? { ...idea, title: editTitle, tags: tagsWithHashes } 
          : idea
      ));
      setIdeaToEdit(null);
    }
  };

  const handleCreateNewIdea = () => {
    const newIdea: VideoIdea = {
      id: Date.now().toString(),
      title: '新しいアイデア',
      status: 'idea',
      tags: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    setIdeas(prev => [newIdea, ...prev]);
    setIdeaToEdit(newIdea);
    setEditTitle(newIdea.title);
    setEditTags('');
  };

  const handleSaveScript = (ideaId: string, sections: ScriptSection[]) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === ideaId ? { ...idea, script: { id: ideaId, sections } } : idea
    ));
    setEditingScriptIdea(null);
  };

  const currentSubs = youtubeData ? parseInt(youtubeData.channelStats.subscriberCount) : BASE_SUBSCRIBERS;
  const currentViews = youtubeData ? parseInt(youtubeData.channelStats.viewCount) : BASE_VIEWS;
  const subGrowth = currentSubs - BASE_SUBSCRIBERS;
  const viewGrowth = currentViews - BASE_VIEWS;

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full relative">
      {/* Header Section */}
      <header className="h-auto md:h-20 py-4 md:py-0 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between px-6 md:px-8 bg-[#0a0a0a]/50 shrink-0">
        <div>
          <div className="flex items-center">
            <h1 className="text-xl font-bold tracking-tight text-white mb-1 md:mb-0">
              REVERSE-RE LIFE <span className="text-zinc-500 font-normal ml-2">/ ダッシュボード</span>
            </h1>
            {youtubeToken && (
              <button 
                onClick={() => {
                  localStorage.removeItem('youtube_token');
                  setYoutubeToken(null);
                  setAuthError('Switch Account');
                }} 
                className="ml-4 text-zinc-600 hover:text-red-400 transition-colors text-[10px] uppercase font-bold tracking-widest min-h-[44px] flex items-center"
              >
                YouTube連携解除
              </button>
            )}
          </div>
          <p className="text-[10px] uppercase text-zinc-500 tracking-widest mt-1 hidden md:block">今日も一歩ずつ。アンチは無視して、自分の目標に集中しよう。</p>
        </div>
        
        <div className="flex flex-row gap-2.5 mt-4 md:mt-0 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button 
            onClick={() => onGenerateIdeas(ideas)}
            disabled={isGenerating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-4 py-3 min-h-[44px] min-w-[44px] rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap"
          >
            {isGenerating ? <CircleDashed size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
            AIアイデア生成
          </button>
          
          <button 
            onClick={handleCreateNewIdea}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors px-4 py-3 min-h-[44px] min-w-[44px] rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap"
          >
            <Plus size={16} />
            新規アイデア作成
          </button>
        </div>
      </header>

      {/* Script Editor Overlay */}
      <AnimatePresence>
        {editingScriptIdea && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 z-50 bg-[#0a0a0a]"
          >
            <ScriptEditor 
              idea={editingScriptIdea} 
              onClose={() => setEditingScriptIdea(null)} 
              onSave={handleSaveScript} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
        {authError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              <div className="text-sm">
                <span className="font-bold">正確なYouTubeアナリティクスデータの取得には認証が必要です。</span>
                <span className="text-red-400/80 block text-xs mt-1">現在はモックデータを表示しているか、データの取得に失敗しています。</span>
              </div>
            </div>
            <button
              onClick={handleConnect}
              className="bg-red-500 hover:bg-red-600 text-white transition-colors px-4 py-2 min-h-[44px] min-w-[44px] rounded-lg font-bold text-xs whitespace-nowrap shadow-lg flex items-center gap-2"
            >
              <Youtube size={16} />
              YouTubeと連携する
            </button>
          </div>
        )}

        {/* Quick Stats widget */}
        <div className={`grid-cols-1 md:grid-cols-4 gap-4 shrink-0 ${mobileTab === 'stats' ? 'grid' : 'hidden md:grid'}`}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#0d0d0d] border border-zinc-800 rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <Youtube size={18} />
                </div>
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">チャンネル登録者</h3>
              </div>
                <button 
                  onClick={fetchYoutubeData} 
                  disabled={isLoadingYoutube} 
                  className="text-zinc-600 hover:text-white transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <RefreshCw size={16} className={isLoadingYoutube ? "animate-spin" : ""} />
                </button>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-2xl font-mono text-zinc-100">{currentSubs.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 pb-1 tracking-widest">人</span>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold tracking-widest">
              <TrendingUp size={12} className={subGrowth > 0 ? "text-emerald-400" : "text-zinc-600"} />
              <span className={subGrowth > 0 ? "text-emerald-400" : "text-zinc-500"}>
                {subGrowth > 0 ? `+${subGrowth.toLocaleString()} ` : '0 '}
                <span className="font-normal text-zinc-600">from {BASE_SUBSCRIBERS.toLocaleString()}</span>
              </span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#0d0d0d] border border-zinc-800 rounded-lg p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">
                <Youtube size={14} />
              </div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">総再生回数</h3>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-2xl font-mono text-zinc-100">{currentViews.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 pb-1 tracking-widest">回</span>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold tracking-widest">
              <TrendingUp size={12} className={viewGrowth > 0 ? "text-emerald-400" : "text-zinc-600"} />
               <span className={viewGrowth > 0 ? "text-emerald-400" : "text-zinc-500"}>
                {viewGrowth > 0 ? `+${viewGrowth.toLocaleString()} ` : '0 '}
                <span className="font-normal text-zinc-600">from {BASE_VIEWS.toLocaleString()}</span>
              </span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#0d0d0d] border border-zinc-800 rounded-lg p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                <Target size={14} />
              </div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">本日の学習目標</h3>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-2xl font-mono text-zinc-100">5.5</span>
              <span className="text-[10px] text-zinc-500 pb-1 tracking-widest">/ 8.0 時間</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-4 overflow-hidden">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#0d0d0d] border border-zinc-800 rounded-lg p-5 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -right-4 -top-4 text-zinc-800/30">
              <MessageSquareOff size={80} />
            </div>
            <div className="relative z-10">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">メンタルプロテクト</h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                「アンチコメントは、前に進んでいる証拠。」
              </p>
            </div>
          </motion.div>
        </div>

        {youtubeError && (
          <div className={`bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 ${mobileTab === 'stats' ? 'flex' : 'hidden md:flex'}`}>
            <AlertCircle size={16} />
            <span className="text-xs font-bold">{youtubeError}</span>
          </div>
        )}

      {/* Kanban Board */}
      <div className={`min-h-[300px] flex-shrink-0 grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden pb-12 md:pb-0 ${mobileTab === 'ideas' ? 'grid' : 'hidden md:grid'}`}>
        {COLUMNS.map((column, colIndex) => {
          const ideas = getIdeasByStatus(column.id);
          
          return (
            <div key={column.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${colIndex === 0 ? 'bg-zinc-600' : colIndex === 1 ? 'bg-amber-500' : colIndex === 2 ? 'bg-sky-500' : 'bg-emerald-500'}`}></span> {column.label}
                </h3>
                <span className="text-[10px] text-zinc-600">
                  {ideas.length}
                </span>
              </div>
              
              <div 
                className={`flex-1 flex flex-col gap-3 min-h-[200px] overflow-y-auto pb-4 rounded-xl transition-colors ${activeDragColumn === column.id ? 'bg-zinc-800/30 ring-2 ring-indigo-500/50' : ''}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {ideas.map((idea, index) => (
                  <motion.div
                    key={idea.id}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, idea.id)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * colIndex + 0.05 * index }}
                    className={`bg-zinc-900/50 border hover:border-zinc-700 p-4 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${idea.status === 'scripting' ? 'border-amber-900/40 bg-zinc-900/80 border-l-4 border-l-amber-500' : idea.status === 'published' ? 'border-zinc-800 opacity-60 bg-zinc-900/30' : 'border-zinc-800'}`}
                  >
                    <div className="flex justify-between mb-2">
                      <div className="flex gap-1.5 flex-wrap">
                      {idea.tags.map(tag => (
                        <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full border ${idea.status === 'scripting' ? 'bg-amber-900/30 text-amber-500 border-amber-500/20' : 'bg-indigo-900/30 text-indigo-400 border-indigo-500/20'}`}>
                          {tag}
                        </span>
                      ))}
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingScriptIdea(idea); }}
                          className="text-zinc-600 hover:text-emerald-400 transition-colors bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 p-1 flex items-center justify-center rounded-lg"
                          title="台本を書く"
                        >
                          <FileText size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIdeaToEdit(idea); setEditTitle(idea.title); setEditTags(idea.tags.join(', ')); }}
                          className="text-zinc-600 hover:text-indigo-400 transition-colors bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 p-1 flex items-center justify-center rounded-lg"
                          title="編集"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIdeaToDelete(idea.id); }}
                          className="text-zinc-600 hover:text-red-400 transition-colors bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 p-1 flex items-center justify-center rounded-lg"
                          title="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-medium leading-tight text-zinc-200 py-2">
                      {idea.title}
                    </h4>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {colIndex > 0 && (
                          <button onClick={(e) => { e.stopPropagation(); handleMoveIdea(idea.id, 'left'); }} className="p-1 text-zinc-500 hover:text-indigo-400 bg-zinc-800/50 hover:bg-zinc-800 rounded md:hidden">
                            <ChevronLeft size={16} />
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {idea.createdAt.replace(/-/g, '.')}
                      </span>
                      <div className="flex items-center gap-1">
                        {colIndex < COLUMNS.length - 1 && (
                          <button onClick={(e) => { e.stopPropagation(); handleMoveIdea(idea.id, 'right'); }} className="p-1 text-zinc-500 hover:text-indigo-400 bg-zinc-800/50 hover:bg-zinc-800 rounded md:hidden">
                            <ChevronRight size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {ideas.length === 0 && (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl p-8">
                    <p className="text-[11px] text-zinc-600">カードをドラッグ</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Channel Trend Charts */}
      {youtubeData?.channelStats?.history && youtubeData.channelStats.history.length > 0 && (
        <div className={`mt-8 shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 ${mobileTab === 'stats' ? 'grid' : 'hidden md:grid'}`}>
          <div className="bg-[#0d0d0d] border border-zinc-800 rounded-xl p-4">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4">
               <Youtube size={16} className="text-red-500" />
               チャンネル登録者数の推移（過去7日間）
            </h2>
            <div className="h-[200px]">
              <ChannelStatsChart stats={youtubeData.channelStats} dataKey="subscribers" color="#ef4444" />
            </div>
          </div>
          <div className="bg-[#0d0d0d] border border-zinc-800 rounded-xl p-4">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4">
               <Youtube size={16} className="text-blue-500" />
               総再生回数の推移（過去7日間）
            </h2>
            <div className="h-[200px]">
              <ChannelStatsChart stats={youtubeData.channelStats} dataKey="views" color="#3b82f6" />
            </div>
          </div>
        </div>
      )}

      {/* Video Trend Chart */}
      {youtubeData?.latestVideos && youtubeData.latestVideos.length > 0 && (
        <div className={`mt-8 shrink-0 bg-[#0d0d0d] border border-zinc-800 rounded-xl p-4 ${mobileTab === 'stats' ? 'block' : 'hidden md:block'}`}>
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <BarChart size={16} className="text-indigo-400" />
            直近動画の再生数推移（過去7日間）
          </h2>
          <div className="h-[200px]">
            <VideoTrendChart videos={youtubeData.latestVideos} />
          </div>
        </div>
      )}

      {/* Latest Videos */}
      <div className={`mt-8 shrink-0 pb-8 ${mobileTab === 'stats' ? 'block' : 'hidden md:block'}`}>
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Youtube size={16} className="text-red-500" />
          最新のアップロード動画
        </h2>
        {isLoadingYoutube && !youtubeData ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-zinc-600" size={24} />
          </div>
        ) : youtubeData?.latestVideos && youtubeData.latestVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {youtubeData.latestVideos.map((video) => {
              const weekViews = video.history && video.history.length > 0 
                ? parseInt(video.viewCount) - video.history[0].views
                : 0;

              return (
                <a 
                  key={video.id} 
                  href={`https://youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0d0d0d] border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden group transition-colors flex flex-col items-start text-left"
                >
                  <div className="relative aspect-video bg-zinc-900 border-b border-zinc-800 overflow-hidden w-full">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">No Image</div>
                    )}
                    {video.monetizationStatus && (
                      <div className={`absolute top-2 right-2 rounded-full p-1 bg-black/60 backdrop-blur-md border ${
                        video.monetizationStatus === 'monetized' ? 'border-emerald-500/50 text-emerald-400' :
                        video.monetizationStatus === 'limited' ? 'border-yellow-500/50 text-yellow-400' :
                        'border-red-500/50 text-red-400'
                      }`}>
                        <DollarSign size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1 w-full">
                    <h4 className="text-xs font-medium text-zinc-200 line-clamp-2 leading-snug mb-2 flex-1">
                      {video.title}
                    </h4>
                    <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                         <span>{parseInt(video.viewCount).toLocaleString()} views</span>
                         <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                      </div>
                      {weekViews > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-400/10 px-1.5 py-0.5 rounded w-fit">
                          <TrendingUp size={10} />
                          +{weekViews.toLocaleString()} (過去7日間)
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0d0d0d] border border-zinc-800 rounded-xl p-8 text-center min-h-[120px] flex items-center justify-center">
            <p className="text-xs text-zinc-500">最新動画のデータがありません。</p>
          </div>
        )}
      </div>

      {/* Settings Placeholder for Mobile */}
      {mobileTab === 'settings' && (
        <div className="flex-1 flex flex-col items-center justify-center md:hidden min-h-[300px]">
          <MessageSquareOff size={48} className="text-zinc-800 mb-4" />
          <p className="text-zinc-500 font-bold tracking-widest text-xs uppercase">設定は現在準備中です</p>
        </div>
      )}

      {/* Edit Idea Modal */}
      <AnimatePresence>
        {ideaToEdit && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setIdeaToEdit(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0d0d0d] border border-zinc-800 p-6 rounded-2xl shadow-xl shadow-black/50 w-[90%] max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-indigo-400">
                  <div className="p-1.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                    <Edit2 size={16} />
                  </div>
                  <h3 className="font-bold text-sm">アイデアの編集</h3>
                </div>
                <button 
                  onClick={() => setIdeaToEdit(null)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold tracking-widest text-zinc-400 uppercase mb-2">タイトル</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest text-zinc-400 uppercase mb-2">タグ (カンマ区切り)</label>
                  <input 
                    type="text" 
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="#タグ1, #タグ2"
                    className="w-full bg-[#18181b] border border-zinc-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIdeaToEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-700"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleSaveIdeaEdit}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-500/50 rounded-lg transition-colors"
                >
                  保存する
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {ideaToDelete && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setIdeaToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0d0d0d] border border-zinc-800 p-6 rounded-2xl shadow-xl shadow-black/50 w-[90%] max-w-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-red-400">
                  <div className="p-1.5 bg-red-500/10 rounded-md border border-red-500/20">
                    <Trash2 size={16} />
                  </div>
                  <h3 className="font-bold text-sm">アイデアの削除</h3>
                </div>
                <button 
                  onClick={() => setIdeaToDelete(null)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
                このアイデアを削除してもよろしいですか？この操作は元に戻せません。
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIdeaToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-700"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleDeleteIdea}
                  className="px-4 py-2 text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                >
                  削除する
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
