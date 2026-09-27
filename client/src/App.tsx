import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppDataProvider } from "./i18n";
import { ToastProvider } from "./components/Toast";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { AreaPage } from "./pages/AreaPage";
import { Overview } from "./pages/Overview";
import { StationPage } from "./pages/StationPage";
import { Logs } from "./pages/Logs";
import { Statistics } from "./pages/Statistics";
import { Settings } from "./pages/Settings";

// A data router is required for useBlocker (unsaved-changes prompt in Settings).
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "areas/:areaId", element: <AreaPage /> },
      { path: "overview", element: <Overview /> },
      { path: "stations/:workcenterId", element: <StationPage /> },
      { path: "logs", element: <Logs /> },
      { path: "statistics", element: <Statistics /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

export default function App() {
  return (
    <AppDataProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AppDataProvider>
  );
}
