'use client'
import { useState, useEffect } from 'react'

export type SkinRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type Skin = {
  id: string
  name: string
  icon: string
  desc: string
  price: number             // 0 = free; ignored if unlock is set
  tint: number              // hex color applied to player sprite
  rarity: SkinRarity
  unlock?: 'free' | 'streak25'
}

export const SKINS: Skin[] = [
  {
    id: 'default', name: 'Basey', icon: '🤖',
    desc: 'The original blue mascot',
    price: 0, tint: 0xFFFFFF, rarity: 'common', unlock: 'free',
  },
  {
    id: 'gold', name: 'Golden Basey', icon: '🌟',
    desc: 'Shines like the prize pool',
    price: 500, tint: 0xFFD700, rarity: 'rare',
  },
  {
    id: 'pink', name: 'Neon Pink', icon: '💖',
    desc: 'Vaporwave aesthetic',
    price: 1200, tint: 0xFF44AA, rarity: 'epic',
  },
  {
    id: 'cosmic', name: 'Cosmic Basey', icon: '🌌',
    desc: 'Pulled from the void',
    price: 3000, tint: 0xB043FF, rarity: 'epic',
  },
  {
    id: 'dragon', name: 'Dragon Basey', icon: '🐉',
    desc: 'Day-25 streak exclusive',
    price: 0, tint: 0xFF3300, rarity: 'legendary', unlock: 'streak25',
  },
]

type SkinState = {
  owned: string[]
  equipped: string
}

const DEFAULT: SkinState = { owned: ['default'], equipped: 'default' }
const KEY = 'baserush.skins.v1'

export function useSkins() {
  const [state, setState] = useState<SkinState>(DEFAULT)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY)
      if (s) {
        const p = JSON.parse(s)
        setState({
          owned: Array.isArray(p.owned) && p.owned.length ? p.owned : ['default'],
          equipped: p.equipped || 'default',
        })
      }
    } catch (e) {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) {}
  }, [state, loaded])

  const isOwned = (id: string) => state.owned.includes(id)

  const claim = (id: string) => {
    if (state.owned.includes(id)) return
    setState(prev => ({ ...prev, owned: [...prev.owned, id] }))
  }

  const equip = (id: string) => {
    if (!state.owned.includes(id)) return
    setState(prev => ({ ...prev, equipped: id }))
  }

  const equippedSkin = SKINS.find(s => s.id === state.equipped) || SKINS[0]

  return {
    catalog: SKINS,
    owned: state.owned,
    equipped: state.equipped,
    equippedTint: equippedSkin.tint,
    equippedSkin,
    isOwned,
    claim,
    equip,
  }
}
