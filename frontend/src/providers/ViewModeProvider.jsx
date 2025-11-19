import { createContext, useContext, useMemo, useState } from 'react'

const ViewModeContext = createContext(null)

export function ViewModeProvider({ children }) {
  const [mode, setMode] = useState('source')

  const value = useMemo(() => ({ mode, setMode }), [mode])

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
}

export function useViewMode() {
  const context = useContext(ViewModeContext)
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider')
  }
  return context
}


