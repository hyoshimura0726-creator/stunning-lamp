import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { YoutubeVideo } from '../types';
import { TrendingUp } from 'lucide-react';

interface VideoTrendChartProps {
  videos: YoutubeVideo[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-3 shadow-xl min-w-[200px]">
        <p className="text-zinc-400 text-[10px] mb-3 font-mono tracking-widest">{label}</p>
        <div className="flex flex-col gap-2.5">
          {payload.map((entry: any, index: number) => {
            // value is the current day's views.
            // We can show the total views and if possible, we calculate the diff in the chartData formulation.
            // entry.payload contains the full data object for this data point.
            const currentViews = entry.value;
            const diff = entry.payload[`${entry.dataKey}_diff`];
            
            return (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-zinc-300 text-[10px] truncate max-w-[140px] leading-none">{entry.name}</span>
                </div>
                <div className="flex items-end justify-between pl-4">
                  <span className="text-zinc-100 text-xs font-mono">{currentViews.toLocaleString()} <span className="text-[9px] text-zinc-500 font-sans">回</span></span>
                  {diff !== undefined && diff > 0 && (
                    <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-0.5">
                      <TrendingUp size={10} />
                      +{diff.toLocaleString()}
                    </span>
                  )}
                  {diff !== undefined && diff === 0 && (
                    <span className="text-zinc-500 text-[10px] font-mono flex items-center gap-0.5">
                      ±0
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function VideoTrendChart({ videos }: VideoTrendChartProps) {
  const COLORS = ['#818cf8', '#34d399', '#fbf8cc', '#f472b6', '#38bdf8'];

  const chartData = useMemo(() => {
    if (!videos || videos.length === 0) return [];
    
    const dateMap = new Map<string, any>();

    // First collect all views
    videos.forEach((video) => {
      const shortTitle = video.title.length > 20 ? video.title.substring(0, 20) + '...' : video.title;

      video.history?.forEach((h, i) => {
        if (!dateMap.has(h.date)) {
          dateMap.set(h.date, { date: h.date });
        }
        const entry = dateMap.get(h.date);
        
        entry[shortTitle] = h.views;
        
        // Calculate diff from previous day if available
        if (i > 0) {
          const prevViews = video.history[i - 1].views;
          entry[`${shortTitle}_diff`] = h.views - prevViews;
        } else {
          entry[`${shortTitle}_diff`] = 0;
        }
      });
    });

    return Array.from(dateMap.values());
  }, [videos]);

  if (!videos || videos.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#71717a" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }} 
            iconType="circle"
            iconSize={6}
          />
          {videos.map((video, index) => {
            const shortTitle = video.title.length > 20 ? video.title.substring(0, 20) + '...' : video.title;
            return (
              <Line 
                key={video.id}
                type="monotone" 
                dataKey={shortTitle} 
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={2}
                dot={{ stroke: COLORS[index % COLORS.length], strokeWidth: 2, r: 2, fill: '#0d0d0d' }}
                activeDot={{ r: 4, strokeWidth: 0, fill: COLORS[index % COLORS.length] }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
  );
}
