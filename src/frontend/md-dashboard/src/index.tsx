import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Initialize mock server in development mode BEFORE React renders
if (process.env.NODE_ENV === 'development') {
  console.log("[MD Dashboard] Setting up mock server before React initialization...");
  const { setupMockServer } = require('./api/mockServer');
  setupMockServer();
  console.log("[MD Dashboard] Mock server initialized for development");
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
