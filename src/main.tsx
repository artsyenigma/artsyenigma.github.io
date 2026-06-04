import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const isAdmin = window.location.pathname.startsWith("/admin");

if (isAdmin) {
  import("./admin/Admin").then(({ default: Admin }) => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode><Admin /></React.StrictMode>
    );
  });
} else {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode><App /></React.StrictMode>
  );
}
