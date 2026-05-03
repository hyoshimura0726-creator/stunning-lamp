export type IdeaStatus = 'idea' | 'scripting' | 'filmed' | 'published';

export interface ScriptSection {
  id: string;
  title: string;
  content: string;
}

export interface VideoScript {
  id: string;
  sections: ScriptSection[];
}

export interface VideoIdea {
  id: string;
  title: string;
  status: IdeaStatus;
  tags: string[];
  createdAt: string;
  script?: VideoScript;
}

export interface StudyLog {
  date: string;
  hours: number;
  goalHours: number;
  topic: string;
}

export interface TitleIdea {
  title: string;
  reason: string;
}

export interface YoutubeStats {
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  history?: { date: string, subscribers: number, views: number }[];
}

export type MonetizationStatus = 'monetized' | 'limited' | 'ineligible';

export interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  history: { date: string, views: number }[];
  monetizationStatus?: MonetizationStatus;
}

export interface YoutubeDataResponse {
  channelStats: YoutubeStats;
  latestVideos: YoutubeVideo[];
}

export type MobileTab = 'ideas' | 'stats' | 'settings';
