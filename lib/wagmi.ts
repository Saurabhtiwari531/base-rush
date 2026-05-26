import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, metaMask, injected } from 'wagmi/connectors'
import { QueryClient } from '@tanstack/react-query'

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    coinbaseWallet({ appName: 'Base Rush' }),
    metaMask(),
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
})

export const queryClient = new QueryClient()
