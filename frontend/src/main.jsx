import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from './store'
import { setupSubscriptions } from './store/subscriptions'
import App from './App.jsx'
import ProjectView from './components/ProjectView.jsx'
import './index.css'
import './styles.css'

// Bootstrap: restore session + wire up reactive subscriptions
setupSubscriptions()
useStore.getState().restoreSession()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/view/:projectId/:subsystemId?" element={<ProjectView />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
