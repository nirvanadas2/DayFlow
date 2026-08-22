import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/auth.css";

function SignInForm({ onSwitch }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(identifier, password);
      if (user.mustChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        navigate(user.role === "admin" ? "/admin" : "/employee", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}
      <div className="auth-field">
        <label htmlFor="identifier">Login ID or Email</label>
        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <button type="submit" className="auth-submit" disabled={submitting}>
        {submitting ? "Signing In…" : "Sign In"}
      </button>
      <div className="auth-switch">
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
      <div className="auth-switch">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitch}>
          Sign Up
        </button>
      </div>
    </form>
  );
}

const MAX_LOGO_BYTES = 1.5 * 1024 * 1024;

function SignUpForm({ onSwitch }) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > MAX_LOGO_BYTES) {
      setError("Logo must be under 1.5MB.");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await signup({
        companyName: form.companyName,
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        companyLogo: logoDataUrl || undefined,
      });
      navigate(user.role === "admin" ? "/admin" : "/employee", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}
      <div className="auth-row">
        <div className="auth-field">
          <label htmlFor="companyName">Company Name</label>
          <input
            id="companyName"
            type="text"
            value={form.companyName}
            onChange={update("companyName")}
            required
          />
        </div>
        <div className="auth-logo-upload">
          <button type="button" onClick={() => document.getElementById("companyLogo").click()}>
            Upload Logo
          </button>
          <input id="companyLogo" type="file" accept="image/*" hidden onChange={handleLogoFile} />
          <span>{logoFile ? logoFile.name : "No file"}</span>
        </div>
      </div>
      <div className="auth-field">
        <label htmlFor="name">Name</label>
        <input id="name" type="text" value={form.name} onChange={update("name")} required />
      </div>
      <div className="auth-field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={update("email")} required />
      </div>
      <div className="auth-field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" type="tel" value={form.phone} onChange={update("phone")} />
      </div>
      <div className="auth-field">
        <label htmlFor="signupPassword">Password</label>
        <input
          id="signupPassword"
          type="password"
          value={form.password}
          onChange={update("password")}
          autoComplete="new-password"
          required
        />
      </div>
      <div className="auth-field">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          autoComplete="new-password"
          required
        />
      </div>
      <button type="submit" className="auth-submit" disabled={submitting}>
        {submitting ? "Signing Up…" : "Sign Up"}
      </button>
      <div className="auth-switch">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch}>
          Sign In
        </button>
      </div>
    </form>
  );
}

export default function Login() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Dayflow</h1>
        </div>
        <div className="auth-toggle">
          <button
            type="button"
            className={mode === "signin" ? "active" : ""}
            onClick={() => setMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>
        {mode === "signin" ? (
          <SignInForm onSwitch={() => setMode("signup")} />
        ) : (
          <SignUpForm onSwitch={() => setMode("signin")} />
        )}
      </div>
    </div>
  );
}
