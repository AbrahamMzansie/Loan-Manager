import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/Confirm";
import { initSync } from "./offline/sync";
import "./styles.css";

initSync();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </ConfirmProvider>
    </ToastProvider>
  </React.StrictMode>
);
