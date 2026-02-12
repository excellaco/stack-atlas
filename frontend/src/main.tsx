import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useStore } from "./store";
import { setupSubscriptions } from "./store/subscriptions";
import Root from "./components/Root";
import LandingContent from "./components/LandingContent";
import ProjectView from "./components/ProjectView";
import Editor from "./components/Editor";
import "./index.css";
import "./styles.css";

// Bootstrap: restore session + wire up reactive subscriptions
setupSubscriptions();
void useStore.getState().restoreSession();

ReactDOM.createRoot(document.getElementById("root")!).render(
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
);
