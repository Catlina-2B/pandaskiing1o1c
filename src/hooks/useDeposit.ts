import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { 
  getContractAddress, 
  getTokenAddress, 
  PROGRESSIVE_DEPOSIT_ABI,
  ERC20_ABI 
} from '@/config/contract';

export function useDeposit() {
  const { address, chainId } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = getContractAddress(chainId);
  const tokenAddress = getTokenAddress(chainId);

  // 写入合约的 hooks
  const { writeContractAsync } = useWriteContract();

  // 读取下一次充值所需金额
  const { 
    data: nextDepositAmount, 
    refetch: refetchNextAmount,
    isLoading: isLoadingNextAmount,
    error: nextAmountError 
  } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PROGRESSIVE_DEPOSIT_ABI,
    functionName: 'getNextDepositAmount',
  });

  console.log('nextDepositAmount', nextDepositAmount);

  // 读取已完成的充值次数
  const { data: depositCount, refetch: refetchDepositCount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PROGRESSIVE_DEPOSIT_ABI,
    functionName: 'depositCount',
  });

  // 读取总充值金额
  const { data: totalDeposited, refetch: refetchTotalDeposited } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PROGRESSIVE_DEPOSIT_ABI,
    functionName: 'totalDeposited',
  });

  // 读取合约余额
  const { data: contractBalance, refetch: refetchContractBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PROGRESSIVE_DEPOSIT_ABI,
    functionName: 'getBalance',
  });

  // 读取用户的代币余额
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // 读取用户已授权的额度
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && contractAddress ? [address, contractAddress] : undefined,
  });

  // 授权代币
  const approveToken = async (amount: bigint) => {
    if (!address) {
      throw new Error('请先连接钱包');
    }

    setIsApproving(true);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddress, amount],
      } as any);

      // 等待交易确认
      console.log('授权交易已发送:', hash);
      
      // 刷新授权额度
      await refetchAllowance();
      
      return hash;
    } catch (err: any) {
      const errorMsg = err.message || '授权失败';
      setError(errorMsg);
      throw err;
    } finally {
      setIsApproving(false);
    }
  };

  // 充值
  const deposit = async () => {
    if (!address) {
      throw new Error('请先连接钱包');
    }

    // 检查是否还在加载
    if (isLoadingNextAmount) {
      throw new Error('正在加载充值金额信息，请稍候...');
    }

    // 检查是否有读取错误
    if (nextAmountError) {
      console.error('读取充值金额失败:', nextAmountError);
      throw new Error(`读取充值金额失败: ${nextAmountError.message || '未知错误'}`);
    }

    // 检查充值金额是否已设置
    if (!nextDepositAmount || nextDepositAmount === 0n) {
      throw new Error('合约还未设置充值金额，请联系管理员配置充值序列');
    }

    setIsDepositing(true);
    setError(null);

    try {
      // 检查余额
      if (tokenBalance && BigInt(tokenBalance.toString()) < BigInt(nextDepositAmount.toString())) {
        throw new Error('代币余额不足');
      }

      // 检查授权额度
      const requiredAmount = BigInt(nextDepositAmount.toString());
      const currentAllowance = allowance ? BigInt(allowance.toString()) : BigInt(0);

      if (currentAllowance < requiredAmount) {
        // 需要授权
        console.log('需要授权，正在请求授权...');
        await approveToken(requiredAmount);
      }

      // 执行充值
      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: PROGRESSIVE_DEPOSIT_ABI,
        functionName: 'deposit',
      } as any);

      console.log('充值交易已发送:', hash);

      // 刷新数据
      await Promise.all([
        refetchNextAmount(),
        refetchBalance(),
        refetchAllowance(),
        refetchDepositCount(),
        refetchTotalDeposited(),
        refetchContractBalance(),
      ]);

      return hash;
    } catch (err: any) {
      const errorMsg = err.message || '充值失败';
      setError(errorMsg);
      throw err;
    } finally {
      setIsDepositing(false);
    }
  };

  return {
    deposit,
    isApproving,
    isDepositing,
    isLoading: isApproving || isDepositing || isLoadingNextAmount,
    isLoadingNextAmount,
    error,
    nextDepositAmount: nextDepositAmount ? BigInt(nextDepositAmount.toString()) : null,
    tokenBalance: tokenBalance ? BigInt(tokenBalance.toString()) : null,
    allowance: allowance ? BigInt(allowance.toString()) : null,
    depositCount: depositCount ? BigInt(depositCount.toString()) : null,
    totalDeposited: totalDeposited ? BigInt(totalDeposited.toString()) : null,
    contractBalance: contractBalance ? BigInt(contractBalance.toString()) : null,
    nextAmountError: nextAmountError?.message || null,
    refetch: () => {
      refetchNextAmount();
      refetchBalance();
      refetchAllowance();
      refetchDepositCount();
      refetchTotalDeposited();
      refetchContractBalance();
    }
  };
}

