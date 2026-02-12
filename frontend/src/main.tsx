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

// Bootstrap: restore session + wire up reactive subscriptions
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
