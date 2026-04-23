import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  // Authentication provider Wraps the app routes so all child pages/components have access to auth context
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
