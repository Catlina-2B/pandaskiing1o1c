import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { useRealTimeData, useRecentDeposits } from '@/hooks/useSubgraphData';
import { useSystemTheme } from '@/hooks/useSystemTheme';

interface RealtimeStatsProps {
  className?: string;
}

export default function RealtimeStats({ className = '' }: RealtimeStatsProps) {
  const { theme } = useSystemTheme();
  const isDark = theme === 'dark';
  
  const { recentDeposits: recentDepositsFromHook, loading, error } = useRealTimeData();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (recentDepositsFromHook && recentDepositsFromHook.length > 0) {
      setLastUpdate(new Date());
    }
  }, [recentDepositsFromHook]);

  const recentDeposits = recentDepositsFromHook;

  // 格式化地址显示
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 格式化时间显示
  const formatTime = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 格式化金额显示
  const formatAmount = (amount: string): string => {
    const eth = parseFloat(amount) / 1e18;
    if (eth >= 1000) return `${(eth / 1000).toFixed(1)}K ETH`;
    if (eth >= 1) return `${eth.toFixed(2)} ETH`;
    return `${eth.toFixed(4)} ETH`;
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center p-8`}>
        <div className="text-center">
          <div
            className={`w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin mb-2 mx-auto ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}
          />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            加载实时数据...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} p-8`}>
        <div className="text-center">
          <p className="text-red-500 mb-2">数据加载失败</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {error || '未知错误'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={`rounded-2xl md:rounded-3xl p-4 md:p-6 backdrop-blur-sm border shadow-2xl transition-all duration-500 ${
          isDark
            ? 'bg-gray-800/40 border-gray-600/30'
            : 'bg-white/70 border-gray-200/50'
        }`}
      >
        {/* 标题和更新时间 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2
              className={`text-xl md:text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                isDark
                  ? 'from-purple-400 to-blue-400'
                  : 'from-purple-600 to-blue-600'
              }`}
            >
              实时数据总览
            </h2>
            <p
              className={`text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              最后更新: {lastUpdate.toLocaleTimeString('zh-CN')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDark ? 'bg-green-400' : 'bg-green-500'
              }`}
            />
            <span
              className={`text-xs font-medium ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`}
            >
              实时数据
            </span>
          </div>
        </div>

        {/* 最近充值记录 */}
        <div>
          <h3
            className={`text-lg font-semibold mb-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            最近充值记录
          </h3>
          
          {recentDeposits.length === 0 ? (
            <div
              className={`p-4 text-center rounded-lg ${
                isDark ? 'bg-gray-700/30' : 'bg-gray-100/50'
              }`}
            >
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                暂无充值记录
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDeposits.map((deposit, index) => (
                <div
                  key={deposit.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                    isDark 
                      ? 'bg-gray-700/40 hover:bg-gray-700/60' 
                      : 'bg-gray-100/60 hover:bg-gray-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white`}
                      style={{
                        backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`
                      }}
                    >
                      #{deposit.depositNumber}
                    </div>
                    <div>
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatAddress(deposit.depositor)}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatTime(deposit.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        isDark ? 'text-green-400' : 'text-green-600'
                      }`}
                    >
                      {formatAmount(deposit.amount)}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      第 {deposit.depositNumber} 笔
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 网络状态指示器 */}
        <div className="mt-4 pt-4 border-t border-gray-200/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isDark ? 'bg-green-400' : 'bg-green-500'
                }`}
              />
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                BSC 主网连接正常
              </span>
            </div>
            <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
              数据延迟 ~30s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}