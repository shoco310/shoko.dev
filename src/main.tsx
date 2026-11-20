import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './ui.css'
import { initAnalytics } from './analytics'

// Before React renders, so GA is never loaded when landing on the submission page.
initAnalytics()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
