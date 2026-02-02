import React from 'react'
import { HashRouter } from 'react-router-dom'
import { reactDomCompat } from './utils/reactDomCompat'
import App from './App'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

reactDomCompat.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
  root
)
