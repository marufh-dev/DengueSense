import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import PageSkeleton from "./components/PageSkeleton";
import AtmosphericParticles from "./components/AtmosphericParticles";

// Lazy-loaded routes for ultra-fast initial bundle loading
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const DistrictDetailPage = lazy(() => import("./pages/DistrictDetailPage"));
const CommunityReportsPage = lazy(() => import("./pages/CommunityReportsPage"));
const SubmitReportPage = lazy(() => import("./pages/SubmitReportPage"));
const TriagePage = lazy(() => import("./pages/TriagePage"));
const PreventionPage = lazy(() => import("./pages/PreventionPage"));
const ModerationPage = lazy(() => import("./pages/ModerationPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const MyAlertsPage = lazy(() => import("./pages/MyAlertsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const MethodologyPage = lazy(() => import("./pages/MethodologyPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));

export default function App() {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "var(--bg-canvas)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Dynamic atmospheric particle field */}
      <AtmosphericParticles />

      {/* Floating ambient glow meshes */}
      <div className="ambient-mesh ambient-mesh-1" />
      <div className="ambient-mesh ambient-mesh-2" />

      <Navbar />

      <main style={{ position: "relative", zIndex: 1, flex: 1 }}>
        <Suspense fallback={<PageSkeleton />}>
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
              path="/triage"
              element={
                <ProtectedRoute>
                  <TriagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prevention"
              element={
                <ProtectedRoute>
                  <PreventionPage />
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
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
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
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
