import { createConfig, createStorage, cookieStorage, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { QueryClient } from '@tanstack/react-query'

// Public RPCs are fine for low traffic. For production load, set these env vars:
// NEXT_PUBLIC_RPC_SEPOLIA=https://base-sepolia.g.alchemy.com/v2/<key>
// NEXT_PUBLIC_RPC_BASE=https://base-mainnet.g.alchemy.com/v2/<key>
const sepoliaRpc = process.env.NEXT_PUBLIC_RPC_SEPOLIA
const baseRpc = process.env.NEXT_PUBLIC_RPC_BASE

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(), // auto-detects the in-app/browser-extension wallet (Base App, MetaMask, Coinbase, etc.)
  ],
  // SSR: persist wallet state in cookies so server & client agree on first render
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: baseRpc ? http(baseRpc) : http('https://mainnet.base.org'),
    [baseSepolia.id]: sepoliaRpc ? http(sepoliaRpc) : http(),
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
