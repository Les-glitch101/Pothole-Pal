import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";
import { EyeIcon, EyeOffIcon } from "../lib/icons";

/**
 * One sign-in screen for every side of the system. The role comes back from
 * the database with the session: staff accounts open the Staff Portal, field
 * teams (teama@staff.com - teamh@staff.com) open the Team Portal, and
 * residents continue to the app.
 */
function Login() {
  const { resident, staff, team, signIn } = useFlow();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (resident) return <Navigate to="/" replace />;
  if (staff) return <Navigate to="/staff" replace />;
  if (team) return <Navigate to="/team" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await api("/auth/login", {
        method: "POST",
        body: { email, password },
        noRedirect: true,
      });
      const lane =
        session.user.role === "staff" ? "staff" : session.user.role === "team" ? "team" : "resident";
      signIn(lane, session);
      navigate(lane === "staff" ? "/staff" : lane === "team" ? "/team" : "/", { replace: true });
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

        <div className="mt-5 flex items-center justify-between">
          <label className="text-xs font-bold text-muted" htmlFor="password">
            Password
          </label>
          <button
            type="button"
            onClick={() => navigate("/forgot")}
            className="text-xs font-bold text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative mt-1.5">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full rounded-2xl border border-line px-4 py-3 pr-11 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
          >
            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>

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

      <p className="mt-5 text-center text-sm text-muted">
        New here?{" "}
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="font-bold text-primary hover:underline"
        >
          Create an account
        </button>
      </p>

      <div className="pb-8" />
    </div>
  );
}

export default Login;
