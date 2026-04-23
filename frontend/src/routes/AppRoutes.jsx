import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HomePage from "../pages/HomePage/HomePage";
import NotesPage from "../pages/NotesPage/NotesPage";


// redirect if you are going to a page you are not allowed to go. 
// might have to change for different apps having different pages. 
function RouteGuard({ children, requireAuth }) {
  const { isAuthenticated } = useAuth();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/" replace />;           // replace erases the current page from browser memory stack 
  }                                               // and replaces with redirected one, because you were not supposed 
                                                  // to route to that page in the first place (without authentication) 
  if (!requireAuth && isAuthenticated) {          // so pressing back on browser you won't be able to go to that page. 
    return <Navigate to="/app" replace />;      
  }

  return children;   
}


export default function AppRoutes() {
  
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
            {/* if route guard passes auth test and returns children, then it goes to children */}
            <NotesPage />
          </RouteGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
