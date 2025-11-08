import { PROGRESSIVE_DEPOSIT_ABI as ProgressiveDepositABI } from './abi';

// 合约地址配置
export const CONTRACT_ADDRESSES = {
  bsc: '0x599374035c70e0cCA58D627e4Ef6adb694a3DE41', // BSC 测试网或主网
} as const;

// ERC20 代币地址配置 (示例，需要根据实际情况修改)
export const TOKEN_ADDRESSES = {
  bsc: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC
} as const;

// 合约 ABI
export const PROGRESSIVE_DEPOSIT_ABI = ProgressiveDepositABI;

// ERC20 标准 ABI (只包含需要的方法)
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  }
] as const;

// 获取当前网络的合约地址
export function getContractAddress(chainId?: number): string {
  // 默认返回 BSC 的地址
  return CONTRACT_ADDRESSES.bsc;
}

// 获取当前网络的代币地址
export function getTokenAddress(chainId?: number): string {
  // 默认返回 BSC 的 USDT 地址
  return TOKEN_ADDRESSES.bsc;
}

