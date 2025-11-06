import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";

import { wagmiAdapter, queryClient } from "./config/appkit";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider
          navigate={navigate}
          useHref={useHref}
        >
          {children}
        </HeroUIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
