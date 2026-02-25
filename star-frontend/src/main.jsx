import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { TimeProvider } from './context/TimeContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { I18nProvider } from './context/I18nContext.jsx'
import App from './App.jsx'


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <TimeProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </TimeProvider>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
