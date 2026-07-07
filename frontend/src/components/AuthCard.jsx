import { useState } from "react";

import { useAuth } from "../context/AuthContext";

export default function AuthCard() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [adminPermissionCode, setAdminPermissionCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await signup(firstName, lastName, username, password, adminPermissionCode);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-card">
      <h1>School Election System</h1>
      <p>Secure login for students and admins to run digital school elections.</p>

      <div className="auth-switch">
        <button
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
          type="button"
        >
          Login
        </button>
        <button
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
          type="button"
        >
          Signup
        </button>
      </div>

      <form onSubmit={submit} className="auth-form">
        {mode === "signup" && (
          <>
            <label>
              First Name
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required={mode === "signup"}
                minLength={1}
              />
            </label>

            <label>
              Last Name
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required={mode === "signup"}
                minLength={1}
              />
            </label>

            <label>
              Admin Permission Code
              <input
                value={adminPermissionCode}
                onChange={(e) => setAdminPermissionCode(e.target.value)}
                required={mode === "signup"}
                minLength={4}
              />
            </label>
          </>
        )}

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {error && <div className="error-box">{error}</div>}

        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>
    </section>
  );
}
