// App entry point. Two layout shells:
//
// 1. Root layout (top bar + sidebar + content area):
//    - "/" — landing page (LandingContent)
//    - "/view/:projectId/:subsystemId?" — read-only project view
//
// 2. Editor layout (full-screen, no sidebar):
//    - "/edit/:projectId/:subsystemId?" — authenticated editor for a project
//    - "/sandbox" — anonymous editor with no project (local-only)
//
// The Editor and Root are separate top-level routes because the Editor uses a
// 3-column grid (filters | catalog | selection) that replaces the Root layout
// entirely. They share state through the Zustand store.
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useStore } from "./store";
import { setupSubscriptions } from "./store/subscriptions";
import ErrorBoundary from "./components/ErrorBoundary";
import Root from "./components/Root";
import LandingContent from "./components/LandingContent";
import ProjectView from "./components/ProjectView";
import Editor from "./components/Editor";
import "./index.css";
import "./styles.css";

// Run before React renders: wire auto-save subscriptions and restore JWT from
// Cognito's localStorage cache. This means the user sees content immediately
// on refresh instead of a flash of the login screen.
setupSubscriptions();
void useStore.getState().restoreSession();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary name="App">
      <BrowserRouter>
        <Routes>
          <Route element={<Root />}>
            <Route index element={<LandingContent />} />
            <Route
              path="/view/:projectId/:subsystemId?"
              element={
                <ErrorBoundary name="Project view">
                  <ProjectView />
                </ErrorBoundary>
              }
            />
          </Route>
          <Route
            path="/edit/:projectId/:subsystemId?"
            element={
              <ErrorBoundary name="Editor">
                <Editor />
              </ErrorBoundary>
            }
          />
          <Route
            path="/sandbox"
            element={
              <ErrorBoundary name="Sandbox">
                <Editor sandbox />
              </ErrorBoundary>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
