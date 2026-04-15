import { NextResponse } from 'next/server'

export interface Token {
  id: string
  symbol: string
  name: string
  address: string
  logoUrl: string
  chainId: number
  decimals?: number
}

// Popular Base tokens with verified contract addresses and official logos
const POPULAR_BASE_TOKENS: Token[] = [
  {
    id: 'usd-coin',
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
    chainId: 8453,
    decimals: 6,
  },
  {
    id: 'dai',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    logoUrl: 'https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png',
    chainId: 8453,
  },
  {
    id: 'wrapped-bitcoin',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c',
    logoUrl: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
    chainId: 8453,
  },
  {
    id: 'coinbase-wrapped-staked-eth',
    symbol: 'cbETH',
    name: 'Coinbase Wrapped Staked ETH',
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    logoUrl: 'https://assets.coingecko.com/coins/images/27008/large/cbeth.png',
    chainId: 8453,
  },
  {
    id: 'aerodrome-finance',
    symbol: 'AERO',
    name: 'Aerodrome Finance',
    address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    logoUrl: 'https://assets.coingecko.com/coins/images/31745/large/token.png',
    chainId: 8453,
  },
  {
    id: 'degen-base',
    symbol: 'DEGEN',
    name: 'Degen',
    address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
    logoUrl: 'https://assets.coingecko.com/coins/images/34515/large/android-chrome-512x512.png',
    chainId: 8453,
  },
  {
    id: 'wrapped-eth',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x4200000000000000000000000000000000000006',
    logoUrl: 'https://assets.coingecko.com/coins/images/2518/large/weth.png',
    chainId: 8453,
  },
  {
    id: 'uniswap',
    symbol: 'UNI',
    name: 'Uniswap',
    address: '0xc3De830EA07524a0761646a6a4e4be0e114a3C83',
    logoUrl: 'https://assets.coingecko.com/coins/images/12504/large/uni.jpg',
    chainId: 8453,
  },
]

async function searchCoinGecko(query: string): Promise<Token[]> {
  try {
    // Minimum query length to avoid unnecessary API calls
    if (query.length < 2) return []
    
    // Search CoinGecko for tokens on Base
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    const searchResponse = await fetch(searchUrl, {
      headers: { 'accept': 'application/json' },
      next: { revalidate: 60 }
    })
    
    // Silently handle rate limits and errors
    if (searchResponse.status === 429 || !searchResponse.ok) {
      return []
    }
    
    const searchData = await searchResponse.json()
    const coins = searchData.coins?.slice(0, 3) || [] // Only fetch top 3
    
    // Get contract addresses for Base chain (platform id: base)
    const tokens: Token[] = []
    
    for (const coin of coins) {
      try {
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const detailUrl = `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`
        const detailResponse = await fetch(detailUrl, {
          headers: { 'accept': 'application/json' },
          next: { revalidate: 300 }
        })
        
        // Stop on rate limit or error
        if (detailResponse.status === 429 || !detailResponse.ok) break
        
        const detail = await detailResponse.json()
        const baseAddress = detail.platforms?.base
        
        if (baseAddress) {
          tokens.push({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            address: baseAddress,
            logoUrl: coin.thumb || coin.large || '',
            chainId: 8453,
          })
        }
      } catch {
        continue
      }
      
      // Stop early if we have enough tokens
      if (tokens.length >= 2) break
    }
    
    return tokens
  } catch {
    // Silently handle all errors without logging
    return []
  }
}

async function searchDexScreener(query: string): Promise<Token[]> {
  try {
    // DexScreener requires minimum 3 characters for search
    if (query.length < 3) return []
    
    const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url, { next: { revalidate: 60 } })
    
    // Silently handle errors (rate limits, bad requests, etc.)
    if (!response.ok) return []
    
    const data = await response.json()
    const pairs = data.pairs?.filter((p: { chainId: string }) => p.chainId === 'base') || []
    
    const tokens: Token[] = []
    const seenAddresses = new Set<string>()
    
    for (const pair of pairs) {
      // Add base token
      if (pair.baseToken && !seenAddresses.has(pair.baseToken.address.toLowerCase())) {
        seenAddresses.add(pair.baseToken.address.toLowerCase())
        tokens.push({
          id: pair.baseToken.address,
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          address: pair.baseToken.address,
          logoUrl: pair.info?.imageUrl || '',
          chainId: 8453,
        })
      }
      
      if (tokens.length >= 15) break
    }
    
    return tokens
  } catch {
    // Silently handle errors without logging to console
    return []
  }
}

function deduplicateTokens(tokens: Token[]): Token[] {
  const tokenMap = new Map<string, Token>()
  
  for (const token of tokens) {
    const key = token.address.toLowerCase()
    
    // Filter out native ETH (0x0000...0000 or 0xeeee...eeee patterns)
    if (key === '0x0000000000000000000000000000000000000000' || 
        key === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
        token.symbol.toUpperCase() === 'ETH' && !token.name.toLowerCase().includes('wrapped')) {
      continue
    }
    
    const existing = tokenMap.get(key)
    
    // Prefer token with more complete info (has logo, proper name)
    if (!existing) {
      tokenMap.set(key, token)
    } else {
      const existingScore = (existing.logoUrl ? 2 : 0) + (existing.name.length > existing.symbol.length ? 1 : 0)
      const newScore = (token.logoUrl ? 2 : 0) + (token.name.length > token.symbol.length ? 1 : 0)
      
      if (newScore > existingScore) {
        tokenMap.set(key, token)
      }
    }
  }
  
  return Array.from(tokenMap.values())
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || ''
  const type = searchParams.get('type') || 'popular' // popular | search
  
  try {
    if (type === 'popular' || !query) {
      return NextResponse.json({ tokens: POPULAR_BASE_TOKENS })
    }
    
    // Check if query is a contract address
    const isAddress = query.startsWith('0x') && query.length === 42
    
    if (isAddress) {
      // Search by contract address
      const dexTokens = await searchDexScreener(query)
      const found = dexTokens.find(t => t.address.toLowerCase() === query.toLowerCase())
      
      if (found) {
        return NextResponse.json({ tokens: [found] })
      }
      
      // Return as unknown token with the address
      return NextResponse.json({
        tokens: [{
          id: query,
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          address: query,
          logoUrl: '',
          chainId: 8453,
        }]
      })
    }
    
    // Search by name/symbol
    // Filter popular tokens that match the query
    const matchingPopular = POPULAR_BASE_TOKENS.filter(t =>
      t.symbol.toLowerCase().includes(query.toLowerCase()) ||
      t.name.toLowerCase().includes(query.toLowerCase())
    )
    
    // Primary: DexScreener (no rate limits for Base chain)
    const dexScreenerTokens = await searchDexScreener(query)
    
    // Fallback: CoinGecko (only if we need more results and query is long enough)
    let coinGeckoTokens: Token[] = []
    if (query.length >= 3 && matchingPopular.length + dexScreenerTokens.length < 8) {
      coinGeckoTokens = await searchCoinGecko(query)
    }
    
    // Combine and deduplicate, prioritizing: popular > dexscreener > coingecko
    const allTokens = [...matchingPopular, ...dexScreenerTokens, ...coinGeckoTokens]
    const uniqueTokens = deduplicateTokens(allTokens)
    
    return NextResponse.json({ tokens: uniqueTokens.slice(0, 20) })
  } catch {
    // Silently fallback to popular tokens on any error
    return NextResponse.json({ tokens: POPULAR_BASE_TOKENS })
  }
}
