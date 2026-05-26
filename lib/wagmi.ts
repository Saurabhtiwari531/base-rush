import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors'
import { QueryClient } from '@tanstack/react-query'

// Public RPCs are fine for low traffic. For production load, set these env vars:
// NEXT_PUBLIC_RPC_SEPOLIA=https://base-sepolia.g.alchemy.com/v2/<key>
// NEXT_PUBLIC_RPC_BASE=https://base-mainnet.g.alchemy.com/v2/<key>
const sepoliaRpc = process.env.NEXT_PUBLIC_RPC_SEPOLIA
const baseRpc = process.env.NEXT_PUBLIC_RPC_BASE

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),                                    // auto-detects any browser wallet
    metaMask(),                                    // explicit MetaMask
    coinbaseWallet({ appName: 'Base Rush' }),      // Base app / Coinbase Wallet
  ],
  transports: {
    [baseSepolia.id]: sepoliaRpc ? http(sepoliaRpc) : http(),
    [base.id]: baseRpc ? http(baseRpc) : http(),
  },
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
})
