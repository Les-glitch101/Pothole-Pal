import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";

function Login() {
  const { resident, signIn } = useFlow();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (resident) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await api("/auth/login", {
        method: "POST",
        body: { email, password },
        role: "resident",
      });
      if (session.user.role === "staff") {
        setError("That is a staff account. Sign in through the municipality portal instead.");
        return;
      }
      signIn("resident", session);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 pt-16">
      <div className="flex flex-col items-center">
        <img src="/logo-96.png" alt="" className="h-16 w-16 object-contain" />
        <h1 className="mt-4 text-2xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to report and track potholes</p>
      </div>

      <form onSubmit={submit} className="mt-8">
        <label className="block text-xs font-bold text-muted" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-primary"
        />

        <label className="mt-5 block text-xs font-bold text-muted" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          className="mt-1.5 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-primary"
        />

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-line bg-slate-50 p-4 text-xs leading-relaxed text-muted">
        <p className="font-bold text-ink">Demo resident account</p>
        <p className="mt-1 font-mono">alex@potholepal.test / resident123</p>
        <button
          type="button"
          onClick={() => navigate("/staff")}
          className="mt-3 font-bold text-primary hover:underline"
        >
          Staff member? Use the municipality portal
        </button>
      </div>

      <div className="pb-8" />
    </div>
  );
}

export default Login;
