import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Signex - Trustless P2P Swap',
  description: 'Trustless peer-to-peer token swaps using atomic transactions. Direct wallet-to-wallet exchanges with EIP-712 signatures. No middleman. No escrow. No risk.',
  generator: 'v0.app',
  icons: {
    icon: '/signex-logo.jpg',
    apple: '/signex-logo.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@rainbow-me/rainbowkit@2.2.10/dist/index.css"
        />
      </head>
      <body className={`font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
