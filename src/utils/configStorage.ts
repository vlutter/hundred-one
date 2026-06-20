import type { GameConfig } from '../types/game'
import { CONFIG_NAME_STORAGE_KEY, CONFIG_STORAGE_KEY, STORAGE_KEY } from '../types/game'
import { validateGameConfig } from './validateConfig'

export interface StoredConfigEntry {
  config: GameConfig
  name: string
}

export function loadStoredConfig(): StoredConfigEntry | null {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as unknown
    const result = validateGameConfig(parsed)
    if (!result.ok) {
      localStorage.removeItem(CONFIG_STORAGE_KEY)
      localStorage.removeItem(CONFIG_NAME_STORAGE_KEY)
      return null
    }

    return {
      config: result.config,
      name: localStorage.getItem(CONFIG_NAME_STORAGE_KEY) ?? 'Загруженный конфиг',
    }
  } catch {
    return null
  }
}

export function saveConfig(config: GameConfig, name: string): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
  localStorage.setItem(CONFIG_NAME_STORAGE_KEY, name)
  localStorage.removeItem(STORAGE_KEY)
}

export function clearStoredConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY)
  localStorage.removeItem(CONFIG_NAME_STORAGE_KEY)
  localStorage.removeItem(STORAGE_KEY)
}
