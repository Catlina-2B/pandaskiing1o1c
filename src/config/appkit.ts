import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bsc } from "viem/chains";
import { QueryClient } from "@tanstack/react-query";

// 创建查询客户端
export const queryClient = new QueryClient();

// Reown Cloud项目ID (需要在 https://cloud.reown.com 注册获取)
const projectId = "c529abdccac8e63d92a17d8c03e984ee";

// BSC网络配置
const networks = [bsc];

// 创建wagmi适配器
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false, // 如果使用SSR则设为true
});

// 创建AppKit实例
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: "PandaSkiing",
    description: "Trading platform for crypto podcasts",
    url: "https://pandaskiing.com",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
  },
  features: {
    analytics: true, // 可选: 启用分析
  },
});
