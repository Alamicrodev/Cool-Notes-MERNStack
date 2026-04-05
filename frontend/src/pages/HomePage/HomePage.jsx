import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../../api";
import Button from "../../components/Button/Button";
import FormInput from "../../components/FormInput/FormInput";
import { useAuth } from "../../context/AuthContext";
import { EMPTY_AUTH_FORM } from "../../utils/constants";
import "./HomePage.css";

export default function HomePage() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(EMPTY_AUTH_FORM);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  if (session) {
    return <Navigate to="/app" replace />;
  }

  function updateAuth(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      // Login and register both return a token and user id.
      const payload =
        authMode === "register" ? authForm : { email: authForm.email, password: authForm.password };
      const data = authMode === "register" ? await api.register(payload) : await api.login(payload);
      const profile = await api.getUser(data.userId);

      setSession({
        token: data.token,
        userId: data.userId,
        name: profile?.user?.name || authForm.name || "Member",
      });

      setAuthForm(EMPTY_AUTH_FORM);
      navigate("/app", { replace: true });
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <div className="auth-copy">
          <p className="eyebrow">NoteTheMood</p>
          <h1>Minimal notes for clear thinking.</h1>
          <p>
            Sign in or create an account to manage private notes, or browse public notes without
            getting pulled into a cluttered interface.
          </p>
        </div>

        <section className="surface auth-card">
          <div className="segmented auth-segmented">
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

          <form className="form" onSubmit={submitAuth}>
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
      </div>
    </div>
  );
}
