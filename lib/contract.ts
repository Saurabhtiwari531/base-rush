export type LeaderboardEntry = {
  rank: number
  address: string
  score: number
  reward: string
}

// v2 leaderboard — season-based reset (truly resets to 0 each week), dedup top3,
// transferOwnership + score cap. Replaces 0x71e8…c6c1 whose resetLeaderboard()
// left per-wallet bests, so returning players couldn't get back on after a reset.
export const CONTRACT_ADDRESS = '0xf4f87e5f6c559084286a0c993379b1b6b8b7f9e6'

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
