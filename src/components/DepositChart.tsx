import { useState, useMemo } from 'react';
import { Button } from '@heroui/button';
import { useChartData } from '@/hooks/useSubgraphData';
import { TimeRange, ChartDataType } from '@/types/subgraph';
import { useSystemTheme } from '@/hooks/useSystemTheme';

interface DepositChartProps {
  className?: string;
}

interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

interface DataTypeOption {
  value: ChartDataType;
  label: string;
  color: string;
}

const TIME_RANGES: TimeRangeOption[] = [
  { value: '1H', label: '1小时' },
  { value: '1D', label: '1天' },
  { value: '7D', label: '7天' },
  { value: '30D', label: '30天' },
  { value: 'ALL', label: '全部' },
];

const DATA_TYPES: DataTypeOption[] = [
  { value: 'cumulativeAmount', label: '累积金额', color: '#10B981' },
  { value: 'cumulativeDeposits', label: '累积次数', color: '#3B82F6' },
  { value: 'depositAmount', label: '充值金额', color: '#8B5CF6' },
  { value: 'depositCount', label: '充值次数', color: '#F59E0B' },
];

export default function DepositChart({ className = '' }: DepositChartProps) {
  const { theme } = useSystemTheme();
  const isDark = theme === 'dark';
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1D');
  const [selectedDataType, setSelectedDataType] = useState<ChartDataType>('cumulativeAmount');
  
  const { data: chartData, loading, error } = useChartData({
    timeRange: selectedTimeRange,
    dataType: selectedDataType,
  });

  // 计算图表路径
  const chartPath = useMemo(() => {
    if (!chartData || chartData.length === 0) return '';
    
    const width = 800;
    const height = 280;
    const padding = 60;
    
    const maxValue = Math.max(...chartData.map(d => d.value));
    const minValue = Math.min(...chartData.map(d => d.value));
    const valueRange = maxValue - minValue || 1;
    
    const points = chartData.map((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.value - minValue) / valueRange) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }, [chartData]);

  // 计算填充区域路径
  const areaPath = useMemo(() => {
    if (!chartData || chartData.length === 0) return '';
    
    const width = 800;
    const height = 280;
    const padding = 60;
    
    const maxValue = Math.max(...chartData.map(d => d.value));
    const minValue = Math.min(...chartData.map(d => d.value));
    const valueRange = maxValue - minValue || 1;
    
    const points = chartData.map((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.value - minValue) / valueRange) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    const firstPoint = points[0].split(',');
    const lastPoint = points[points.length - 1].split(',');
    
    return `M ${firstPoint[0]},${height - padding} L ${points.join(' L ')} L ${lastPoint[0]},${height - padding} Z`;
  }, [chartData]);

  // 格式化数值显示
  const formatValue = (value: number, type: ChartDataType): string => {
    if (type === 'cumulativeAmount' || type === 'depositAmount') {
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K ETH`;
      return `${value.toFixed(2)} ETH`;
    } else {
      return value.toLocaleString();
    }
  };

  // 获取当前数据类型的颜色
  const currentColor = DATA_TYPES.find(t => t.value === selectedDataType)?.color || '#10B981';

  return (
    <div className={`${className}`}>
      <div
        className={`rounded-2xl md:rounded-3xl p-4 md:p-8 backdrop-blur-sm border shadow-2xl transition-all duration-500 ${
          isDark
            ? 'bg-gray-800/40 border-gray-600/30'
            : 'bg-white/70 border-gray-200/50'
        }`}
      >
        {/* 标题和控制面板 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h2
              className={`text-2xl md:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                isDark
                  ? 'from-green-400 to-blue-400'
                  : 'from-green-600 to-blue-600'
              }`}
            >
              渐进式充值数据
            </h2>
            <p
              className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              实时链上数据可视化
            </p>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* 时间范围选择 */}
          <div className="flex flex-wrap gap-2">
            {TIME_RANGES.map((range) => (
              <Button
                key={range.value}
                size="sm"
                variant={selectedTimeRange === range.value ? 'solid' : 'bordered'}
                className={`transition-all duration-200 ${
                  selectedTimeRange === range.value
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedTimeRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>

          {/* 数据类型选择 */}
          <div className="flex flex-wrap gap-2">
            {DATA_TYPES.map((dataType) => (
              <Button
                key={dataType.value}
                size="sm"
                variant={selectedDataType === dataType.value ? 'solid' : 'bordered'}
                className={`transition-all duration-200 ${
                  selectedDataType === dataType.value
                    ? 'text-white'
                    : isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: selectedDataType === dataType.value ? dataType.color : undefined,
                  borderColor: selectedDataType === dataType.value ? dataType.color : undefined,
                }}
                onClick={() => setSelectedDataType(dataType.value)}
              >
                {dataType.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 图表区域 */}
        <div
          className={`rounded-xl md:rounded-2xl p-3 md:p-6 h-80 md:h-96 relative overflow-hidden transition-all duration-500 shadow-inner ${
            isDark
              ? 'bg-gradient-to-br from-gray-900/80 to-black/60'
              : 'bg-gradient-to-br from-gray-50/80 to-white/90'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div
                  className={`w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin mb-2 mx-auto ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}
                />
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  加载数据中...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className={`text-red-500 mb-2`}>加载失败</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {error}
                </p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                暂无数据
              </p>
            </div>
          ) : (
            <svg
              className="overflow-visible"
              height="100%"
              viewBox="0 0 800 280"
              width="100%"
            >
              {/* 渐变定义 */}
              <defs>
                <linearGradient
                  id="chartGradient"
                  x1="0%"
                  x2="100%"
                  y1="0%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={currentColor} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={currentColor} stopOpacity="0.9" />
                </linearGradient>
                <linearGradient
                  id="areaGradient"
                  x1="0%"
                  x2="0%"
                  y1="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={currentColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={currentColor} stopOpacity="0.05" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur result="coloredBlur" stdDeviation="3" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 网格 */}
              <pattern
                height="25"
                id="grid"
                patternUnits="userSpaceOnUse"
                width="80"
              >
                <path
                  d="M 80 0 L 0 0 0 25"
                  fill="none"
                  opacity="0.3"
                  stroke={isDark ? '#374151' : '#E5E7EB'}
                  strokeWidth="0.3"
                />
              </pattern>
              <rect fill="url(#grid)" height="280" width="800" />

              {/* 填充区域 */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#areaGradient)"
                />
              )}

              {/* 数据曲线 */}
              {chartPath && (
                <path
                  d={chartPath}
                  fill="none"
                  filter="url(#glow)"
                  stroke="url(#chartGradient)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />
              )}

              {/* 数据点 */}
              {chartData.length <= 50 && chartData.map((point, i) => {
                const width = 800;
                const height = 280;
                const padding = 60;
                
                const maxValue = Math.max(...chartData.map(d => d.value));
                const minValue = Math.min(...chartData.map(d => d.value));
                const valueRange = maxValue - minValue || 1;
                
                const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
                const y = height - padding - ((point.value - minValue) / valueRange) * (height - 2 * padding);
                
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      fill={currentColor}
                      r="4"
                      opacity="0.8"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      fill="white"
                      r="2"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* 当前数值显示 */}
          {chartData.length > 0 && (
            <div
              className={`absolute top-3 right-3 md:top-6 md:right-6 rounded-xl md:rounded-2xl px-3 md:px-6 py-2 md:py-4 backdrop-blur-sm border shadow-xl transition-all duration-500 ${
                isDark
                  ? 'bg-gray-800/80 border-gray-600/30'
                  : 'bg-white/90 border-gray-200/50'
              }`}
            >
              <div className="text-center">
                <div className={`text-xs md:text-sm font-medium mb-1`} style={{ color: currentColor }}>
                  当前值
                </div>
                <div
                  className={`text-lg md:text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {formatValue(chartData[chartData.length - 1]?.value || 0, selectedDataType)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 图例和说明 */}
        <div className="mt-4 md:mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentColor }}
              />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {DATA_TYPES.find(t => t.value === selectedDataType)?.label}
              </span>
            </div>
          </div>
          <div
            className={`text-xs ${
              isDark ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            数据来源: The Graph 子图
          </div>
        </div>
      </div>
    </div>
  );
}