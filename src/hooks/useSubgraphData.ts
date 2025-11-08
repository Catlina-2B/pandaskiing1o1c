import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { useState, useEffect, useCallback } from 'react';
import { 
  MinuteStats, 
  HourlyStats, 
  DailyStats,
  DepositEvent,
  ChartDataPoint,
  TimeRange,
  ChartDataType,
  QueryOptions,
  SubgraphResponse 
} from '@/types/subgraph';
import { getSubgraphEndpoint } from '@/config/subgraph';

// Subgraph 配置
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/1714807/panda-skiing-one-on-one-call/version/latest';
const HEADERS = { Authorization: 'Bearer e929879d76332fee0b1fad17b611f0ee' };

// GraphQL 查询 - 根据实际 schema 定义
const RECENT_DEPOSITS_QUERY = gql`
  query GetRecentDeposits($first: Int!) {
    depositeds(first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      depositor
      amount
      depositNumber
      timestamp
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

const DEPOSIT_AMOUNT_SETS_QUERY = gql`
  query GetDepositAmountSets($first: Int!) {
    depositAmountSets(first: $first, orderBy: blockNumber, orderDirection: desc) {
      id
      depositNumber
      amount
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

const MINUTE_STATS_QUERY = gql`
  query GetMinuteStats($first: Int!) {
    minuteStats(first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      depositCount
      depositAmount
      withdrawAmount
      uniqueDepositors
      cumulativeDeposits
      cumulativeAmount
    }
  }
`;

const HOURLY_STATS_QUERY = gql`
  query GetHourlyStats($first: Int!) {
    hourlyStats(first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      depositCount
      depositAmount
      withdrawAmount
      uniqueDepositors
      cumulativeDeposits
      cumulativeAmount
    }
  }
`;

const ALL_DEPOSITS_QUERY = gql`
  query GetAllDeposits($first: Int!) {
    depositeds(first: $first, orderBy: depositNumber, orderDirection: asc) {
      id
      depositor
      amount
      depositNumber
      timestamp
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// 工具函数
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatAmount(amount: string): string {
  const eth = parseFloat(amount) / 1e18;
  if (eth >= 1000) return `${(eth / 1000).toFixed(1)}K ETH`;
  if (eth >= 1) return `${eth.toFixed(2)} ETH`;
  return `${eth.toFixed(4)} ETH`;
}

function formatTime(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

// 使用 React Query 的 Hooks

// 最近充值记录Hook
export function useRecentDeposits(limit: number = 10) {
  return useQuery({
    queryKey: ['recentDeposits', limit],
    queryFn: async () => {
      const response = await request(SUBGRAPH_URL, RECENT_DEPOSITS_QUERY, { first: limit }, HEADERS);
      return response.depositeds as DepositEvent[];
    },
    staleTime: 15 * 1000, // 15秒
    refetchInterval: 15 * 1000, // 15秒自动刷新
  });
}

// 充值金额设置记录Hook
export function useDepositAmountSets(limit: number = 20) {
  return useQuery({
    queryKey: ['depositAmountSets', limit],
    queryFn: async () => {
      const response = await request(SUBGRAPH_URL, DEPOSIT_AMOUNT_SETS_QUERY, { first: limit }, HEADERS);
      return response.depositAmountSets as any[];
    },
    staleTime: 60 * 1000, // 1分钟
    refetchInterval: 60 * 1000, // 1分钟自动刷新
  });
}

// 分钟级聚合数据Hook
export function useMinuteStats(limit: number = 100) {
  return useQuery({
    queryKey: ['minuteStats', limit],
    queryFn: async () => {
      const response = await request(SUBGRAPH_URL, MINUTE_STATS_QUERY, { first: limit }, HEADERS);
      return response.minuteStats as MinuteStats[];
    },
    staleTime: 30 * 1000, // 30秒
    refetchInterval: 30 * 1000, // 30秒自动刷新
  });
}

// 小时级聚合数据Hook
export function useHourlyStats(limit: number = 168) { // 一周的小时数
  return useQuery({
    queryKey: ['hourlyStats', limit],
    queryFn: async () => {
      const response = await request(SUBGRAPH_URL, HOURLY_STATS_QUERY, { first: limit }, HEADERS);
      return response.hourlyStats as HourlyStats[];
    },
    staleTime: 60 * 1000, // 1分钟
    refetchInterval: 60 * 1000, // 1分钟自动刷新
  });
}

// 所有充值记录（用于图表）
export function useAllDeposits(limit: number = 1000) {
  return useQuery({
    queryKey: ['allDeposits', limit],
    queryFn: async () => {
      try {
        const response = await request(SUBGRAPH_URL, ALL_DEPOSITS_QUERY, { first: limit }, HEADERS);
        console.log('All deposits response:', response);
        return response.depositeds as DepositEvent[];
      } catch (error) {
        console.warn('All deposits query failed:', error);
        return [];
      }
    },
    staleTime: 30 * 1000, // 30秒
    refetchInterval: 30 * 1000, // 30秒自动刷新
    retry: 1, // 重试一次
  });
}

// 图表数据处理Hook
export function useChartData(options: { timeRange: TimeRange; dataType: ChartDataType }) {
  const { timeRange, dataType } = options;
  
  // 根据时间范围选择合适的数据源
  const minuteStats = useMinuteStats(60);
  const hourlyStats = useHourlyStats(168);
  const allDeposits = useAllDeposits(1000);

  // 根据时间范围和数据类型选择数据
  const { data: rawData, isLoading, error } = (() => {
    switch (timeRange) {
      case '1H':
        return minuteStats;
      case '1D':
        return hourlyStats;
      case '7D':
      case '30D':
      case 'ALL':
        return allDeposits;
      default:
        return allDeposits;
    }
  })();

  // 处理数据
  const chartData: ChartDataPoint[] = (() => {
    if (!rawData || rawData.length === 0) return [];

    // 检查数据类型
    if ('depositNumber' in rawData[0]) {
      // DepositEvent 类型
      const deposits = rawData as DepositEvent[];
      return deposits.map(deposit => ({
        timestamp: parseInt(deposit.timestamp) * 1000,
        value: parseFloat(deposit.amount) / 1e18,
        label: `#${deposit.depositNumber}: ${formatAmount(deposit.amount)}`,
      }));
    } else {
      // MinuteStats 或 HourlyStats 类型
      const stats = rawData as (MinuteStats | HourlyStats)[];
      return stats.map(stat => {
        let value = 0;
        switch (dataType) {
          case 'cumulativeAmount':
            value = parseFloat(stat.cumulativeAmount) / 1e18;
            break;
          case 'cumulativeDeposits':
            value = parseInt(stat.cumulativeDeposits);
            break;
          case 'depositAmount':
            value = parseFloat(stat.depositAmount) / 1e18;
            break;
          case 'depositCount':
            value = parseInt(stat.depositCount);
            break;
        }
        return {
          timestamp: parseInt(stat.timestamp) * 1000,
          value,
          label: formatAmount(value.toString()),
        };
      }).reverse(); // 反转以按时间正序排列
    }
  })();

  return {
    data: chartData,
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}

// 实时数据Hook（组合多个查询）
export function useRealTimeData() {
  const recentDeposits = useRecentDeposits(5);

  return {
    recentDeposits: recentDeposits.data || [],
    loading: recentDeposits.isLoading,
    error: recentDeposits.error ? (recentDeposits.error as Error).message : null,
    isError: recentDeposits.isError,
  };
}

// 导出工具函数
export { formatAddress, formatAmount, formatTime };