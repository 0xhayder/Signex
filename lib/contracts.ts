export const SIGNEX_CONTRACT_ADDRESS = '0xc04038114Fe5D8B838055ab77136544fF5881eb6' as const

export const SIGNEX_ABI = [
  {
    inputs: [{ components: [{ internalType: "address", name: "maker", type: "address" }, { internalType: "address", name: "taker", type: "address" }, { internalType: "address", name: "tokenA", type: "address" }, { internalType: "address", name: "tokenB", type: "address" }, { internalType: "uint256", name: "amountA", type: "uint256" }, { internalType: "uint256", name: "amountB", type: "uint256" }, { internalType: "uint256", name: "expiry", type: "uint256" }, { internalType: "uint256", name: "nonce", type: "uint256" }], internalType: "struct SignexAtomicSwap.Trade", name: "trade", type: "tuple" }],
    name: "cancelTrade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ components: [{ internalType: "address", name: "maker", type: "address" }, { internalType: "address", name: "taker", type: "address" }, { internalType: "address", name: "tokenA", type: "address" }, { internalType: "address", name: "tokenB", type: "address" }, { internalType: "uint256", name: "amountA", type: "uint256" }, { internalType: "uint256", name: "amountB", type: "uint256" }, { internalType: "uint256", name: "expiry", type: "uint256" }, { internalType: "uint256", name: "nonce", type: "uint256" }], internalType: "struct SignexAtomicSwap.Trade", name: "trade", type: "tuple" }, { internalType: "bytes", name: "signature", type: "bytes" }],
    name: "executeTrade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ components: [{ internalType: "address", name: "maker", type: "address" }, { internalType: "address", name: "taker", type: "address" }, { internalType: "address", name: "tokenA", type: "address" }, { internalType: "address", name: "tokenB", type: "address" }, { internalType: "uint256", name: "amountA", type: "uint256" }, { internalType: "uint256", name: "amountB", type: "uint256" }, { internalType: "uint256", name: "expiry", type: "uint256" }, { internalType: "uint256", name: "nonce", type: "uint256" }], internalType: "struct SignexAtomicSwap.Trade", name: "trade", type: "tuple" }],
    name: "getTradeHash",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "maker", type: "address" }, { internalType: "uint256", name: "nonce", type: "uint256" }],
    name: "isNonceUsed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "executedTrades",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const

export const ERC20_ABI = [
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  }
] as const

export const EIP712_DOMAIN = {
  name: 'SignexAtomicSwap',
  version: '1',
  chainId: 8453,
  verifyingContract: SIGNEX_CONTRACT_ADDRESS
} as const

export const TRADE_TYPES = {
  Trade: [
    { name: 'maker', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'tokenA', type: 'address' },
    { name: 'tokenB', type: 'address' },
    { name: 'amountA', type: 'uint256' },
    { name: 'amountB', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
    { name: 'nonce', type: 'uint256' }
  ]
} as const

export interface Trade {
  maker: `0x${string}`
  taker: `0x${string}`
  tokenA: `0x${string}`
  tokenB: `0x${string}`
  amountA: bigint
  amountB: bigint
  expiry: bigint
  nonce: bigint
}

export interface StoredTrade extends Omit<Trade, 'amountA' | 'amountB' | 'expiry' | 'nonce'> {
  id: string
  amountA: string
  amountB: string
  expiry: string
  nonce: string
  signature: string
  status: 'pending' | 'executed' | 'cancelled' | 'expired'
  createdAt: string
  tokenASymbol?: string
  tokenBSymbol?: string
  tokenADecimals?: number
  tokenBDecimals?: number
  tokenALogo?: string
  tokenBLogo?: string
}
