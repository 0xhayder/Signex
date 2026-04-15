import useSWR from 'swr'
import type { Token } from './use-tokens'

export interface TokenWithBalance extends Token {
  balance: string
  balanceFormatted: string
  balanceUSD?: number
}

interface TokenBalancesResponse {
  tokens: TokenWithBalance[]
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

async function fetchTokenBalances(address: string): Promise<TokenWithBalance[]> {
  if (!address) return []

  try {
    const url = `/api/token-balances?address=${encodeURIComponent(address)}`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('[v0] Failed to fetch token balances:', response.statusText)
      return []
    }
    
    const data: TokenBalancesResponse = await response.json()
    return data.tokens || []
  } catch (error) {
    console.error('[v0] Failed to fetch token balances:', error)
    return []
  }
}

export function useTokenBalances(address: string | undefined) {
  const { data, error, isLoading } = useSWR(
    address ? `token-balances-${address}` : null,
    () => fetchTokenBalances(address!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
      keepPreviousData: true,
    }
  )

  return {
    tokens: data || [],
    isLoading,
    error,
  }
}
