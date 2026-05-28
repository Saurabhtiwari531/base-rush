import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cookies } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { wagmiConfig } from '../lib/wagmi'
import { Providers } from './providers'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: "Base Rush",
  description: "Web3 Runner Game on Base",
  openGraph: {
    title: "Base Rush",
    description: "Web3 Endless Runner Game on Base",
    images: [{ url: "/base-rush-icon.png", width: 512, height: 512 }],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
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
    <html lang="en">
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
