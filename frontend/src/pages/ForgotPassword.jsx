import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

// STUB: backend/src/routes/auth.routes.js has no password-reset endpoint yet
// (only /signup, /login, /me, /employees, /change-password). This screen is
// wired up on the frontend but intentionally doesn't call anything, so it
// can't fake a success message. Needs a backend route — e.g.
// POST /api/auth/forgot-password — before this can go live.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/login" className="auth-back-link">
          ← Back to Sign In
        </Link>
        <div className="auth-brand">
          <h1>Reset your password</h1>
        </div>
        {submitted ? (
          <div className="auth-note">
            Password reset isn't available yet — the backend doesn't have this route built.
            Contact your admin to have them reset your password from the employee directory
            in the meantime.
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="resetEmail">Email</label>
              <input
                id="resetEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-submit">
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
