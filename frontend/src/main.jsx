import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "@/app/providers";
import App from "@/App";
import "@/styles.css";
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const storedTheme = window.localStorage.getItem("nms-theme");
document.documentElement.setAttribute("data-theme", storedTheme === "light" ? "light" : "dark");
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode><AppProviders><BrowserRouter><App /></BrowserRouter></AppProviders></React.StrictMode>
);
