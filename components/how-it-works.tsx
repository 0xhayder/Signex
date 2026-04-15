"use client"

import { Wallet, FileSignature, Repeat, CheckCircle, ArrowRight, Shield, Zap, Users } from "lucide-react"

const STEPS = [
  {
    number: "01",
    title: "Connect Wallet",
    description: "Connect your Web3 wallet using RainbowKit to start creating trades on Base network.",
    icon: Wallet,
  },
  {
    number: "02",
    title: "Create & Sign Trade",
    description: "Set token amounts and counterparty address. Sign the trade with your wallet using EIP-712 signature.",
    icon: FileSignature,
  },
  {
    number: "03",
    title: "Share Trade Link",
    description: "Your signed trade is stored in the database. The counterparty can view it in their ongoing trades.",
    icon: Repeat,
  },
  {
    number: "04",
    title: "Execute Atomic Swap",
    description: "Counterparty approves tokens and executes the swap. Both tokens exchange atomically on-chain.",
    icon: CheckCircle,
  },
]

const FEATURES = [
  {
    title: "Signature-Based",
    description: "Uses EIP-712 signatures. No tokens locked until execution.",
    icon: Shield,
  },
  {
    title: "Atomic Swap",
    description: "Tokens exchange simultaneously in one transaction.",
    icon: Zap,
  },
  {
    title: "Direct P2P",
    description: "Trade with anyone using their wallet address.",
    icon: Users,
  },
]

export function HowItWorksPanel() {
  return (
    <div className="w-full max-w-4xl">
      <div className="overflow-hidden rounded-xl border-border bg-card border-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-xl font-semibold text-foreground">How It Works</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Simple, secure, and trustless P2P trading in 4 easy steps
          </p>
        </div>

        <div className="p-6">
          {/* Steps */}
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-8 top-10 hidden h-[calc(100%-80px)] w-px bg-gradient-to-b from-primary via-primary/50 to-transparent lg:block" />
            
            <div className="grid gap-6 lg:gap-8">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.number} className="flex gap-4 lg:gap-6">
                    <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-primary">{step.number}</span>
                        <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className="hidden items-center lg:flex">
                        <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-border/30" />

          {/* Features */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Why Choose Signex
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border bg-secondary/20 p-5 transition-all hover:border-primary/30 hover:bg-secondary/30 border-transparent border-transparent"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground">{feature.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 rounded-2xl border-primary/20 bg-primary/5 p-5 border-0">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">How It Works</h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  When you create a trade, you sign an EIP-712 message containing the trade details (tokens, amounts, expiry). 
                  No tokens are transferred or locked at this stage. The signature and trade data are stored in Supabase database. 
                  When the counterparty executes, they call the smart contract with your signature, which verifies it and performs 
                  an atomic swap - both token transfers happen in a single transaction. If the trade expires, the signature becomes invalid.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
