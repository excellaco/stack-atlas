import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from './store'
import { setupSubscriptions } from './store/subscriptions'
import Root from './components/Root.jsx'
import LandingContent from './components/LandingContent.jsx'
import ProjectView from './components/ProjectView.jsx'
import Editor from './components/Editor.jsx'
import './index.css'
import './styles.css'

// Bootstrap: restore session + wire up reactive subscriptions
setupSubscriptions()
useStore.getState().restoreSession()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Root />}>
          <Route index element={<LandingContent />} />
          <Route path="/view/:projectId/:subsystemId?" element={<ProjectView />} />
        </Route>
        <Route path="/edit/:projectId/:subsystemId?" element={<Editor />} />
        <Route path="/sandbox" element={<Editor sandbox />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
