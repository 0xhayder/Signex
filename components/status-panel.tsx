"use client"

import React from "react"

import { CheckCircle2, XCircle, TrendingUp, Coins, ImageIcon } from "lucide-react"
import { useAccount } from "wagmi"
import { useTrades } from "@/hooks/use-trades"
import { abbreviateAddress } from "@/hooks/use-tokens"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <div className="rounded-2xl border-border/30 bg-secondary/20 p-6 transition-all hover:border-border/50 border-0">
      
      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

export function StatusPanel() {
  const { address } = useAccount()
  const { trades } = useTrades()

  // Calculate stats
  const totalTrades = trades.length
  const completedTrades = trades.filter(t => t.status === 'executed').length
  const cancelledTrades = trades.filter(t => t.status === 'cancelled').length
  const failedTrades = trades.filter(t => t.status === 'expired').length
  const successRate = totalTrades > 0 ? ((completedTrades / totalTrades) * 100).toFixed(1) : '0.0'
  
  // Count trade types (currently all are token trades, NFT trades would need a type field)
  const tokenTrades = trades.filter(t => t.tokenASymbol && t.tokenBSymbol).length
  const nftTrades = 0 // Future: trades.filter(t => t.type === 'nft').length

  return (
    <div className="w-full max-w-4xl">
      <div className="overflow-hidden rounded-xl border-border bg-card border-0">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-2xl font-semibold text-foreground">Profile Stats</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {address ? `Your trading statistics · ${abbreviateAddress(address)}` : 'Connect your wallet to view stats'}
          </p>
        </div>

        <div className="p-6">
          {/* Main Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Trades"
              value={totalTrades}
              icon={<TrendingUp className="text-primary w-4 h-4" />}
              description="All time"
            />
            <StatCard
              title="Successful"
              value={completedTrades}
              icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
              description="Completed trades"
            />
            <StatCard
              title="Failed/Expired"
              value={failedTrades}
              icon={<XCircle className="h-6 w-6 text-orange-500" />}
              description="Expired trades"
            />
          </div>

          {/* Secondary Stats */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border-border/30 bg-secondary/10 p-5 border-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{successRate}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {completedTrades} of {totalTrades} completed
              </p>
            </div>
            <div className="rounded-xl border-border/30 bg-secondary/10 p-5 border-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cancelled</span>
                
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{cancelledTrades}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                User cancelled
              </p>
            </div>
            <div className="rounded-xl border-border/30 bg-secondary/10 p-5 border-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {trades.filter(t => t.status === 'pending').length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Awaiting execution
              </p>
            </div>
          </div>

          {/* Trade Types */}
          <div className="mt-6 rounded-2xl border-border/30 bg-secondary/10 p-5 border-0">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Trade Types
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl bg-card/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Token Trades</p>
                    <p className="text-xs text-muted-foreground">ERC-20 swaps</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">{tokenTrades}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-card/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <ImageIcon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">NFT Trades</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">{nftTrades}</span>
              </div>
            </div>
          </div>

          {/* Achievement Banner */}
          {completedTrades >= 1 && (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {completedTrades >= 10 ? 'Veteran Trader' : completedTrades >= 5 ? 'Active Trader' : 'First Trade Complete'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {completedTrades >= 10 
                      ? 'You\'ve completed over 10 trades!' 
                      : completedTrades >= 5 
                      ? 'You\'ve completed 5+ trades!' 
                      : 'Congratulations on your first trade!'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
