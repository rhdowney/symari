import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WebSocketProvider } from './context/WebSocketContext' // <-- 1. Import

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebSocketProvider> {/* <-- 2. Wrap your App component */}
      <App />
    </WebSocketProvider>
  </StrictMode>,
)