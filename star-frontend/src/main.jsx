import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { TimeProvider } from './context/TimeContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import App from './App.jsx'


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TimeProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </TimeProvider>
  </React.StrictMode>,
)
