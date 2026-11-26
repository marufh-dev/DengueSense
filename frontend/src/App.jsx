import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import DistrictDetailPage from "./pages/DistrictDetailPage";
import CommunityReportsPage from "./pages/CommunityReportsPage";
import SubmitReportPage from "./pages/SubmitReportPage";
import ModerationPage from "./pages/ModerationPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MethodologyPage from "./pages/MethodologyPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <div>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/districts/:id" element={<DistrictDetailPage />} />
          <Route path="/reports" element={<CommunityReportsPage />} />
          <Route
            path="/submit-report"
            element={
              <ProtectedRoute>
                <SubmitReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moderation"
            element={
              <ProtectedRoute allowedRoles={["moderator", "admin"]}>
                <ModerationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  );
}
