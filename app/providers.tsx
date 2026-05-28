'use client'

import { WagmiProvider, type State } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig, queryClient } from '../lib/wagmi'

export function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode
  initialState?: State
}) {
  return (
    // initialState hydrates wagmi from the server-side cookie so the first
    // render matches — prevents the "wallet disconnected flash" on page load
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
