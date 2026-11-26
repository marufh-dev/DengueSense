import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import DistrictDetailPage from "./pages/DistrictDetailPage";
import CommunityReportsPage from "./pages/CommunityReportsPage";
import SubmitReportPage from "./pages/SubmitReportPage";
import ModerationPage from "./pages/ModerationPage";
import MyAlertsPage from "./pages/MyAlertsPage";
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/districts/:id"
            element={
              <ProtectedRoute>
                <DistrictDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <CommunityReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-report"
            element={
              <ProtectedRoute>
                <SubmitReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-alerts"
            element={
              <ProtectedRoute>
                <MyAlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/methodology"
            element={
              <ProtectedRoute>
                <MethodologyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <AboutPage />
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
        </Routes>
      </main>
    </div>
  );
}
