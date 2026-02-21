import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "./app/store.js";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: "Poppins, Inter, system-ui, sans-serif",
            fontSize: "14px",
            borderRadius: "8px",
            padding: "12px 18px",
            maxWidth: "420px",
          },
          success: {
            iconTheme: { primary: "#2a3a33", secondary: "#fff" },
            style: { background: "#f0faf1", color: "#1f1f1f", border: "1px solid #c8e6c9" },
          },
          error: {
            iconTheme: { primary: "#d32f2f", secondary: "#fff" },
            style: { background: "#fef2f2", color: "#1f1f1f", border: "1px solid #fecaca" },
            duration: 4000,
          },
        }}
      />
    </Provider>
  </StrictMode>
);
