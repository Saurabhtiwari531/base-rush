import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from './providers'

export const metadata: Metadata = {
  title: "Base Rush",
  description: "Web3 Runner Game on Base",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content="6a1553a25ef088574244918b" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}