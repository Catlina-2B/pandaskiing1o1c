import { useRecentDeposits, formatAmount, formatAddress, formatTime } from '@/hooks/useSubgraphData';
import { useSystemTheme } from '@/hooks/useSystemTheme';

export default function SubgraphTest() {
  const { theme } = useSystemTheme();
  const isDark = theme === 'dark';
  
  const { data: recentDeposits, isLoading: depositsLoading, error: depositsError } = useRecentDeposits(5);

  if (depositsLoading) {
    return (
      <div className={`p-4 border font-mono text-sm ${isDark ? 'bg-black border-green-400/20 text-green-400' : 'bg-white border-gray-900/20 text-gray-900'}`}>
        <div className={`border-b px-3 py-2 text-xs ${isDark ? 'border-green-400/20 bg-green-400/5' : 'border-gray-900/20 bg-gray-900/5'}`}>
          terminal@subgraph:~$ loading...
        </div>
        <div className="p-4">
          <div className="animate-pulse">正在加载 subgraph 数据...</div>
        </div>
      </div>
    );
  }

  if (depositsError) {
    return (
      <div className={`p-4 border font-mono text-sm ${isDark ? 'bg-black border-red-400/20 text-red-400' : 'bg-white border-red-900/20 text-red-900'}`}>
        <div className={`border-b px-3 py-2 text-xs ${isDark ? 'border-red-400/20 bg-red-400/5' : 'border-red-900/20 bg-red-900/5'}`}>
          terminal@subgraph:~$ error
        </div>
        <div className="p-4">
          <div>错误: {depositsError?.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-8 border font-mono text-sm ${isDark ? 'bg-black border-green-400/20 text-green-400' : 'bg-white border-gray-900/20 text-gray-900'}`}>
      <div className={`border-b px-3 py-2 text-xs ${isDark ? 'border-green-400/20 bg-green-400/5' : 'border-gray-900/20 bg-gray-900/5'}`}>
        terminal@subgraph:~$ data.status
      </div>
      
      <div className="p-4 space-y-4">
        {/* 最近充值 */}
        {recentDeposits && recentDeposits.length > 0 && (
          <div>
            <div className="font-bold mb-2">[RECENT_DEPOSITS]</div>
            <div className="pl-4 text-xs space-y-2">
              {recentDeposits.map((deposit, i) => (
                <div key={deposit.id} className="flex justify-between">
                  <span>#{deposit.depositNumber} {formatAddress(deposit.depositor)}</span>
                  <span>{formatAmount(deposit.amount)} @ {formatTime(deposit.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}