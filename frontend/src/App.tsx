import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AwarenessPage from "./pages/AwarenessPage";
import DashboardPage from "./pages/DashboardPage";
import HistoricalPage from "./pages/HistoricalPage";
import HubPage from "./pages/HubPage";
import SettingsPage from "./pages/SettingsPage";

export default function App(): JSX.Element {
  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/historical" element={<HistoricalPage />} />
        <Route path="/awareness" element={<AwarenessPage />} />
        <Route path="/hub" element={<HubPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
