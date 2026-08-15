import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireSession } from "./components/RequireSession";
import { AnalysisDetail } from "./pages/AnalysisDetail";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { NewAnalysis } from "./pages/NewAnalysis";
import { Report } from "./pages/Report";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireSession>
            <AppShell />
          </RequireSession>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="new" element={<NewAnalysis />} />
        <Route path="analyses/:id" element={<AnalysisDetail />} />
        <Route path="analyses/:id/report" element={<Report />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
