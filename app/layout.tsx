import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { wagmiConfig } from '../lib/wagmi'
import { Providers } from './providers'
import { Analytics } from '@vercel/analytics/react'

// Display font — modern, geometric, techy yet highly readable (used app-wide)
const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})
// Monospace — wallet addresses, tx hashes, numeric readouts
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono-game',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://baserush.fun'),
  title: "Base Rush",
  description: "Web3 Runner Game on Base",
  openGraph: {
    title: "Base Rush — On-Chain Endless Runner",
    description: "Run, jump, collect coins & save your score on Base blockchain. Play free at baserush.fun",
    url: "https://baserush.fun",
    siteName: "Base Rush",
    images: [{ url: "/base-rush-icon.png?v=2", width: 512, height: 512, alt: "Base Rush Game" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Base Rush — On-Chain Endless Runner",
    description: "Run, jump, collect coins & save your score on Base blockchain 🤖⚡",
    images: ["https://baserush.fun/base-rush-icon.png?v=2"],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
  colorScheme: 'dark',
  // 'cover' lets the game paint under the notch / home-indicator; the UI then
  // pads itself back in with env(safe-area-inset-*) so nothing gets obscured.
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read wagmi state from cookie on the server — passed to WagmiProvider as
  // initialState so the first client render matches (no hydration mismatch)
  const cookieStore = await cookies()
  const initialState = cookieToInitialState(
    wagmiConfig,
    cookieStore.get('wagmi.store')?.value
  )

  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <head>
        {/* Required for Base app store listing */}
        <meta name="base:app_id" content="6a1553a25ef088574244918b" />
      </head>
      <body>
        <Providers initialState={initialState}>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
