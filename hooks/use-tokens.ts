import useSWR, { preload } from 'swr'

export interface Token {
  id: string
  symbol: string
  name: string
  address: string
  logoUrl: string
  chainId: number
  decimals?: number
}

interface TokensResponse {
  tokens: Token[]
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

// Preload popular tokens on module load for instant display
if (typeof window !== 'undefined') {
  preload('/api/tokens?type=popular', fetcher)
}

export function useTokens(query: string = '', type: 'popular' | 'search' = 'popular') {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  params.set('type', type)
  
  const { data, error, isLoading } = useSWR<TokensResponse>(
    `/api/tokens?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      keepPreviousData: true,
      // Cache popular tokens longer
      revalidateIfStale: type === 'search',
    }
  )
  
  return {
    tokens: data?.tokens || [],
    isLoading,
    error,
  }
}

export function abbreviateAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getTokenDecimals(token: Token): number {
  // USDC on Base has 6 decimals
  if (token.address.toLowerCase() === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913') {
    return 6
  }
  return token.decimals || 18
}
