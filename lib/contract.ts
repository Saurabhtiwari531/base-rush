export type LeaderboardEntry = {
  rank: number
  address: string
  score: number
  reward: string
}

export const CONTRACT_ADDRESS = '0x71e8F01ec255E50Fa0143E0675b8B0dcC02cb6c1'

export const CONTRACT_ABI = [
  {
    name: 'submitScore',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_score', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'getTop3',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'first', type: 'address' },
      { name: 'score1', type: 'uint256' },
      { name: 'second', type: 'address' },
      { name: 'score2', type: 'uint256' },
      { name: 'third', type: 'address' },
      { name: 'score3', type: 'uint256' },
    ]
  }
] as const
