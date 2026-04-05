import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HomePage from "../pages/HomePage/HomePage";
import NotesPage from "../pages/NotesPage/NotesPage";

function RouteGuard({ children, requireAuth }) {
  const { isAuthenticated } = useAuth();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return children;
}

export default function AppRoutes() {
  // Route guards keep the auth screen and dashboard separated cleanly.
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RouteGuard requireAuth={false}>
            <HomePage />
          </RouteGuard>
        }
      />
      <Route
        path="/app"
        element={
          <RouteGuard requireAuth>
            <NotesPage />
          </RouteGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
