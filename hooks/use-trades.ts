"use client"

import { useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient, useReadContract, useWriteContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import useSWR, { mutate } from 'swr'
import { SIGNEX_CONTRACT_ADDRESS, SIGNEX_ABI, ERC20_ABI, EIP712_DOMAIN, TRADE_TYPES, type Trade, type StoredTrade } from '@/lib/contracts'

async function fetchTrades(address: string | undefined): Promise<StoredTrade[]> {
  if (!address) return []
  
  const res = await fetch(`/api/trades?address=${address.toLowerCase()}`)
  if (!res.ok) return []
  
  const data = await res.json()
  
  return data.trades.map((t: any) => ({
    id: t.id,
    maker: t.maker,
    taker: t.taker,
    tokenA: t.token_a,
    tokenB: t.token_b,
    amountA: t.amount_a,
    amountB: t.amount_b,
    expiry: t.expiry,
    nonce: t.nonce,
    signature: t.signature,
    status: t.status,
    createdAt: t.created_at,
    tokenASymbol: t.token_a_symbol,
    tokenBSymbol: t.token_b_symbol,
    tokenADecimals: t.token_a_decimals,
    tokenBDecimals: t.token_b_decimals,
    tokenALogo: t.token_a_logo,
    tokenBLogo: t.token_b_logo
  }))
}

export function useTrades() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { writeContractAsync } = useWriteContract()

  const { data: trades = [], isLoading, mutate: mutateTrades } = useSWR(
    address ? ['trades', address] : null,
    () => fetchTrades(address),
    { refreshInterval: 5000 }
  )

  const checkAllowance = useCallback(async (token: `0x${string}`, owner: `0x${string}`, amount: bigint) => {
    if (!publicClient) return false
    const allowance = await publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, SIGNEX_CONTRACT_ADDRESS]
    })
    return allowance >= amount
  }, [publicClient])

  const approveToken = useCallback(async (token: `0x${string}`, amount: bigint) => {
    if (!walletClient || !address) throw new Error('Wallet not connected')
    const hash = await writeContractAsync({
      address: token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [SIGNEX_CONTRACT_ADDRESS, amount]
    })
    await publicClient?.waitForTransactionReceipt({ hash })
    return hash
  }, [walletClient, address, writeContractAsync, publicClient])

  const createTrade = useCallback(async (params: {
    taker: `0x${string}`
    tokenA: `0x${string}`
    tokenB: `0x${string}`
    amountA: string
    amountB: string
    tokenADecimals: number
    tokenBDecimals: number
    tokenASymbol: string
    tokenBSymbol: string
    tokenALogo?: string
    tokenBLogo?: string
    expiryHours: number
  }) => {
    if (!walletClient || !address) throw new Error('Wallet not connected')

    const amountA = parseUnits(params.amountA, params.tokenADecimals)
    const amountB = parseUnits(params.amountB, params.tokenBDecimals)
    const expiry = BigInt(Math.floor(Date.now() / 1000) + params.expiryHours * 3600)
    const nonce = BigInt(Date.now())

    const trade: Trade = {
      maker: address,
      taker: params.taker,
      tokenA: params.tokenA,
      tokenB: params.tokenB,
      amountA,
      amountB,
      expiry,
      nonce
    }

    try {
      // Check and request approval
      const hasAllowance = await checkAllowance(params.tokenA, address, amountA)
      
      if (!hasAllowance) {
        await approveToken(params.tokenA, amountA)
      }

      // Sign EIP-712
      const signature = await walletClient.signTypedData({
        domain: EIP712_DOMAIN,
        types: TRADE_TYPES,
        primaryType: 'Trade',
        message: trade
      })

      // Store trade in Supabase
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maker: trade.maker,
          taker: trade.taker,
          tokenA: trade.tokenA,
          tokenB: trade.tokenB,
          amountA: amountA.toString(),
          amountB: amountB.toString(),
          expiry: expiry.toString(),
          nonce: nonce.toString(),
          signature,
          tokenASymbol: params.tokenASymbol,
          tokenBSymbol: params.tokenBSymbol,
          tokenADecimals: params.tokenADecimals,
          tokenBDecimals: params.tokenBDecimals,
          tokenALogo: params.tokenALogo,
          tokenBLogo: params.tokenBLogo
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(`Failed to store trade: ${errorData.error || res.statusText}`)
      }
      
      const { trade: storedTrade } = await res.json()
      mutateTrades()

      return {
        id: storedTrade.id,
        maker: storedTrade.maker,
        taker: storedTrade.taker,
        tokenA: storedTrade.token_a,
        tokenB: storedTrade.token_b,
        amountA: storedTrade.amount_a,
        amountB: storedTrade.amount_b,
        expiry: storedTrade.expiry,
        nonce: storedTrade.nonce,
        signature: storedTrade.signature,
        status: storedTrade.status,
        createdAt: storedTrade.created_at,
        tokenASymbol: storedTrade.token_a_symbol,
        tokenBSymbol: storedTrade.token_b_symbol,
        tokenADecimals: storedTrade.token_a_decimals,
        tokenBDecimals: storedTrade.token_b_decimals,
        tokenALogo: storedTrade.token_a_logo,
        tokenBLogo: storedTrade.token_b_logo
      }
    } catch (error) {
      throw error
    }
  }, [walletClient, address, checkAllowance, approveToken, mutateTrades])

  const executeTrade = useCallback(async (storedTrade: StoredTrade) => {
    if (!walletClient || !address || !publicClient) throw new Error('Wallet not connected')

    const trade: Trade = {
      maker: storedTrade.maker,
      taker: storedTrade.taker,
      tokenA: storedTrade.tokenA,
      tokenB: storedTrade.tokenB,
      amountA: BigInt(storedTrade.amountA),
      amountB: BigInt(storedTrade.amountB),
      expiry: BigInt(storedTrade.expiry),
      nonce: BigInt(storedTrade.nonce)
    }

    // Check taker allowance for tokenB
    const hasAllowance = await checkAllowance(storedTrade.tokenB, address, BigInt(storedTrade.amountB))
    if (!hasAllowance) {
      await approveToken(storedTrade.tokenB, BigInt(storedTrade.amountB))
    }

    const hash = await writeContractAsync({
      address: SIGNEX_CONTRACT_ADDRESS,
      abi: SIGNEX_ABI,
      functionName: 'executeTrade',
      args: [trade, storedTrade.signature as `0x${string}`]
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    // Check if transaction was successful
    if (receipt.status !== 'success') {
      throw new Error('Transaction failed on-chain')
    }

    // Update status in Supabase
    await fetch('/api/trades', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: storedTrade.id, status: 'executed' })
    })
    mutateTrades()

    return hash
  }, [walletClient, address, publicClient, checkAllowance, approveToken, writeContractAsync, mutateTrades])

  const cancelTrade = useCallback(async (storedTrade: StoredTrade) => {
    if (!walletClient || !address || !publicClient) throw new Error('Wallet not connected')

    const trade: Trade = {
      maker: storedTrade.maker,
      taker: storedTrade.taker,
      tokenA: storedTrade.tokenA,
      tokenB: storedTrade.tokenB,
      amountA: BigInt(storedTrade.amountA),
      amountB: BigInt(storedTrade.amountB),
      expiry: BigInt(storedTrade.expiry),
      nonce: BigInt(storedTrade.nonce)
    }

    const hash = await writeContractAsync({
      address: SIGNEX_CONTRACT_ADDRESS,
      abi: SIGNEX_ABI,
      functionName: 'cancelTrade',
      args: [trade]
    })

    await publicClient.waitForTransactionReceipt({ hash })

    // Update status in Supabase
    await fetch('/api/trades', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: storedTrade.id, status: 'cancelled' })
    })
    mutateTrades()

    return hash
  }, [walletClient, address, publicClient, writeContractAsync, mutateTrades])

  return {
    trades,
    isLoading,
    createTrade,
    executeTrade,
    cancelTrade,
    checkAllowance,
    approveToken,
    refresh: mutateTrades
  }
}

export function formatTradeAmount(amount: string, decimals: number = 18): string {
  return formatUnits(BigInt(amount), decimals)
}

export function getTimeRemaining(expiry: string): string {
  const exp = Number(expiry) * 1000
  const now = Date.now()
  const diff = exp - now
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
