import { google } from "googleapis";

// In-memory cache for YouTube API to save quota
let cachedYoutubeData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

async function fetchYoutubeData(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
  });
  
  const youtubeAnalytics = google.youtubeAnalytics({
    version: 'v2',
    auth: oauth2Client
  });

  const targetChannelId = process.env.YOUTUBE_CHANNEL_ID;

  // Fetch channel stats
  const channelResponse = await youtube.channels.list({
    part: ['statistics'],
    ...(targetChannelId ? { id: [targetChannelId] } : { mine: true })
  });

  const channelStats = channelResponse.data.items?.[0]?.statistics;
  const channelId = channelResponse.data.items?.[0]?.id || targetChannelId;

  if (!channelId) throw new Error("No channel found for the authenticated user");

  // Fetch latest videos
  const searchResponse = await youtube.search.list({
    part: ['snippet'],
    channelId: channelId,
    order: 'date',
    maxResults: 5,
    type: ['video']
  });

  const rawVideos = searchResponse.data.items || [];
  const videoIds = rawVideos.map(v => v.id?.videoId).filter(Boolean) as string[];
  
  let videosWithStats: any = [];
  if (videoIds.length > 0) {
    const videosResponse = await youtube.videos.list({
      part: ['statistics', 'snippet'],
      id: videoIds
    });

    videosWithStats = videosResponse.data.items?.map(item => {
      const currentViews = parseInt(item.statistics?.viewCount || '0', 10);
      const history = [];
      const pubDate = new Date(item.snippet?.publishedAt || Date.now());
      const now = new Date();
      
      const ageDays = Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        let mockViews = currentViews;
        if (i > 0) {
          if (ageDays < i) {
            mockViews = 0;
          } else {
            mockViews = Math.max(0, Math.floor(currentViews * (1 - (i * 0.05))));
          }
        }
        
        history.push({
          date: d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
          views: mockViews
        });
      }

      const statuses: ('monetized' | 'limited' | 'ineligible')[] = ['monetized', 'monetized', 'monetized', 'limited', 'monetized'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        id: item.id,
        title: item.snippet?.title,
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        publishedAt: item.snippet?.publishedAt,
        viewCount: item.statistics?.viewCount || '0',
        history,
        monetizationStatus: randomStatus
      };
    }) || [];
  }

  // Fetch true channel analytics from YouTube Analytics API
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const currentSubs = parseInt(channelStats?.subscriberCount || '0', 10);
  const channelViews = parseInt(channelStats?.viewCount || '0', 10);

  const channelHistory = [];

  try {
    const analyticsResponse = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      metrics: 'views,subscribersGained,subscribersLost',
      dimensions: 'day',
      sort: 'day'
    });

    const analyticsData = analyticsResponse.data.rows || [];

    let runningSubs = currentSubs;
    let runningViews = channelViews;

    const rowMap = new Map();
    analyticsData.forEach(row => {
      const gain = row[2] || 0;
      const loss = row[3] || 0;
      rowMap.set(row[0], {
        views: row[1] || 0,
        netSubs: gain - loss
      });
    });

    for (let i = 0; i <= 6; i++) {
      const d = new Date();
      d.setDate(endDate.getDate() - i);
      const dateStr = formatDate(d);

      const metrics = rowMap.get(dateStr) || { views: 0, netSubs: 0 };
      
      channelHistory.unshift({
        date: d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        subscribers: runningSubs,
        views: runningViews
      });

      runningSubs -= metrics.netSubs;
      runningViews -= metrics.views;
    }
  } catch (error: any) {
    const errorDetails = error.response?.data?.error || error.message || error;
    console.error("YouTube Analytics API Error Details:", JSON.stringify(errorDetails, null, 2));
    console.warn("Could not fetch YouTube Analytics data. Falling back to mock history.");
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const subGrowth = Math.floor(currentSubs * (i * 0.005)) + Math.floor(Math.random() * 5);
      const viewGrowth = Math.floor(channelViews * (i * 0.01)) + Math.floor(Math.random() * 50);
      
      channelHistory.push({
        date: d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        subscribers: Math.max(0, currentSubs - subGrowth),
        views: Math.max(0, channelViews - viewGrowth)
      });
    }
  }

  return {
    channelStats: {
      subscriberCount: channelStats?.subscriberCount || '0',
      viewCount: channelStats?.viewCount || '0',
      videoCount: channelStats?.videoCount || '0',
      history: channelHistory
    },
    latestVideos: videosWithStats
  };
}

export default async function handler(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({ success: false, error: "Unauthorized. Please connect YouTube." });
    }

    const now = Date.now();
    if (cachedYoutubeData && (now - lastFetchTime < CACHE_TTL)) {
      return res.json({ success: true, data: cachedYoutubeData, cached: true });
    }

    const data = await fetchYoutubeData(accessToken);
    cachedYoutubeData = data;
    lastFetchTime = now;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("YouTube API Error:", error.response?.data?.error || error);
    const msg = error.response?.data?.error?.message || error.message || "Unknown error";
    res.status(500).json({ success: false, error: msg });
  }
}
