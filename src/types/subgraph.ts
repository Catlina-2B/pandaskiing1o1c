// Subgraph数据类型定义

export interface GlobalStats {
  id: string;
  totalDeposits: string;
  totalAmount: string;
  totalWithdrawn: string;
  uniqueDepositors: string;
  lastDepositTimestamp: string;
  lastUpdateTimestamp: string;
}

export interface MinuteStats {
  id: string;
  timestamp: string;
  depositCount: string;
  depositAmount: string;
  withdrawAmount: string;
  uniqueDepositors: string;
  cumulativeDeposits: string;
  cumulativeAmount: string;
}

export interface HourlyStats {
  id: string;
  timestamp: string;
  depositCount: string;
  depositAmount: string;
  withdrawAmount: string;
  uniqueDepositors: string;
  cumulativeDeposits: string;
  cumulativeAmount: string;
}

export interface DailyStats {
  id: string;
  timestamp: string;
  depositCount: string;
  depositAmount: string;
  withdrawAmount: string;
  uniqueDepositors: string;
  cumulativeDeposits: string;
  cumulativeAmount: string;
}

export interface UserStats {
  id: string;
  totalDeposits: string;
  totalAmount: string;
  firstDepositTimestamp: string;
  lastDepositTimestamp: string;
}

export interface DepositEvent {
  id: string;
  depositor: string;
  amount: string;
  depositNumber: string;
  timestamp: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface WithdrawEvent {
  id: string;
  admin: string;
  amount: string;
  timestamp: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface DepositAmountSetEvent {
  id: string;
  depositNumber: string;
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

// 图表数据点
export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

// 时间范围类型
export type TimeRange = '1H' | '1D' | '7D' | '30D' | 'ALL';

// 图表数据类型
export type ChartDataType = 'cumulativeAmount' | 'cumulativeDeposits' | 'depositCount' | 'depositAmount';

// 查询选项
export interface QueryOptions {
  timeRange: TimeRange;
  dataType: ChartDataType;
  aggregation?: 'minute' | 'hourly' | 'daily';
}

// API响应类型
export interface SubgraphResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
  }>;
}