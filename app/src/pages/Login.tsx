import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useLogin, useSession } from "../hooks/useSession";
import { IconSignal } from "../components/icons";

export function Login() {
  const { data } = useSession();
  const login = useLogin();
  const [password, setPassword] = useState("");

  if (data?.authenticated) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    login.mutate(password);
  }

  return (
    <div className="login-screen">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="brand">
          <div className="brand-mark">
            <IconSignal stroke="#fff" />
          </div>
          <div>
            <div className="brand-name">Prospecting Console</div>
            <div className="brand-tag">evidence&#8209;grounded diagnostics</div>
          </div>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {login.isError && <div className="field-error">Incorrect password.</div>}
        </div>
        <button className="btn btn-primary" type="submit" disabled={login.isPending || password.length === 0}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
