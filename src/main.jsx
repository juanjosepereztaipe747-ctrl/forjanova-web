import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { instalarInterceptor } from './api/client'

// Antes de montar nada: cualquier fetch de un componente ya sale con la
// renovación automática puesta.
instalarInterceptor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
