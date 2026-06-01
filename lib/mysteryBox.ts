// Day-25 Mystery Box — all rewards are in-game (zero real-money cost).
// Each reward has a weight; rollReward() picks one weighted-randomly.

export type BoxRewardType = 'coins' | 'skin' | 'boost' | 'badge'
export type BoxRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type BoxReward = {
  id: string
  type: BoxRewardType
  icon: string
  label: string
  desc: string
  rarity: BoxRarity
  weight: number
  amount?: number // coins
}

export const BOX_REWARDS: BoxReward[] = [
  { id: 'coins_2500',  type: 'coins', amount: 2500,  icon: '🪙', label: '2,500 Coins',  desc: 'Straight to your wallet',          rarity: 'common',    weight: 26 },
  { id: 'coins_6000',  type: 'coins', amount: 6000,  icon: '🪙', label: '6,000 Coins',  desc: 'A tidy bag of coins',             rarity: 'common',    weight: 22 },
  { id: 'boost_10',    type: 'boost',                icon: '✨', label: '+10% Score Boost', desc: 'Permanent — every run scores more', rarity: 'uncommon', weight: 18 },
  { id: 'skin_champion', type: 'skin',               icon: '🏆', label: 'Champion Skin', desc: 'Box-exclusive golden champion',   rarity: 'rare',      weight: 16 },
  { id: 'coins_15000', type: 'coins', amount: 15000, icon: '💎', label: '15,000 Coins MEGA', desc: 'Jackpot coin drop!',          rarity: 'rare',      weight: 12 },
  { id: 'badge_legend', type: 'badge',               icon: '👑', label: '25-Day Legend', desc: 'Rare prestige badge on your profile', rarity: 'legendary', weight: 6 },
]

export function rollReward(): BoxReward {
  const total = BOX_REWARDS.reduce((s, r) => s + r.weight, 0)
  let roll = Math.random() * total
  for (const r of BOX_REWARDS) {
    roll -= r.weight
    if (roll <= 0) return r
  }
  return BOX_REWARDS[0]
}

export function getRewardById(id: string | null): BoxReward | null {
  if (!id) return null
  return BOX_REWARDS.find(r => r.id === id) ?? null
}

export const RARITY_COLOR: Record<BoxRarity, string> = {
  common: '#88AACC',
  uncommon: '#00D8A0',
  rare: '#00C8FF',
  legendary: '#FFD700',
}
