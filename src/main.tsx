import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { migrateLegacyStorage } from './shared/lib/storage'

// Data saved before the keys were namespaced moves over once, before anything reads it.
migrateLegacyStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
