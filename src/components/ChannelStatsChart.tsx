import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { YoutubeStats } from '../types';
import { TrendingUp } from 'lucide-react';

interface ChannelStatsChartProps {
  stats: YoutubeStats;
  dataKey: 'subscribers' | 'views';
  color: string;
}

const CustomTooltip = ({ active, payload, label, dataKey }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const currentValue = data.value;
    const diff = data.payload[`${dataKey}_diff`];
    
    return (
      <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-3 shadow-xl min-w-[160px]">
        <p className="text-zinc-400 text-[10px] mb-2 font-mono tracking-widest">{label}</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
            <span className="text-zinc-300 text-[10px] leading-none">
              {dataKey === 'subscribers' ? 'チャンネル登録者数' : '総再生回数'}
            </span>
          </div>
          <div className="flex items-end justify-between pl-4 mt-1">
            <span className="text-zinc-100 text-sm font-mono font-bold">
              {currentValue.toLocaleString()} <span className="text-[9px] text-zinc-500 font-sans font-normal">{dataKey === 'subscribers' ? '人' : '回'}</span>
            </span>
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
      </div>
    );
  }
  return null;
};

export default function ChannelStatsChart({ stats, dataKey, color }: ChannelStatsChartProps) {
  const chartData = useMemo(() => {
    if (!stats.history || stats.history.length === 0) return [];
    
    return stats.history.map((h, i) => {
      let diff = 0;
      if (i > 0) {
        diff = h[dataKey] - stats.history![i - 1][dataKey];
      }
      return {
        date: h.date,
        [dataKey]: h[dataKey],
        [`${dataKey}_diff`]: diff
      };
    });
  }, [stats, dataKey]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
        <TrendingUp size={24} className="opacity-20" />
        <span className="text-xs">データがありません</span>
      </div>
    );
  }

  // Calculate min value for Y-axis to make the chart more dynamic
  const stringToNumber = (val: any) => typeof val === 'number' ? val : 0;
  const minValue = Math.min(...chartData.map(d => stringToNumber(d[dataKey])));
  const yDomain: [number, string] = [Math.max(0, minValue - (dataKey === 'subscribers' ? 10 : 500)), 'auto'];

  return (
    <div className="w-full h-full min-h-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#52525b" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
            dy={5}
          />
          <YAxis 
            stroke="#52525b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
            width={40}
            domain={yDomain}
          />
          <Tooltip 
            content={<CustomTooltip dataKey={dataKey} />}
            cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#color${dataKey})`} 
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
