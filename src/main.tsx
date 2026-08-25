import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { applyBrandFavicon } from "./lib/brand";

/* Если в public/ есть реальный logo.svg/logo.png — подхватываем его как favicon */
applyBrandFavicon();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
