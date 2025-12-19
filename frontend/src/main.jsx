import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppTask from './AppTask.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppTask />
  </StrictMode>,
)
