export type LeaderboardEntry = {
  rank: number
  address: string
  score: number
  reward: string
}

export const CONTRACT_ADDRESS = '0xd1F19e198d74D7F43021599799D1e4a2A85Dcd40'

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
