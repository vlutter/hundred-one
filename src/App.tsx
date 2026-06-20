import { useCallback, useState } from 'react'
import { ConfigLoader } from './components/ConfigLoader/ConfigLoader'
import { GameView } from './components/GameView/GameView'
import { loadStoredConfig, saveConfig } from './utils/configStorage'
import type { GameConfig } from './types/game'

function App() {
  const [configEntry, setConfigEntry] = useState(() => loadStoredConfig())
  const [showLoader, setShowLoader] = useState(false)
  const [configKey, setConfigKey] = useState(0)

  const handleLoadConfig = useCallback((config: GameConfig, name: string) => {
    saveConfig(config, name)
    setConfigEntry({ config, name })
    setShowLoader(false)
    setConfigKey((key) => key + 1)
  }, [])

  const handleChangeConfig = useCallback(() => {
    setShowLoader(true)
  }, [])

  const handleCancelLoader = useCallback(() => {
    setShowLoader(false)
  }, [])

  if (!configEntry || showLoader) {
    return <ConfigLoader onLoad={handleLoadConfig} onCancel={configEntry ? handleCancelLoader : undefined} />
  }

  return (
    <GameView
      key={configKey}
      config={configEntry.config}
      configName={configEntry.name}
      onChangeConfig={handleChangeConfig}
    />
  )
}

export default App
