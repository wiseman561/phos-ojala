import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { setupMockServer } from "./api/mockServer";

// Initialize mock server globally
setupMockServer();
console.log("[MD Dashboard] Mock server initialized globally");

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
