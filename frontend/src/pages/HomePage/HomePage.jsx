import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../../api";
import Button from "../../components/Button/Button";
import Footer from "../../components/Footer/Footer";
import FormInput from "../../components/FormInput/FormInput";
import { useAuth } from "../../context/AuthContext";
import { EMPTY_AUTH_FORM } from "../../utils/constants";
import "./HomePage.css";

export default function HomePage() {
  // Get session data from authContext and the navigation function to redirect.
  const { session, setSession } = useAuth();
  const navigate = useNavigate();

  // state variables
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(EMPTY_AUTH_FORM);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // If user already logged in, why they need to be on login/register page?
  // Redirect them
  if (session) {
    return <Navigate to="/app" replace />;
  }

  // For controlled inputs in login/signup form, updates authForm state variable.
  function updateAuth(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  // Submit the login/register form.
  async function submitAuth(event) {
    event.preventDefault();

    setAuthLoading(true);
    setAuthError("");

    try {

      // intresting code to deal with both register or login cases, i think you can understand it
      const payload =    
        authMode === "register" ? authForm : { email: authForm.email, password: authForm.password };
      const data = authMode === "register" ? await api.register(payload) : await api.login(payload);  
      const profile = await api.getUser(data.userId);
      // api is a very useful module, that you can reuse to make api request calls, check it out.
      // will just have to modify a bit for every app.


      // update session after login/register. 
      // if you remember, this will trigger useEffect in authContext provider,
      // updating session in local storage. 
      setSession({
        token: data.token,
        userId: data.userId,
        name: profile?.user?.name || authForm.name || "Member",
      });

      // Reset the form and move into the app after success.
      setAuthForm(EMPTY_AUTH_FORM);
      navigate("/app", { replace: true });
    } catch (error) {
      // Show the backend error message directly, if failed. 
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  // simple html, css here now. 
  return (  
    <div className="auth-screen">
      <div className="auth-topbar">
        <p className="brand-wordmark">NOTETHEMOOD</p>
      </div>

      <div className="page-frame auth-frame">
        <section className="surface auth-card auth-card-minimal">
          <div className="auth-intro">
            <h1>{authMode === "login" ? "Sign in" : "Create an account"}</h1>
            <p>
              A personal space to capture your thoughts and mood. Share what you want, keep the rest just for
              you.
            </p>
          </div>

          <div className="segmented auth-segmented" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={authMode === "login" ? "segmented-active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={authMode === "register" ? "segmented-active" : ""}
              onClick={() => setAuthMode("register")}
            >
              Sign up
            </button>
          </div>

          <form className="form auth-form" onSubmit={submitAuth}>
            {authMode === "register" ? (
              <FormInput
                label="Name"
                type="text"
                value={authForm.name}
                onChange={(event) => updateAuth("name", event.target.value)}
                placeholder="Your name"
                required
              />
            ) : null}

            <FormInput
              label="Email"
              type="email"
              value={authForm.email}
              onChange={(event) => updateAuth("email", event.target.value)}
              placeholder="you@example.com"
              required
            />

            <FormInput
              label="Password"
              type="password"
              value={authForm.password}
              onChange={(event) => updateAuth("password", event.target.value)}
              placeholder="At least 8 characters"
              required
            />

            {authError ? <div className="notice notice-error">{authError}</div> : null}

            <Button type="submit" disabled={authLoading} className="button-block">
              {authLoading ? "Working..." : authMode === "register" ? "Create account" : "Sign in"}
            </Button>
          </form>
        </section>

        <Footer />
      </div>
    </div>
  );
}
