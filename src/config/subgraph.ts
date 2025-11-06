// Subgraph 配置

export const SUBGRAPH_CONFIG = {
  // 本地开发环境
  local: {
    endpoint: 'http://localhost:8020/subgraphs/name/progressive-deposit',
    name: 'progressive-deposit-local'
  },
  
  // BSC 主网 (The Graph Studio)
  bsc: {
    endpoint: 'https://api.studio.thegraph.com/query/progressive-deposit/progressive-deposit/version/latest',
    name: 'progressive-deposit-bsc'
  },
  
  // BSC 测试网
  bscTestnet: {
    endpoint: 'https://api.studio.thegraph.com/query/progressive-deposit/progressive-deposit-testnet/version/latest',
    name: 'progressive-deposit-testnet'
  }
};

// 根据环境变量或网络选择端点
export function getSubgraphEndpoint(): string {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_SUBGRAPH_URL) {
    return process.env.NEXT_PUBLIC_SUBGRAPH_URL;
  }
  
  // 根据网络环境选择
  const network = process.env.NEXT_PUBLIC_NETWORK || 'local';
  
  switch (network) {
    case 'bsc':
      return SUBGRAPH_CONFIG.bsc.endpoint;
    case 'bscTestnet':
      return SUBGRAPH_CONFIG.bscTestnet.endpoint;
    case 'local':
    default:
      return SUBGRAPH_CONFIG.local.endpoint;
  }
}

// 获取网络信息
export function getNetworkInfo() {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'local';
  return {
    network,
    endpoint: getSubgraphEndpoint(),
    isLocal: network === 'local'
  };
}