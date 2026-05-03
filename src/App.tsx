/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import RightSidebar from "./components/RightSidebar";
import BottomNav from "./components/BottomNav";
import { TitleIdea, VideoIdea, MobileTab } from "./types";
import { generateTitleIdeasWithGemini } from "./services/geminiService";

export default function App() {
  const [titleIdeas, setTitleIdeas] = useState<TitleIdea[]>([
    { title: "「中卒の俺が簿記1級を目指す本当の理由」", reason: "応援したくなるストーリー性" },
    { title: "「アンチコメントへの回答：学歴は関係ありますか？」", reason: "物議を醸し視聴率アップ" },
    { title: "「32歳、人生逆転のロードマップ公開」", reason: "同じ境遇の人への有益性" }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('ideas');

  const handleGenerateIdeas = async (currentIdeas: VideoIdea[]) => {
    setIsGenerating(true);
    try {
      const newIdeas = await generateTitleIdeasWithGemini(currentIdeas);
      if (newIdeas && newIdeas.length > 0) {
        setTitleIdeas(newIdeas);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 font-sans overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pb-[64px] md:pb-0">
        <Dashboard onGenerateIdeas={handleGenerateIdeas} isGenerating={isGenerating} mobileTab={mobileTab} />
      </main>
      <div className="hidden lg:flex">
        <RightSidebar titleIdeas={titleIdeas} isGenerating={isGenerating} />
      </div>
      <BottomNav activeTab={mobileTab} onChange={setMobileTab} />
    </div>
  );
}
