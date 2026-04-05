import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  // Keep app-wide state providers at the top so pages can share auth/session data.
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
