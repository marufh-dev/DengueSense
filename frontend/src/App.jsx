import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import DistrictDetailPage from "./pages/DistrictDetailPage";
import CommunityReportsPage from "./pages/CommunityReportsPage";
import SubmitReportPage from "./pages/SubmitReportPage";
import ModerationPage from "./pages/ModerationPage";
import AdminPage from "./pages/AdminPage";
import MyAlertsPage from "./pages/MyAlertsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MethodologyPage from "./pages/MethodologyPage";
import NotFoundPage from "./pages/NotFoundPage";
import ErrorPage from "./pages/ErrorPage";

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
            path="/moderation"
            element={
              <ProtectedRoute allowedRoles={["moderator", "admin"]}>
                <ModerationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Error and 404 Pages */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/500" element={<ErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
